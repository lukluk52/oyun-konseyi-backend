const express = require('express');
const Notification = require('../models/Notification');
const router = express.Router();

// Kullanıcının bildirimlerini getir
router.get('/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirimi okundu olarak işaretle
router.put('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Okundu' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Okunmamış bildirim sayısı
router.get('/unread/:userId', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.params.userId, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;