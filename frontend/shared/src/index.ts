// Shared types, interfaces, and utility functions for Recipe App

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  dishType?: string;
  tags?: string[];
}

export interface Ingredient {
  id: string;
  name: string;
  unit?: string;
  quantity?: number;
}

export interface ShoppingListItem {
  ingredientId: string;
  quantity: number;
  unit?: string;
  checked?: boolean;
}

export const formatRecipeName = (name: string): string => 
  name.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

export const calculateRecipeServings = (recipe: Recipe, servings: number): Ingredient[] => {
  // Placeholder for future implementation of recipe scaling
  return [];
};
