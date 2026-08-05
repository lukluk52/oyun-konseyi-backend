const express = require('express');
const Discussion = require('../models/Discussion');
const adminAuth = require('../middleware/auth');
const router = express.Router();

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

// Tartışma düzenleme (sahibi veya admin)
router.put('/:id', async (req, res) => {
  try {
    const { title, content, userId, role } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Bulunamadı' });

    // Yetki kontrolü
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

// Tartışma silme (admin zaten adminAuth ile korunuyor, ayrıca public silme yok)
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
    const index = discussion.likes.indexOf(userId);
    if (index === -1) {
      discussion.likes.push(userId);
    } else {
      discussion.likes.splice(index, 1);
    }
    await discussion.save();
    // Hem diziyi hem de uzunluğu gönder
    res.json({ likes: discussion.likes, count: discussion.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Admin listeleme (adminAuth ile korumalı)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const discussions = await Discussion.find().sort({ createdAt: -1 }).limit(50);
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Admin ekleme (adminAuth ile)
router.post('/admin', adminAuth, async (req, res) => {
  try {
    const { title, content, author, game } = req.body;
    const discussion = await Discussion.create({
      title,
      content,
      author: author || 'Admin',
      game: game || 'Genel'
    });
    res.status(201).json(discussion);
  } catch (error) {
    res.status(400).json({ message: 'Geçersiz veri' });
  }
});

// Admin silme (adminAuth ile)
router.delete('/admin/:id', adminAuth, async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndDelete(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Bulunamadı' });
    res.json({ message: 'Silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;