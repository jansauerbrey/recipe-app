import { MongoClient, Collection, ObjectId } from "https://deno.land/x/mongo@v0.32.0/mod.ts";
import { Recipe, IRecipeRepository } from "../../types/mod.ts";

export class RecipeRepository implements IRecipeRepository {
  private collection: Collection<Omit<Recipe, "id"> & { _id: ObjectId }>;

  constructor(db: MongoClient) {
    const dbName = Deno.env.get("MONGO_DB_NAME") || "recipe-app-test";
    this.collection = db.database(dbName).collection("recipes");
    console.log("Using database:", dbName);
    console.log("Database connection info:", {
      name: dbName,
      collections: db.database(dbName).listCollections()
    });
  }

  private toRecipe(doc: { _id: ObjectId | string } & Omit<Recipe, "id"> | null): Recipe | null {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return {
      id: _id instanceof ObjectId ? _id.toString() : _id.toString(),
      ...rest,
    };
  }

  private isValidObjectId(id: string): boolean {
    try {
      new ObjectId(id);
      return true;
    } catch {
      return false;
    }
  }

  async create(recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">): Promise<Recipe> {
    const now = new Date();
    const doc = {
      ...recipe,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = await this.collection.insertOne(doc);
      const objectId = result.$oid ? new ObjectId(result.$oid) : result;
      const inserted = await this.collection.findOne({ _id: objectId });
      
      if (!inserted) {
        throw new Error("Failed to create recipe");
      }

      const created = this.toRecipe(inserted);
      if (!created) {
        throw new Error("Failed to create recipe");
      }

      return created;
    } catch (error) {
      console.error("Error creating recipe:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<Recipe | null> {
    if (!this.isValidObjectId(id)) {
      return null;
    }

    try {
      const doc = await this.collection.findOne({ 
        _id: new ObjectId(id)
      });
      return this.toRecipe(doc);
    } catch (error) {
      console.error("Error finding recipe:", error);
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Recipe[]> {
    try {
      const docs = await this.collection.find({ userId }).toArray();
      return docs
        .map(doc => this.toRecipe(doc))
        .filter((recipe): recipe is Recipe => recipe !== null);
    } catch (error) {
      console.error("Error finding recipes by user:", error);
      return [];
    }
  }

  async update(id: string, recipe: Partial<Recipe>): Promise<Recipe> {
    if (!this.isValidObjectId(id)) {
      throw new Error("Invalid recipe ID");
    }

    const updateDoc = {
      ...recipe,
      updatedAt: new Date(),
    };

    try {
      const objectId = new ObjectId(id);
      const { modifiedCount } = await this.collection.updateOne(
        { _id: objectId },
        { $set: updateDoc }
      );

      if (modifiedCount === 0) {
        throw new Error("Recipe not found");
      }

      const updated = await this.collection.findOne({ _id: objectId });
      const result = this.toRecipe(updated);
      if (!result) {
        throw new Error("Recipe not found after update");
      }
      return result;
    } catch (error) {
      console.error("Error updating recipe:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!this.isValidObjectId(id)) {
        return false;
      }

      // First check if recipe exists
      const recipe = await this.findById(id);
      if (!recipe) {
        return false;
      }

      const objectId = new ObjectId(id);
      const result = await this.collection.deleteOne({
        _id: objectId
      });

      console.log("Delete operation result:", {
        id,
        objectId: objectId.toString(),
        result: typeof result === 'number' ? result : result.deletedCount
      });

      return typeof result === 'number' ? result > 0 : result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting recipe:", error);
      return false;
    }
  }
}
