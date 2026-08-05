require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const commentRoutes = require('./routes/comments');
const discussionRoutes = require('./routes/discussions');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Veritabanı
connectDB();

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// Rotalar
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => res.send('🎮 Oyun Konseyi API çalışıyor!'));

// ===== Socket.io Sohbet =====
io.on('connection', (socket) => {
  console.log('Yeni kullanıcı bağlandı:', socket.id);

  // Kullanıcı adı kaydet
  socket.on('set-username', (username) => {
    socket.username = username || 'Anonim';
    // Katılma mesajı
    io.emit('chat-message', {
      username: 'Sistem',
      message: `${socket.username} sohbete katıldı.`,
      timestamp: new Date().toISOString()
    });
  });

  // Mesaj al ve tüm kullanıcılara ilet
  socket.on('chat-message', (data) => {
    const messageData = {
      username: socket.username || 'Anonim',
      message: data.message,
      timestamp: new Date().toISOString()
    };
    io.emit('chat-message', messageData);
  });

  // Ayrılma
  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('chat-message', {
        username: 'Sistem',
        message: `${socket.username} sohbetten ayrıldı.`,
        timestamp: new Date().toISOString()
      });
    }
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`));