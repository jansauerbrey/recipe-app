import { MongoClient } from '@mongo/mod.ts';
import { faker } from 'https://cdn.skypack.dev/@faker-js/faker@v7.6.0';

// Connect to MongoDB
const client = new MongoClient();
await client.connect(Deno.env.get('MONGODB_URI') || 'mongodb://localhost:27018');
const db = client.database('recipe-app');
const recipesCollection = db.collection('recipes');

// Generate sample recipes
const userId = '676db506875d91f71db0a489'; // User ID from auth token

const recipes = Array.from({ length: 20 }).map(() => ({
  userId,
  name: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  instructions: faker.lorem.paragraphs(3),
  prepTime: faker.datatype.number(60) + 10,
  cookTime: faker.datatype.number(120) + 10,
  servings: faker.datatype.number(8) + 1,
  imagePath: faker.image.food(),
  dishTypeId: faker.helpers.arrayElement([
    '56294bad07ee48b60ec4405b', // Breakfast
    '56293446137c052908b75e22', // Main Dishes
    '562940cc4bdc01930dca94d9', // Side Dishes
    '562940db4bdc01930dca94da', // Salads
    '562940ee4bdc01930dca94db', // Desserts
  ]),
  category: faker.helpers.arrayElement(['breakfast', 'maindishes', 'sidedishes', 'salads', 'desserts', 'snacks', 'breads', 'appetizer', 'drinks', 'other']),
  new_recipe: faker.datatype.boolean(),
  fav_recipe: faker.datatype.boolean(),
  createdAt: new Date(),
  updatedAt: new Date()
}));

// Insert sample recipes
const result = await recipesCollection.insertMany(recipes);
console.log(`Inserted ${result.insertedIds.length} recipes`);
console.log('First inserted recipe:', recipes[0]);

// Close the connection
await client.close();
