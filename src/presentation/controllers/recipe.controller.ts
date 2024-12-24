import { Context, RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { BaseController } from "./base.controller.ts";
import { IRecipeService, Recipe, CreateRecipeDTO, UpdateRecipeDTO } from "../../types/mod.ts";

export class RecipeController extends BaseController {
  constructor(private recipeService: IRecipeService) {
    super();
  }

  async create(ctx: Context) {
    const body = await this.getRequestBody<Omit<CreateRecipeDTO, "userId">>(ctx);
    if (!body) {
      return await this.badRequest(ctx, "Invalid request body");
    }

    // Get user ID from auth context
    const userId = ctx.state.user?.id;
    if (!userId) {
      return await this.unauthorized(ctx, "User ID not found in auth context");
    }

    try {
      const recipe = await this.recipeService.createRecipe({
        ...body,
        userId,
      });
      await this.created(ctx, recipe);
    } catch (error) {
      await this.internalServerError(ctx, error.message);
    }
  }

  async getById(ctx: RouterContext<"/recipes/:id">) {
    const id = ctx.params.id;
    try {
      const recipe = await this.recipeService.getRecipe(id);
      if (!recipe) {
        return await this.notFound(ctx, "Recipe not found");
      }
      await this.ok(ctx, recipe);
    } catch (error) {
      await this.internalServerError(ctx, error.message);
    }
  }

  async update(ctx: RouterContext<"/recipes/:id">) {
    const id = ctx.params.id;
    const body = await this.getRequestBody<UpdateRecipeDTO>(ctx);
    if (!body) {
      return await this.badRequest(ctx, "Invalid request body");
    }

    try {
      const recipe = await this.recipeService.updateRecipe(id, body);
      await this.ok(ctx, recipe);
    } catch (error) {
      if (error.message.includes("not found")) {
        await this.notFound(ctx, error.message);
      } else {
        await this.internalServerError(ctx, error.message);
      }
    }
  }

  async delete(ctx: RouterContext<"/recipes/:id">) {
    const id = ctx.params.id;
    try {
      const deleted = await this.recipeService.deleteRecipe(id);
      if (!deleted) {
        return await this.notFound(ctx, "Recipe not found");
      }
      await this.noContent(ctx);
    } catch (error) {
      await this.internalServerError(ctx, error.message);
    }
  }

  async listUserRecipes(ctx: Context) {
    // Get user ID from auth context
    const userId = ctx.state.user?.id;
    if (!userId) {
      return await this.unauthorized(ctx, "User ID not found in auth context");
    }

    try {
      const recipes = await this.recipeService.listRecipes(userId);
      await this.ok(ctx, recipes);
    } catch (error) {
      await this.internalServerError(ctx, error.message);
    }
  }

  // Additional endpoints could include:
  // - Search recipes by tags
  // - Get popular recipes
  // - Get recent recipes
  // - Get recipes by ingredient
}
