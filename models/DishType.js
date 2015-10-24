var mongoose = require('mongoose');

var DishTypeSchema = new mongoose.Schema({
  name: {
	en: String,
	de: String,
	fi: String
	},
  order: Number,
  imagePath: String,
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DishType', DishTypeSchema);

