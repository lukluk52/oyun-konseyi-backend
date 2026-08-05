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
// Diğer require'ların yanına ekle
const authRoutes = require('./routes/auth');

// app.use(express.json()); satırından hemen sonra ekle
app.use('/api/auth', authRoutes);

// ===== ŞİFRE AYARI (Admin panel için) =====
const ACCESS_PASSWORD = 'MZEvAswX1sVsEn7K'; // admin.html ile aynı olacak

// Şifre kontrol middleware
function checkPassword(req, res, next) {
  const password = req.query.password || req.headers['x-admin-password'];
  if (password !== ACCESS_PASSWORD) {
    return res.status(401).json({ message: 'Bu işlem için yetkiniz yok.' });
  }
  next();
}

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

// ===== ADMIN ENDPOINTLERİ (Şifre korumalı) =====

// Admin: tüm tartışmaları getir
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

// Admin: yeni tartışma ekle
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

// Admin: tartışma sil
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

// Auth işlemleri için API adresi
const AUTH_API = 'https://oyun-konseyi-api.onrender.com/api/auth';

// Token ve kullanıcı bilgisi
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Sayfa yüklendiğinde oturum durumunu güncelle
updateAuthUI();

// Giriş/Kayıt butonlarına tıklama olaylarını bağla
document.getElementById('btn-login')?.addEventListener('click', () => openModal('login'));
document.getElementById('btn-register')?.addEventListener('click', () => openModal('register'));
document.getElementById('btn-logout')?.addEventListener('click', logout);
document.getElementById('close-modal')?.addEventListener('click', closeModal);
document.getElementById('switch-to-register')?.addEventListener('click', () => openModal('register'));
document.getElementById('switch-to-login')?.addEventListener('click', () => openModal('login'));

// Form gönderimleri
document.getElementById('submit-login')?.addEventListener('click', login);
document.getElementById('submit-register')?.addEventListener('click', register);

// Giriş fonksiyonu
async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const res = await fetch(`${AUTH_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      token = data.token;
      currentUser = data.user;
      updateAuthUI();
      closeModal();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Bağlantı hatası.');
  }
}

// Kayıt fonksiyonu
async function register() {
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  try {
    const res = await fetch(`${AUTH_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      token = data.token;
      currentUser = data.user;
      updateAuthUI();
      closeModal();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Bağlantı hatası.');
  }
}

// Çıkış fonksiyonu
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  token = null;
  currentUser = null;
  updateAuthUI();
}

// Oturum durumuna göre butonları ve kullanıcı bilgisini güncelle
function updateAuthUI() {
  const authButtons = document.getElementById('auth-buttons');
  const userInfo = document.getElementById('user-info');
  const usernameDisplay = document.getElementById('username-display');

  if (token && currentUser) {
    authButtons.classList.add('hidden');
    userInfo.classList.remove('hidden');
    usernameDisplay.textContent = currentUser.username;
  } else {
    authButtons.classList.remove('hidden');
    userInfo.classList.add('hidden');
  }
}

// Modal açma
function openModal(type) {
  document.getElementById('auth-modal').classList.remove('hidden');
  if (type === 'login') {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
  } else {
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('login-form').classList.add('hidden');
  }
}

// Modal kapatma
function closeModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}