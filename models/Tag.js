var mongoose = require('mongoose');

var TagSchema = new mongoose.Schema({
  text: { type: String, required: true },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Tag', TagSchema);

