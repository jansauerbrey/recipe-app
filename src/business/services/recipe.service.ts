import { Recipe, IRecipeService, IRecipeRepository } from "../../types/mod.ts";

export class RecipeService implements IRecipeService {
  constructor(private recipeRepository: IRecipeRepository) {}

  async createRecipe(recipeData: Omit<Recipe, "id" | "createdAt" | "updatedAt">): Promise<Recipe> {
    // Validate recipe data
    this.validateRecipe(recipeData);

    // Create recipe
    return await this.recipeRepository.create(recipeData);
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    return await this.recipeRepository.findById(id);
  }

  async updateRecipe(id: string, recipeData: Partial<Recipe>): Promise<Recipe> {
    // Get existing recipe
    const existingRecipe = await this.recipeRepository.findById(id);
    if (!existingRecipe) {
      throw new Error("Recipe not found");
    }

    // If updating core recipe data, validate it
    if (recipeData.title || recipeData.ingredients || recipeData.instructions) {
      this.validateRecipe({
        ...existingRecipe,
        ...recipeData,
      });
    }

    // Update recipe
    return await this.recipeRepository.update(id, recipeData);
  }

  async deleteRecipe(id: string): Promise<boolean> {
    // Check if recipe exists first
    const recipe = await this.recipeRepository.findById(id);
    if (!recipe) {
      return false;
    }
    return await this.recipeRepository.delete(id);
  }

  async listRecipes(userId: string): Promise<Recipe[]> {
    return await this.recipeRepository.findByUserId(userId);
  }

  private validateRecipe(recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) {
    // Title validation
    if (!recipe.title || recipe.title.trim().length < 3) {
      throw new Error("Recipe title must be at least 3 characters long");
    }

    // Ingredients validation
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      throw new Error("Recipe must have at least one ingredient");
    }

    for (const ingredient of recipe.ingredients) {
      if (!ingredient.name || ingredient.name.trim().length === 0) {
        throw new Error("All ingredients must have a name");
      }
      if (ingredient.amount <= 0) {
        throw new Error("Ingredient amounts must be greater than 0");
      }
      if (!ingredient.unit || ingredient.unit.trim().length === 0) {
        throw new Error("All ingredients must have a unit");
      }
    }

    // Instructions validation
    if (!recipe.instructions || recipe.instructions.length === 0) {
      throw new Error("Recipe must have at least one instruction");
    }

    for (const instruction of recipe.instructions) {
      if (!instruction || instruction.trim().length === 0) {
        throw new Error("Instructions cannot be empty");
      }
    }

    // Tags validation
    if (recipe.tags) {
      for (const tag of recipe.tags) {
        if (!tag || tag.trim().length === 0) {
          throw new Error("Tags cannot be empty");
        }
      }
    }
  }
}
