import mongoose from 'mongoose';

/**
 * Tag Schema
 * Represents recipe tags for categorization and filtering
 * Includes automatic cleanup of tag references when deleted
 */
const TagSchema = new mongoose.Schema({
  text: { type: String, required: true }, // Tag text/name
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Tag creator
  updated_at: { type: Date, default: Date.now }, // Last modification
});

// Remove tag references from recipes when tag is deleted
TagSchema.pre('remove', async function (next) {
  try {
    await this.model('Recipe').updateMany(
      { tags: this._id },
      { $pull: { tags: this._id } },
    );
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model('Tag', TagSchema);
