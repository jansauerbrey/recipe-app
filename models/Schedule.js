var mongoose = require('mongoose');

var ScheduleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  recipe: {type: mongoose.Schema.Types.ObjectId, ref: 'Recipe'},
  factor: Number,
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);

