var mongoose = require('mongoose');

var RecipeSchema = new mongoose.Schema({
  name: String,
  language: String,
  kilocalories: Number,
  carb: Number,
  fat: Number,
  protein: Number,
  cookTime: Number,
  prepTime: Number,
  waitTime: Number,
  totalTime: Number,
  instructions: String,
  yield: Number,
  tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
  ingredients: [{
      ingredient: {type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient'},
      unit: {type: mongoose.Schema.Types.ObjectId, ref: 'Unit'},
      qty: Number
    }],
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Recipe', RecipeSchema);

