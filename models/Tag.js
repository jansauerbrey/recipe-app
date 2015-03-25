var mongoose = require('mongoose');

var TagSchema = new mongoose.Schema({
  name: {
	en: String,
	de: String,
	fi: String
	},
  description: {
	en: String,
	de: String,
	fi: String
	},
  level: Number,
  parent: {type: mongoose.Schema.Types.ObjectId, ref: 'Tag'},
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Tag', TagSchema);

