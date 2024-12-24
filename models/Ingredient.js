var mongoose = require('mongoose');

/**
 * Ingredient Schema
 * Defines ingredients with multi-language support and categorization
 * Includes optional integration with REWE shopping system
 */
var IngredientSchema = new mongoose.Schema({
  name: {                    // Multilingual ingredient names
    en: String,             // English name
    de: String,             // German name
    fi: String              // Finnish name
  },
  category: String,         // Main ingredient category
  subcategory: String,      // Secondary categorization
  subsubcategory: String,   // Tertiary categorization
  // REWE supermarket integration fields
  rewe_art_no: Number,      // REWE article number
  rewe_cat_id: Number,      // REWE category ID
  rewe_img_link_xs: String, // Extra small product image
  rewe_img_link_sm: String, // Small product image
  rewe_img_link_md: String, // Medium product image
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},      // Ingredient creator
  updated_at: { type: Date, default: Date.now },                   // Last modification timestamp
  cat: {type: mongoose.Schema.Types.ObjectId, ref: 'Category'}     // Reference to category model
});

module.exports = mongoose.model('Ingredient', IngredientSchema);
