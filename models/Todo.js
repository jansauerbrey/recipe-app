import mongoose from 'mongoose';

/**
 * Todo Schema
 * Simple task tracking model for recipe-related todos
 * Supports task completion status and optional notes
 */
const TodoSchema = new mongoose.Schema({
  name: String, // Task name/description
  completed: { type: Boolean, default: false }, // Task completion status
  note: String, // Additional notes or details
  updated_at: { type: Date, default: Date.now }, // Last modification timestamp
});

export default mongoose.model('Todo', TodoSchema);
