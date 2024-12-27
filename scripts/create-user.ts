import { MongoClient } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { hash } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

async function createUser(email: string, password: string, role: string = 'user') {
  const client = new MongoClient();
  try {
    const { load } = await import('https://deno.land/std@0.208.0/dotenv/mod.ts');
    await load();
    
    const mongoUri = Deno.env.get('MONGODB_URI') || 'mongodb://127.0.0.1:27018/recipe-app';
    const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe-app';
    
    console.log('Connecting to MongoDB:', mongoUri);
    await client.connect(mongoUri);
    const db = client.database(dbName);
    const users = db.collection('users');

    // Hash the provided password
    const hashedPassword = await hash(password);

    // Create user
    const user = {
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Delete existing user if any
    await users.deleteMany({ email });

    // Insert new user
    const result = await users.insertOne(user);
    console.log('User created with ID:', result);

    // Verify user was created
    const createdUser = await users.findOne({ email });
    console.log('Created user:', createdUser);

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await client.close();
  }
}

// Get email, password, and optional role from command line arguments
const email = Deno.args[0];
const password = Deno.args[1];
const role = Deno.args[2];

if (!email || !password) {
  console.error('Usage: deno run --allow-net --allow-read --allow-env create-user.ts <email> <password> [role]');
  Deno.exit(1);
}

createUser(email, password, role);
