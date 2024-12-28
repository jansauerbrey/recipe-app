export interface LocalizedName {
  en: string;
  de: string;
  fi: string;
}

export interface Category {
  _id: string;
  name: LocalizedName;
  parent_id?: string;
  rewe_cat_id: number;
  updated_at: string;
}

export type CreateCategoryInput = Omit<Category, '_id' | 'updated_at'>;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;
