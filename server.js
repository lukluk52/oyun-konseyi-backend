require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const Discussion = require('./models/Discussion');

const app = express();
const PORT = process.env.PORT || 3000;

// Veritabanına bağlan
connectDB();

// CORS - tüm kaynaklara izin ver
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// ===== ŞİFRE AYARI (Admin panel için) =====
const ACCESS_PASSWORD = 'MZEvAswX1sVsEn7K';

// Şifre kontrol middleware
function checkPassword(req, res, next) {
  const password = req.query.password || req.headers['x-admin-password'];
  if (password !== ACCESS_PASSWORD) {
    return res.status(401).json({ message: 'Bu işlem için yetkiniz yok.' });
  }
  next();
}

// ===== HERKESE AÇIK ENDPOINT (SADECE OKUMA) =====
app.get('/api/discussions/public', async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// ===== ADMIN ENDPOINTLERİ (ŞİFRE KORUMALI) =====

// Tüm tartışmaları getir (admin)
app.get('/api/discussions/admin', checkPassword, async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni tartışma ekle (admin)
app.post('/api/discussions/admin', checkPassword, async (req, res) => {
  try {
    const { title, content, author, game } = req.body;
    const newDiscussion = await Discussion.create({
      title,
      content,
      author: author || 'Anonim',
      game: game || 'Genel'
    });
    res.status(201).json(newDiscussion);
  } catch (error) {
    res.status(400).json({ message: 'Geçersiz veri' });
  }
});

// Tartışma sil (admin)
app.delete('/api/discussions/admin/:id', checkPassword, async (req, res) => {
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