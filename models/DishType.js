import mongoose from 'mongoose';

const DishTypeSchema = new mongoose.Schema({
  identifier: String,
  name: {
    en: String,
    de: String,
    fi: String,
  },
  order: Number,
  imagePath: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model('DishType', DishTypeSchema);
