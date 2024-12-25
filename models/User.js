/**
 * User Model
 * 
 * Handles user account management including:
 * - Authentication and authorization
 * - Profile information
 * - User preferences and settings
 * - Email verification
 * - Password reset functionality
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10;

// User schema definition with case-insensitive unique username
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    trim: true
  },
  username_lower: { 
    type: String, 
    required: true,
    trim: true,
    index: { unique: true }
  },
  password: { type: String, required: true },
  fullname: String,
  email: String,
  emailNotConfirmed: String,
  emailConfirmationToken: { type: String },
  is_admin: { type: Boolean, default: false },
  is_activated: { type: Boolean, default: false },
  settings: {
    preferredLanguage: String,
    spokenLanguages: [String],
    categoryOrder: [String],
    preferredWeekStartDay: Number,
  	autoupdate: { type: Boolean, default: true }
  },
  favoriteRecipes: [{type: mongoose.Schema.Types.ObjectId, ref: 'Recipe'}],
  autologin: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
  resetPasswordExpires: Date
});

UserSchema.pre('save', function(next) {
  const user = this;
  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.pre('update', function(next) {
  const user = this;
  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(isMatch);
  });
};

module.exports = mongoose.model('User', UserSchema);
