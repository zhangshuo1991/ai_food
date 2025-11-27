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

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
