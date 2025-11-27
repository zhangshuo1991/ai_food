import { FoodItem } from "../types";

// NOTE: Switched to OpenAI GPT model (GPT-4o) as requested.
// Keeping the filename 'geminiService.ts' to maintain import compatibility with App.tsx.

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL_NAME = "gpt-4o";

export const analyzeFoodImage = async (base64Image: string): Promise<FoodItem[]> => {
  // CRITICAL: process.env.API_KEY must be an OpenAI API Key (sk-...) for this to work.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("未配置 API Key。请确保环境变量 API_KEY 已设置为有效的 OpenAI Key。");
  }

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
                  url: `data:image/jpeg;base64,${base64Image}`,
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

    // Clean up markdown code blocks if present
    const cleanedContent = content.replace(/```json|```/g, "").trim();

    try {
      const items = JSON.parse(cleanedContent) as FoodItem[];
      
      // Basic validation to ensure array
      if (!Array.isArray(items)) {
         console.error("Parsed data is not an array:", items);
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
