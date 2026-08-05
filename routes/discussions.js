const express = require('express');
const router = express.Router();
const Discussion = require('../models/Discussion');
const Notification = require('../models/Notification');
const adminAuth = require('../middleware/auth');

// Herkese açık listeleme (arama ve filtreleme ile)
router.get('/public', async (req, res) => {
  try {
    const { search, game } = req.query;
    let filter = {};
    if (game && game !== 'Tümü') filter.game = game;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const discussions = await Discussion.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Herkese açık tartışma ekleme
router.post('/public', async (req, res) => {
  try {
    const { title, content, author, authorId, game } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Başlık ve içerik zorunlu.' });
    const discussion = await Discussion.create({
      title,
      content,
      author: author || 'Anonim',
      authorId,
      game: game || 'Genel'
    });
    res.status(201).json(discussion);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tartışma düzenleme
router.put('/:id', async (req, res) => {
  try {
    const { title, content, userId, role } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Bulunamadı' });
    if (role !== 'admin' && discussion.authorId?.toString() !== userId) {
      return res.status(403).json({ message: 'Yetkiniz yok' });
    }
    discussion.title = title || discussion.title;
    discussion.content = content || discussion.content;
    discussion.updatedAt = new Date();
    await discussion.save();
    res.json(discussion);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tartışma silme
router.delete('/:id', async (req, res) => {
  try {
    const { userId, role } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Bulunamadı' });
    if (role !== 'admin' && discussion.authorId?.toString() !== userId) {
      return res.status(403).json({ message: 'Yetkiniz yok' });
    }
    await Discussion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tartışma beğeni
router.post('/:id/like', async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Bulunamadı' });
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ message: 'userId gerekli' });

    if (!Array.isArray(discussion.likes)) discussion.likes = [];

    const index = discussion.likes.indexOf(userId);
    if (index === -1) {
      discussion.likes.push(userId);
    } else {
      discussion.likes.splice(index, 1);
    }
    await discussion.save();

    // Bildirim gönder (beğeni)
    if (discussion.authorId && discussion.authorId.toString() !== userId) {
      await Notification.create({
        recipient: discussion.authorId,
        sender: req.body.senderName || 'Anonim',
        type: 'like',
        message: `${req.body.senderName || 'Birisi'} tartışmanı beğendi.`,
        link: `/discussion/${discussion._id}`
      });
    }

    res.json({ likes: discussion.likes, count: discussion.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Admin listeleme
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const discussions = await Discussion.find().sort({ createdAt: -1 }).limit(50);
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Admin ekleme
router.post('/admin', adminAuth, async (req, res) => {
  try {
    const { title, content, author, game } = req.body;
    const discussion = await Discussion.create({
      title, content, author: author || 'Admin', game: game || 'Genel'
    });
    res.status(201).json(discussion);
  } catch (error) {
    res.status(400).json({ message: 'Geçersiz veri' });
  }
});

// Admin silme
router.delete('/admin/:id', adminAuth, async (req, res) => {
  try {
    await Discussion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;