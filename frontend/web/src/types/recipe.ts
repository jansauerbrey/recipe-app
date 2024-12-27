export interface RecipeCount {
  all: number;
  my: number;
  new: number;
  favorites: number;
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

export interface DishType {
  _id: string;
  name: {
    en: string;
    de: string;
    fi: string;
  };
  order: number;
  imagePath: string;
  identifier: string;
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
}

export interface TagFilters {
  [key: string]: boolean;
}

export const DISH_TYPES: DishType[] = [
  { _id: 'all', name: { en: 'All Recipes', de: 'Alle Rezepte', fi: 'Kaikki reseptit' }, order: 0, imagePath: '/img/dishtypes/all.jpg', identifier: 'all' },
  { _id: 'my', name: { en: 'My Recipes', de: 'Meine Rezepte', fi: 'Omat reseptit' }, order: 1, imagePath: '/img/dishtypes/my.jpg', identifier: 'my' },
  { _id: 'new', name: { en: 'New Recipes', de: 'Neue Rezepte', fi: 'Uudet reseptit' }, order: 2, imagePath: '/img/dishtypes/new.jpg', identifier: 'new' },
  { _id: 'favorites', name: { en: 'Favorite Recipes', de: 'Lieblingsrezepte', fi: 'Suosikkireseptit' }, order: 3, imagePath: '/img/dishtypes/favorites.jpg', identifier: 'favorites' },
  { _id: '56294bad07ee48b60ec4405b', name: { en: 'Breakfast', de: 'Frühstück', fi: 'Aamiainen' }, order: 4, imagePath: '/img/dishtypes/breakfast.jpg', identifier: 'breakfast' },
  { _id: '56293446137c052908b75e22', name: { en: 'Main Dishes', de: 'Hauptgerichte', fi: 'Pääruoat' }, order: 5, imagePath: '/img/dishtypes/maindishes.jpg', identifier: 'maindishes' },
  { _id: '562940cc4bdc01930dca94d9', name: { en: 'Side Dishes', de: 'Beilagen', fi: 'Lisukkeet' }, order: 6, imagePath: '/img/dishtypes/sidedishes.jpg', identifier: 'sidedishes' },
  { _id: '562940db4bdc01930dca94da', name: { en: 'Salads', de: 'Salate', fi: 'Salaatit' }, order: 7, imagePath: '/img/dishtypes/salads.jpg', identifier: 'salads' },
  { _id: '562940ee4bdc01930dca94db', name: { en: 'Desserts', de: 'Desserts', fi: 'Jälkiruoat' }, order: 8, imagePath: '/img/dishtypes/desserts.jpg', identifier: 'desserts' },
  { _id: '5668a3b36faed8e960d4f213', name: { en: 'Snacks', de: 'Snacks', fi: 'Välipalat' }, order: 9, imagePath: '/img/dishtypes/snacks.jpg', identifier: 'snacks' },
  { _id: '562aabc37a696f1229593c42', name: { en: 'Breads', de: 'Brote', fi: 'Leivät' }, order: 10, imagePath: '/img/dishtypes/breads.jpg', identifier: 'breads' },
  { _id: '562934ae137c052908b75e23', name: { en: 'Appetizer', de: 'Vorspeisen', fi: 'Alkupalat' }, order: 11, imagePath: '/img/dishtypes/appetizer.jpg', identifier: 'appetizer' },
  { _id: '562940bd4bdc01930dca94d8', name: { en: 'Drinks', de: 'Getränke', fi: 'Juomat' }, order: 12, imagePath: '/img/dishtypes/drinks.jpg', identifier: 'drinks' },
  { _id: '5629f52a2b9118f35b96c2ca', name: { en: 'Other', de: 'Sonstiges', fi: 'Muut' }, order: 13, imagePath: '/img/dishtypes/no_image.png', identifier: 'other' }
];
