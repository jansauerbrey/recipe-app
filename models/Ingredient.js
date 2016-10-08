var mongoose = require('mongoose');

var IngredientSchema = new mongoose.Schema({
  name: {
	en: String,
	de: String,
	fi: String
	},
  category: String,
  subcategory: String,
  subsubcategory: String,
  rewe_art_no: Number,
  rewe_cat_id: Number,
  rewe_img_link_xs: String,
  rewe_img_link_sm: String,
  rewe_img_link_md: String,
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  updated_at: { type: Date, default: Date.now },
  cat: {type: mongoose.Schema.Types.ObjectId, ref: 'Category'}
});

module.exports = mongoose.model('Ingredient', IngredientSchema);

