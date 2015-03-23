var mongoose = require('mongoose');

var UnitSchema = new mongoose.Schema({
  unit_en: String,
  unit_de: String,
  unit_fi: String,
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Unit', UnitSchema);

