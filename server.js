require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const Discussion = require('./models/Discussion');

const app = express();
const PORT = process.env.PORT || 3000;

// Veritabanına bağlan
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Tüm tartışmaları getir (en yeni en üstte)
app.get('/api/discussions', async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni tartışma ekle
app.post('/api/discussions', async (req, res) => {
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

// Ana sayfa
app.get('/', (req, res) => {
  res.send('🎮 Oyun Konseyi API çalışıyor!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
});