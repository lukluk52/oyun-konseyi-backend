const express = require('express');
const Comment = require('../models/Comment');
const router = express.Router();

// Belirli bir tartışmaya ait yorumları getir (herkese açık)
router.get('/discussion/:discussionId', async (req, res) => {
  try {
    const comments = await Comment.find({ discussion: req.params.discussionId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni yorum ekle (giriş yapmış kullanıcılar için)
router.post('/', async (req, res) => {
  try {
    const { discussion, content, author } = req.body;
    if (!discussion || !content) {
      return res.status(400).json({ message: 'Tartışma ve içerik zorunludur.' });
    }
    const comment = await Comment.create({
      discussion,
      content,
      author: author || 'Anonim'
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;