const express = require('express');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const router = express.Router();

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

router.post('/', async (req, res) => {
  try {
    const { discussion, content, author, authorId } = req.body;
    if (!discussion || !content) {
      return res.status(400).json({ message: 'Tartışma ve içerik zorunludur.' });
    }
    const comment = await Comment.create({ discussion, content, author: author || 'Anonim', authorId });

    // Bildirim gönder (yorum)
    const Discussion = require('../models/Discussion');
    const disc = await Discussion.findById(discussion);
    if (disc && disc.authorId && disc.authorId.toString() !== authorId) {
      await Notification.create({
        recipient: disc.authorId,
        sender: author || 'Anonim',
        type: 'comment',
        message: `${author || 'Birisi'} yorum yaptı.`,
        link: `/discussion/${discussion}`
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findByIdAndUpdate(req.params.id, { content }, { new: true });
    if (!comment) return res.status(404).json({ message: 'Yorum bulunamadı' });
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.post('/:id/like', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Bulunamadı' });
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ message: 'userId gerekli' });
    const index = comment.likes.indexOf(userId);
    if (index === -1) {
      comment.likes.push(userId);
    } else {
      comment.likes.splice(index, 1);
    }
    await comment.save();
    res.json({ likes: comment.likes, count: comment.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;