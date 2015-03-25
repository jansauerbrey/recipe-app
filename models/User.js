var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true } 
  fullname: String,
  email: String,
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);

