const express = require('express');
const User = require('../models/User');
const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');
const router = express.Router();

// Kullanıcı profili (genel bilgiler)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcının tartışmaları
router.get('/:id/discussions', async (req, res) => {
  try {
    const discussions = await Discussion.find({ authorId: req.params.id }).sort({ createdAt: -1 });
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcının yorumları
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ authorId: req.params.id })
      .populate('discussion', 'title')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;