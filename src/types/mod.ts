// Core domain types
export interface User {
  id: string;
  username: string;
  email?: string;
  password: string;
  name?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  userId: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  id?: string; // Make id optional since it will be generated
  name: string;
  amount: number;
  unit: string;
}

// DTOs
export interface CreateRecipeDTO {
  title: string;
  description: string;
  ingredients: Omit<Ingredient, "id">[];
  instructions: string[];
  tags: string[];
  userId: string;
}

export interface UpdateRecipeDTO {
  title?: string;
  description?: string;
  ingredients?: Omit<Ingredient, "id">[];
  instructions?: string[];
  tags?: string[];
}

// Service interfaces
export interface IUserService {
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  getUser(idOrEmail: string): Promise<User | null>;
  getUserWithPassword(idOrEmail: string): Promise<(User & { password: string }) | null>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  validatePassword(idOrEmail: string, password: string): Promise<boolean>;
}

export interface IRecipeService {
  createRecipe(recipe: CreateRecipeDTO): Promise<Recipe>;
  getRecipe(id: string): Promise<Recipe | null>;
  updateRecipe(id: string, recipe: UpdateRecipeDTO): Promise<Recipe>;
  deleteRecipe(id: string): Promise<boolean>;
  listRecipes(userId: string): Promise<Recipe[]>;
}

// Repository interfaces
export interface IUserRepository {
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  update(id: string, user: Partial<User>): Promise<User>;
  delete(id: string): Promise<boolean>;
}

export interface IRecipeRepository {
  create(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe>;
  findById(id: string): Promise<Recipe | null>;
  update(id: string, recipe: Partial<Recipe>): Promise<Recipe>;
  delete(id: string): Promise<boolean>;
  findByUserId(userId: string): Promise<Recipe[]>;
}

// Dependency injection types
export interface Dependencies {
  db: any; // Will be properly typed with MongoDB client
  userService: IUserService;
  recipeService: IRecipeService;
  userRepository: IUserRepository;
  recipeRepository: IRecipeRepository;
}
