var mongoose = require('mongoose');

var TagSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Tag', TagSchema);

