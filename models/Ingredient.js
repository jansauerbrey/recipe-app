var mongoose = require('mongoose');

var IngredientSchema = new mongoose.Schema({
  name: {
	en: String,
	de: String,
	fi: String
	},
  category: {
	en: String,
	de: String,
	fi: String
	},
  subcategory: {
	en: String,
	de: String,
	fi: String
	},
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ingredient', IngredientSchema);

