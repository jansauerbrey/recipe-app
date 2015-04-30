var mongoose = require('mongoose');

var ShopitemSchema = new mongoose.Schema({
  schedule: {type: mongoose.Schema.Types.ObjectId, ref: 'Schedule'},
  recipe: {type: mongoose.Schema.Types.ObjectId, ref: 'Recipe'},
  ingredient: {type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient'},
  unit: {type: mongoose.Schema.Types.ObjectId, ref: 'Unit'},
  amount: Number,
  active: { type: Boolean, default: true },
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Shopitem', ShopitemSchema);

