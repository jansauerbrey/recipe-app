var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;


var UserSchema = new mongoose.Schema({
  username: { type: String, required: true, index: { unique: true } },
  username_lower: { type: String, required: true, index: { unique: true } },
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
  var user = this;
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
  var user = this;
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
