
import { FoodItem, MealRecord, HealthReport } from "../types";

// NOTE: Switched to OpenAI GPT model (GPT-4o) as requested.
// Keeping the filename 'geminiService.ts' to maintain import compatibility with App.tsx.

const DEFAULT_API_BASE_URL = "https://dashscope.aliyuncs.com";
const DEFAULT_PROXY_PATH = "/dashscope-api";
const API_ENDPOINT = "/compatible-mode/v1/chat/completions";
const API_BASE_URL = getApiBaseUrl();
const OPENAI_API_URL = `${API_BASE_URL}${API_ENDPOINT}`;
const MODEL_NAME = "qwen3-vl-flash";

function getApiBaseUrl() {
  try {
    // Prefer explicit env overrides
    const env =
      typeof import.meta !== "undefined"
        ? (import.meta as unknown as { env?: Record<string, string | boolean> }).env
        : undefined;
    if (env) {
      if (env.VITE_DASHSCOPE_BASE_URL) {
        return env.VITE_DASHSCOPE_BASE_URL.replace(/\/$/, "");
      }
      if (env.VITE_DASHSCOPE_PROXY_PATH) {
        return env.VITE_DASHSCOPE_PROXY_PATH.replace(/\/$/, "");
      }
      if (env.DEV) {
        return DEFAULT_PROXY_PATH;
      }
    }
  } catch (e) {
    // Ignore env detection failures
  }

  // Fallback to runtime injected variables (e.g. process.env)
  try {
    if (typeof process !== "undefined" && process.env?.DASHSCOPE_BASE_URL) {
      return process.env.DASHSCOPE_BASE_URL.replace(/\/$/, "");
    }
  } catch (e) {
    // Ignore if process is not defined
  }

  return DEFAULT_API_BASE_URL;
}

const getApiKey = () => {
  let apiKey = '';
  
  // 1. Attempt to read from process.env (Node/Webpack/Create-React-App)
  try {
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || process.env.REACT_APP_API_KEY || '';
    }
  } catch (e) {
    // Ignore errors accessing process
  }

  // 2. Attempt to read from import.meta.env (Vite)
  // Use explicit checks to avoid runtime errors in environments that don't support import.meta
  if (!apiKey) {
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_API_KEY || '';
      }
    } catch (e) {
      // Ignore errors accessing import.meta
    }
  }

  if (!apiKey) {
    console.error("API Key missing. Please set VITE_API_KEY (Vite) or REACT_APP_API_KEY (CRA) in your .env file.");
    throw new Error("未配置 API Key。请在本地环境(.env)中配置 API_KEY (或 VITE_API_KEY)。");
  }
  
  return apiKey;
};

export const analyzeFoodImage = async (imageUri: string): Promise<FoodItem[]> => {
  const apiKey = getApiKey();

  const promptText = `
    你是一位专业的营养师。请分析这张图片中的食物。
    任务：
    1. 识别图中的所有食物项目。
    2. 估算每种食物的分量（如“1碗”，“200g”）。
    3. 估算该分量下的热量(kcal)和主要营养素(蛋白质、碳水、脂肪，单位均为g)。
    4. 提供一句简短的中文健康建议。

    输出要求：
    请直接返回一个纯 JSON 数组，不要包含 Markdown 格式（如 \`\`\`json ... \`\`\`）。
    数组中的每个对象必须严格符合以下结构：
    {
      "name": "食物名称(中文)",
      "portion": "分量描述",
      "nutrition": {
        "calories": 数字,
        "protein": 数字,
        "carbs": 数字,
        "fat": 数字
      },
      "healthTip": "健康建议"
    }

    如果图片中没有可识别的食物，请返回空数组 []。
  `;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content: "你是一个只输出 JSON 数据的 API 接口。"
          },
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              {
                type: "image_url",
                image_url: {
                  url: imageUri, // Pass full Data URL directly
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API Error:", errorData);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error("OpenAI API Key 无效或未授权。");
      }
      if (response.status === 429) {
        throw new Error("请求过于频繁，请稍后再试。");
      }
      
      throw new Error(`识别请求失败: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI 未返回任何识别结果。");
    }

    const cleanedContent = content.replace(/```json|```/g, "").trim();

    try {
      const items = JSON.parse(cleanedContent) as FoodItem[];
      if (!Array.isArray(items)) {
         throw new Error("数据格式错误: 非数组格式");
      }
      return items;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Content:", content);
      throw new Error("无法解析 AI 返回的数据，请重试。");
    }

  } catch (error: any) {
    console.error("Analysis Service Failed:", error);
    throw error;
  }
};

export const generateHealthReport = async (records: MealRecord[]): Promise<HealthReport> => {
  const apiKey = getApiKey();

  // Prepare data: Strip heavy image data to save tokens
  const simplifiedRecords = records.map(r => ({
    time: new Date(r.timestamp).toLocaleString('zh-CN'),
    type: r.mealType,
    foods: r.items.map(i => `${i.name} (${i.portion})`).join(', '),
    totalNutrition: r.totalNutrition
  }));

  const promptText = `
    作为一名高级营养师，请根据以下用户的近期饮食记录生成一份深度健康分析报告。
    
    饮食数据：
    ${JSON.stringify(simplifiedRecords, null, 2)}
    
    任务：
    1. **综合评分**：根据饮食均衡度、规律性和热量控制给出一个健康得分（0-100）。
    2. **总体总结**：用一两句话总结该段时间的饮食特点。
    3. **深度分析（关键任务）**：
       - **蔬果摄入**：分析蔬菜和水果的摄入频率和种类是否充足。
       - **水分与补给**：根据食物（如汤、粥、饮料、高水分水果）估算水分摄入是否足够。
       - **食材多样性**：分析蛋白质来源（红肉/白肉/豆类）和主食（精制/全谷物）的多样性。
    4. **发现趋势**：列出3个具体的观察点。
    5. **改进建议**：给出3条可执行的建议。

    输出要求：
    返回纯 JSON 对象，格式如下：
    {
      "score": 85,
      "summary": "...",
      "specificAnalysis": {
         "fruitVeggie": "评价文本（例如：蔬菜摄入量严重不足，仅在午餐有少量...）",
         "hydration": "评价文本（例如：水分摄入主要依靠含糖饮料，建议增加白开水...）",
         "variety": "评价文本"
      },
      "trends": ["...", "...", "..."],
      "suggestions": ["...", "...", "..."]
    }
  `;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
           { role: "system", content: "你是一个专业的营养评估助手，只返回 JSON 格式。" },
           { role: "user", content: promptText }
        ],
        max_tokens: 1500,
        temperature: 0.5
      })
    });

    if (!response.ok) {
       throw new Error("生成报告失败，请稍后重试。");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const cleanedContent = content.replace(/```json|```/g, "").trim();
    
    const report = JSON.parse(cleanedContent) as Omit<HealthReport, 'dateRange'>;
    
    // Calculate date range string for display
    const dates = records.map(r => r.timestamp);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const dateRange = `${minDate.getMonth()+1}.${minDate.getDate()} - ${maxDate.getMonth()+1}.${maxDate.getDate()}`;

    return { ...report, dateRange };

  } catch (error) {
    console.error("Report Generation Failed:", error);
    throw error;
  }
};
