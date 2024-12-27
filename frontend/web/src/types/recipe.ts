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
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
}

export interface Author {
  _id: string;
  fullname: string;
}

export interface Tag {
  text: string;
  count: number;
}

export interface Recipe {
  _id: string;
  name: string;
  author: Author;
  imagePath: string;
  fav_recipe: boolean;
  tags: string[];
}

export interface RecipeSearchFilters {
  name?: string;
  author?: {
    fullname?: string;
    _id?: string;
  };
}

export interface TagFilters {
  [key: string]: boolean;
}

export const DISH_TYPES: DishType[] = [
  { id: 'all', name: 'All Recipes', slug: 'all', imageUrl: '/img/dishtypes/all.jpg' },
  { id: 'my', name: 'My Recipes', slug: 'my', imageUrl: '/img/dishtypes/my.jpg' },
  { id: 'new', name: 'New Recipes', slug: 'new', imageUrl: '/img/dishtypes/new.jpg' },
  { id: 'favorites', name: 'Favorite Recipes', slug: 'favorites', imageUrl: '/img/dishtypes/favorites.jpg' },
  { id: '56294bad07ee48b60ec4405b', name: 'Breakfast', slug: 'breakfast', imageUrl: '/img/dishtypes/breakfast.jpg' },
  { id: '56293446137c052908b75e22', name: 'Main Dishes', slug: 'maindishes', imageUrl: '/img/dishtypes/maindishes.jpg' },
  { id: '562940cc4bdc01930dca94d9', name: 'Side Dishes', slug: 'sidedishes', imageUrl: '/img/dishtypes/sidedishes.jpg' },
  { id: '562940db4bdc01930dca94da', name: 'Salads', slug: 'salads', imageUrl: '/img/dishtypes/salads.jpg' },
  { id: '562940ee4bdc01930dca94db', name: 'Desserts', slug: 'desserts', imageUrl: '/img/dishtypes/desserts.jpg' },
  { id: '5668a3b36faed8e960d4f213', name: 'Snacks', slug: 'snacks', imageUrl: '/img/dishtypes/snacks.jpg' },
  { id: '562aabc37a696f1229593c42', name: 'Breads', slug: 'breads', imageUrl: '/img/dishtypes/breads.jpg' },
  { id: '562934ae137c052908b75e23', name: 'Appetizer', slug: 'appetizer', imageUrl: '/img/dishtypes/appetizer.jpg' },
  { id: '562940bd4bdc01930dca94d8', name: 'Drinks', slug: 'drinks', imageUrl: '/img/dishtypes/drinks.jpg' },
  { id: '5629f52a2b9118f35b96c2ca', name: 'Other', slug: 'other', imageUrl: '/img/dishtypes/no_image.png' }
];
