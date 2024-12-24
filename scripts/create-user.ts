import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";
import { hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

async function createUser() {
  const client = new MongoClient();
  try {
    const { load } = await import("https://deno.land/std@0.208.0/dotenv/mod.ts");
    await load();
    
    const mongoUri = Deno.env.get("MONGODB_URI") || "mongodb://127.0.0.1:27018/recipe-app";
    const dbName = Deno.env.get("MONGO_DB_NAME") || "recipe-app";
    
    console.log("Connecting to MongoDB:", mongoUri);
    await client.connect(mongoUri);
    const db = client.database(dbName);
    const users = db.collection("users");

    // Use a verified hash for password "jan"
    const hashedPassword = "$2a$10$CWquAkK6dT.D6OQCREFAWeViG8CbkU6lEHox9WmrMkHzHH4yzSbW.";

    // Create user
    const user = {
      username: "jan",
      password: hashedPassword,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Delete existing user if any
    await users.deleteMany({ username: "jan" });

    // Insert new user
    const result = await users.insertOne(user);
    console.log("User created with ID:", result);

    // Verify user was created
    const createdUser = await users.findOne({ username: "jan" });
    console.log("Created user:", createdUser);

  } catch (error) {
    console.error("Error creating user:", error);
  } finally {
    await client.close();
  }
}

createUser();
