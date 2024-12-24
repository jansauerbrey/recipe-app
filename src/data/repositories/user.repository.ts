import { MongoClient, Collection, ObjectId } from "https://deno.land/x/mongo@v0.32.0/mod.ts";
import { User, IUserRepository } from "../../types/mod.ts";

export class UserRepository implements IUserRepository {
  private collection: Collection<Omit<User, "id"> & { _id: { $oid: string } }>;

  constructor(db: MongoClient) {
    const dbName = Deno.env.get("MONGO_DB_NAME") || "recipe-app";
    console.log("Using database:", dbName);
    const database = db.database(dbName);
    this.collection = database.collection("users");
    console.log("Database connection info:", {
      name: database.name,
      collections: database.listCollectionNames()
    });
  }

  private toUser(doc: { _id: ObjectId | { $oid: string } } & Omit<User, "id">): User {
    const { _id, ...rest } = doc;
    return {
      id: (_id instanceof ObjectId) ? _id.toString() : _id.$oid,
      ...rest,
    };
  }

  async create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const now = new Date();
    const doc = {
      ...user,
      createdAt: now,
      updatedAt: now,
    };

    const { $oid } = await this.collection.insertOne(doc);
    return this.toUser({ _id: { $oid }, ...doc });
  }

  async findById(id: string): Promise<User | null> {
    try {
      const doc = await this.collection.findOne({ _id: { $oid: id } });
      return doc ? this.toUser(doc) : null;
    } catch {
      return null;
    }
  }

  async update(id: string, user: Partial<User>): Promise<User> {
    const updateDoc = {
      ...user,
      updatedAt: new Date(),
    };

    const { modifiedCount } = await this.collection.updateOne(
      { _id: { $oid: id } },
      { $set: updateDoc }
    );

    if (modifiedCount === 0) {
      throw new Error("User not found");
    }

    const updated = await this.collection.findOne({ _id: { $oid: id } });
    if (!updated) {
      throw new Error("User not found after update");
    }

    return this.toUser(updated);
  }

  async delete(id: string): Promise<boolean> {
    const { deletedCount } = await this.collection.deleteOne({
      _id: { $oid: id },
    });
    return deletedCount > 0;
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const doc = await this.collection.findOne({ email });
      return doc ? this.toUser(doc) : null;
    } catch {
      return null;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      console.log("Repository: Looking up user by username:", username);
      // Log the collection name and database
      console.log("Collection:", this.collection.name);
      console.log("Database:", this.collection.dbName);
      
      // List all users in the collection for debugging
      const allUsers = await this.collection.find({}).toArray();
      console.log("All users in collection:", allUsers);
      
      const doc = await this.collection.findOne({ username: username });
      console.log("Repository: Found user:", doc);
      return doc ? this.toUser(doc) : null;
    } catch (error) {
      console.error("Repository: Error finding user by username:", error);
      return null;
    }
  }
}
