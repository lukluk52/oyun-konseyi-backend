const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  content: { type: String, required: true, maxlength: 2000 },
  author: { type: String, default: 'Anonim' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  game: { type: String, default: 'Genel' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('Discussion', discussionSchema);