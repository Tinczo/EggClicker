const express = require('express');
const router = express.Router(); // Używamy Express Router

// --- Nasza "baza danych" w pamięci RAM ---
// Przenosimy logikę biznesową tutaj
let globalClickCount = 0;

// 1. GET /clicks
// Zauważ: ścieżka to teraz '/' a nie '/api/clicks'
// Pełna ścieżka będzie zdefiniowana w index.js
router.get('/clicks', (req, res) => {
  console.log('GET /api/clicks - Zwrócono:', globalClickCount);
  res.json({ count: globalClickCount });
});

// 2. POST /click
router.post('/click', (req, res) => {
  globalClickCount++;
  console.log('POST /api/click - Nowa liczba:', globalClickCount);
  res.json({ count: globalClickCount });
});

// 3. GET /user-profile (Stub)
router.get('/user-profile', (req, res) => {
  console.log('GET /api/user-profile (stub) - Zwrócono sztywne dane');
  res.json({
    username: 'TestowyInzynier',
    email: 'test@example.com',
    user_clicks: 123,
    join_date: '2025-01-01'
  });
});

// 4. POST /user-profile (Stub)
router.post('/user-profile', (req, res) => {
  const userData = req.body;
  console.log('POST /api/user-profile (stub) - Otrzymano dane:', userData);
  res.json({ status: 'success', message: 'Profil zaktualizowany!', data: userData });
});

// 5. POST /upload-avatar (Stub)
router.post('/upload-avatar', (req, res) => {
  console.log('POST /api/upload-avatar (stub) - Udajemy wysłanie pliku');
  res.json({ 
    status: 'success', 
    message: 'Avatar pomyślnie wysłany!',
    fileUrl: 'https://s3.example-aws-region.amazonaws.com/twoj-bucket/avatars/test-user-avatar.jpg' 
  });
});

// Eksportujemy router, aby index.js mógł go użyć
module.exports = router;