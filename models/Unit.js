var mongoose = require('mongoose');

var UnitSchema = new mongoose.Schema({
  name: {
	en: String,
	de: String,
	fi: String
	},
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Unit', UnitSchema);

