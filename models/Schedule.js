var mongoose = require('mongoose');

/**
 * Schedule Schema
 * Manages meal planning by associating recipes with specific dates
 * Supports serving size adjustments through the factor field
 */
var ScheduleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },                        // Planned date for the meal
  recipe: {type: mongoose.Schema.Types.ObjectId, ref: 'Recipe'},  // Reference to the planned recipe
  factor: Number,                                                 // Serving size multiplier (e.g., 2 for double portions)
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},    // User who created the schedule
  updated_at: { type: Date, default: Date.now }                  // Last modification timestamp
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
