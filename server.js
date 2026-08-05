require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const Discussion = require('./models/Discussion');
const authRoutes = require('./routes/auth');   // Giriş/kayıt rotaları

const app = express();
const PORT = process.env.PORT || 3000;

// Veritabanına bağlan
connectDB();

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Auth rotaları (giriş/kayıt)
app.use('/api/auth', authRoutes);

// ===== ŞİFRE AYARI (Admin panel) =====
const ACCESS_PASSWORD = 'benim-gizli-sifrem-2025'; // admin.html'deki ile aynı olacak

function checkPassword(req, res, next) {
  const password = req.query.password || req.headers['x-admin-password'];
  if (password !== ACCESS_PASSWORD) {
    return res.status(401).json({ message: 'Bu işlem için yetkiniz yok.' });
  }
  next();
}

// ===== HERKESE AÇIK =====
app.get('/api/discussions/public', async (req, res) => {
  try {
    const discussions = await Discussion.find().sort({ createdAt: -1 }).limit(50);
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.post('/api/discussions/public', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Başlık ve içerik zorunlu.' });
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

// ===== ADMIN (şifre korumalı) =====
app.get('/api/discussions/admin', checkPassword, async (req, res) => {
  try {
    const discussions = await Discussion.find().sort({ createdAt: -1 }).limit(50);
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.post('/api/discussions/admin', checkPassword, async (req, res) => {
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

app.delete('/api/discussions/admin/:id', checkPassword, async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndDelete(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Bulunamadı' });
    res.json({ message: 'Silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.get('/', (req, res) => res.send('🎮 Oyun Konseyi API çalışıyor!'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
});