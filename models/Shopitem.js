import mongoose from 'mongoose';

/**
 * Shopitem Schema
 * Represents items in a shopping list, linked to schedules, recipes, and ingredients
 * Supports tracking completion status and expiration dates
 */
const ShopitemSchema = new mongoose.Schema({
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }, // Associated meal schedule
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }, // Source recipe
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' }, // Required ingredient
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }, // Measurement unit
  amount: Number, // Quantity needed
  completed: { type: Boolean, default: false }, // Shopping status
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Item creator
  updated_at: { type: Date, default: Date.now }, // Last modification
  expire_date: { type: Date, default: Date.now }, // Item expiration
});

export default mongoose.model('Shopitem', ShopitemSchema);
