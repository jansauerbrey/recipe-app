var mongoose = require('mongoose');

var TagSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  updated_at: { type: Date, default: Date.now }
});

TagSchema.pre('remove', function(next) {
  var tags = this;
  tags.model('Recipe').update(
    { tags: tags._id}, 
    { $pull: { tags: tags._id } }, 
    { multi: true }, 
    next
  );
  next();
});

module.exports = mongoose.model('Tag', TagSchema);

