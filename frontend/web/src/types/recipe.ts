export interface RecipeFilters {
  all: number;
  my: number;
  new: number;
  favorites: number;
}

export interface RecipeCount extends RecipeFilters {
  breakfast: number;
  maindishes: number;
  sidedishes: number;
  salads: number;
  desserts: number;
  snacks: number;
  breads: number;
  appetizer: number;
  drinks: number;
  other: number;
}

export interface LocalizedName {
  en: string;
  de: string;
  fi: string;
}

export interface FilterType {
  _id: string;
  name: LocalizedName;
  order: number;
  imagePath: string;
  identifier: string;
}

export interface DishType {
  _id: string;
  name: LocalizedName;
  order: number;
  imagePath: string;
  identifier: string;
  author: string;
  updated_at: string;
}

export interface Author {
  _id: string;
  fullname: string;
  email: string;
}

export interface Tag {
  _id: string;
  text: string;
}

export interface Unit {
  _id: string;
  name: {
    en: string;
    de: string;
    fi: string;
  };
}

export interface Ingredient {
  _id: string;
  name: {
    en: string;
    de: string;
    fi: string;
  };
  amount: number;
  unit: Unit;
}

export interface Recipe {
  _id: string;
  language: string;
  name: string;
  instructions: string;
  prepTime: number;
  yield: number;
  totalTime: number;
  author: Author;
  cookTime: number;
  kilocalories: number;
  waitTime: number;
  carb: number;
  fat: number;
  protein: number;
  ingredients: Ingredient[];
  tags: string[];
  dishType: DishType;
  imagePath: string;
  fav_recipe?: boolean;
  updated_at: Date;
}

export interface RecipeFormData extends Omit<Recipe, '_id' | 'author' | 'updated_at'> {
  image?: File;
}

export interface RecipeSearchFilters {
  name?: string;
  author?: {
    fullname?: string;
    _id?: string;
  };
  dishType?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to?: Date;
  };
  favorites?: boolean;
}

export interface TagFilters {
  [key: string]: boolean;
}

export const RECIPE_FILTERS: FilterType[] = [
  { _id: 'all', name: { en: 'All Recipes', de: 'Alle Rezepte', fi: 'Kaikki reseptit' }, order: 0, imagePath: 'all.jpg', identifier: 'all' },
  { _id: 'my', name: { en: 'My Recipes', de: 'Meine Rezepte', fi: 'Omat reseptit' }, order: 1, imagePath: 'my.jpg', identifier: 'my' },
  { _id: 'new', name: { en: 'New Recipes', de: 'Neue Rezepte', fi: 'Uudet reseptit' }, order: 2, imagePath: 'new.jpg', identifier: 'new' },
  { _id: 'favorites', name: { en: 'Favorite Recipes', de: 'Lieblingsrezepte', fi: 'Suosikkireseptit' }, order: 3, imagePath: '/favorites.jpg', identifier: 'favorites' }
];
