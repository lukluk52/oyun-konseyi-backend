require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const commentRoutes = require('./routes/comments');
const discussionRoutes = require('./routes/discussions');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => res.send('🎮 Oyun Konseyi API çalışıyor!'));

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`));