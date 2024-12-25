import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  category: String,
  subcategory: String,
  subsubcategory: String,
  rewe_cat_id: Number,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model('Category', CategorySchema);
