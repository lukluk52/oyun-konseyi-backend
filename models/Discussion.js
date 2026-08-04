const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Başlık zorunludur'],
    trim: true,
    maxlength: [100, 'Başlık 100 karakterden uzun olamaz']
  },
  content: {
    type: String,
    required: [true, 'İçerik zorunludur'],
    maxlength: [2000, 'İçerik 2000 karakterden uzun olamaz']
  },
  author: {
    type: String,
    default: 'Anonim'
  },
  game: {
    type: String,
    default: 'Genel'
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Discussion', discussionSchema);