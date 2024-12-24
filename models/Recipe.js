var mongoose = require('mongoose');

/**
 * Recipe Schema
 * Defines the data structure for recipes in the application
 * Includes nutritional information, timing, ingredients, and relationships to other models
 */
var RecipeSchema = new mongoose.Schema({
  name: String,                    // Recipe name
  language: String,                // Recipe language (en/de/fi)
  kilocalories: Number,            // Nutritional information
  carb: Number,                    // Carbohydrates in grams
  fat: Number,                     // Fat in grams
  protein: Number,                 // Protein in grams
  cookTime: Number,                // Active cooking time in minutes
  prepTime: Number,                // Preparation time in minutes
  waitTime: Number,                // Passive waiting time in minutes
  totalTime: Number,               // Total recipe time in minutes
  instructions: String,            // Cooking instructions/steps
  yield: Number,                   // Number of servings
  dishType: {type: mongoose.Schema.Types.ObjectId, ref: 'DishType'},  // Reference to dish category
  imagePath: String,               // Path to recipe image
  tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],         // Array of tag references for categorization
  ingredients: [{                  // List of ingredients with quantities
      ingredient: {type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient'},  // Reference to ingredient
      unit: {type: mongoose.Schema.Types.ObjectId, ref: 'Unit'},             // Reference to measurement unit
      qty: Number                                                            // Quantity needed
    }],
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},    // Recipe creator reference
  updated_at: { type: Date, default: Date.now },                 // Last modification timestamp
});

module.exports = mongoose.model('Recipe', RecipeSchema);
