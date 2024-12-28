import { LocalizedName } from './recipe.ts';

export interface FilterType {
  _id: string;
  name: LocalizedName;
  order: number;
  imagePath: string;
  identifier: string;
}

export const RECIPE_FILTERS: FilterType[] = [
  { _id: 'all', name: { en: 'All Recipes', de: 'Alle Rezepte', fi: 'Kaikki reseptit' }, order: 0, imagePath: '/img/dishtypes/all.jpg', identifier: 'all' },
  { _id: 'my', name: { en: 'My Recipes', de: 'Meine Rezepte', fi: 'Omat reseptit' }, order: 1, imagePath: '/img/dishtypes/my.jpg', identifier: 'my' },
  { _id: 'new', name: { en: 'New Recipes', de: 'Neue Rezepte', fi: 'Uudet reseptit' }, order: 2, imagePath: '/img/dishtypes/new.jpg', identifier: 'new' },
  { _id: 'favorites', name: { en: 'Favorite Recipes', de: 'Lieblingsrezepte', fi: 'Suosikkireseptit' }, order: 3, imagePath: '/img/dishtypes/favorites.jpg', identifier: 'favorites' }
];
