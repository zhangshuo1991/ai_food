
export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  name: string;
  portion: string;
  nutrition: Nutrition;
  healthTip: string;
}

export interface MealRecord {
  id: string;
  timestamp: number;
  imageUri: string; // Base64 or Object URL
  items: FoodItem[];
  totalNutrition: Nutrition;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
}

export interface HealthReport {
  score: number; // 0-100
  summary: string;
  trends: string[]; // e.g., "Protein intake is low in the morning"
  suggestions: string[]; // e.g., "Add an egg to your breakfast"
  dateRange: string;
  specificAnalysis?: {
    fruitVeggie: string; // Analysis of fruit/vegetable intake
    hydration: string;   // Analysis of hydration/water/soup intake
    variety: string;     // Analysis of food variety
  };
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
