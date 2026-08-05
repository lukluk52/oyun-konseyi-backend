require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const Discussion = require('./models/Discussion');
const authRoutes = require('./routes/auth');
const adminAuth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Veritabanına bağlan
connectDB();

// CORS - Authorization header'ına izin ver
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Auth rotaları (giriş/kayıt)
app.use('/api/auth', authRoutes);

// ===== HERKESE AÇIK ENDPOINTLER =====

// Tartışmaları listele (herkese açık)
app.get('/api/discussions/public', async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tartışma ekle (herkese açık)
app.post('/api/discussions/public', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Başlık ve içerik zorunludur.' });
    }
    const newDiscussion = await Discussion.create({
      title,
      content,
      author: author || 'Anonim',
      game: 'Genel'
    });
    res.status(201).json(newDiscussion);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// ===== ADMIN ENDPOINTLERİ (JWT ile korumalı) =====

// Admin: tüm tartışmaları getir
app.get('/api/discussions/admin', adminAuth, async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Admin: yeni tartışma ekle
app.post('/api/discussions/admin', adminAuth, async (req, res) => {
  try {
    const { title, content, author, game } = req.body;
    const newDiscussion = await Discussion.create({
      title,
      content,
      author: author || 'Admin',
      game: game || 'Genel'
    });
    res.status(201).json(newDiscussion);
  } catch (error) {
    res.status(400).json({ message: 'Geçersiz veri' });
  }
});

// Admin: tartışma sil
app.delete('/api/discussions/admin/:id', adminAuth, async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndDelete(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Tartışma bulunamadı' });
    }
    res.json({ message: 'Tartışma silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ana sayfa
app.get('/', (req, res) => {
  res.send('🎮 Oyun Konseyi API çalışıyor!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
});