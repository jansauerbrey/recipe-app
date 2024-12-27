export interface DishType {
  _id: string;
  author: string;
  order: number;
  imagePath: string;
  updated_at: string;
  name: {
    fi: string;
    de: string;
    en: string;
  };
  identifier: string;
}

export interface CreateDishTypeDto {
  order: number;
  imagePath: string;
  name: {
    fi: string;
    de: string;
    en: string;
  };
  identifier: string;
}

export interface UpdateDishTypeDto extends CreateDishTypeDto {
  _id: string;
}
