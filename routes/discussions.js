// Tartışma beğeni (HATA AYIKLANMIŞ HALİ)
router.post('/:id/like', async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Tartışma bulunamadı' });
    }
    
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ message: 'userId zorunludur' });
    }

    // likes dizisi yoksa oluştur (veritabanında eski kayıtlar için)
    if (!Array.isArray(discussion.likes)) {
      discussion.likes = [];
    }

    const index = discussion.likes.indexOf(userId);
    if (index === -1) {
      discussion.likes.push(userId);
    } else {
      discussion.likes.splice(index, 1);
    }
    
    await discussion.save();
    res.json({ likes: discussion.likes, count: discussion.likes.length });
  } catch (error) {
    console.error('Beğeni hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});