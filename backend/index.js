const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors()); // Pozwala na zapytania z innego portu (naszego Reacta)
app.use(express.json()); // Pozwala na czytanie JSON z body zapytań POST

// --- Nasza "baza danych" w pamięci RAM ---
let globalClickCount = 0;

// --- Implementacja endpointów ---

// 1. GET /api/clicks - Pobiera aktualną liczbę kliknięć
app.get('/api/clicks', (req, res) => {
  console.log('GET /api/clicks - Zwrócono:', globalClickCount);
  res.json({ count: globalClickCount });
});

// 2. POST /api/click - Rejestruje nowe kliknięcie
app.post('/api/click', (req, res) => {
  globalClickCount++; // Zwiększamy liczbę globalnie
  console.log('POST /api/click - Nowa liczba:', globalClickCount);
  // Zwracamy nową liczbę kliknięć
  res.json({ count: globalClickCount });
});

// --- Stworzenie "Stubów" (zaślepek) na potrzeby wymagań projektu ---

// 3. GET /api/user-profile (Stub) 
app.get('/api/user-profile', (req, res) => {
  console.log('GET /api/user-profile (stub) - Zwrócono sztywne dane');
  // Udajemy, że pobraliśmy dane użytkownika z Cognito i bazy danych 
  res.json({
    username: 'TestowyInzynier',
    email: 'test@example.com',
    user_clicks: 123, // Przykładowe dane
    join_date: '2025-01-01'
  });
});

// 4. POST /api/user-profile (Stub) 
app.post('/api/user-profile', (req, res) => {
  const userData = req.body;
  console.log('POST /api/user-profile (stub) - Otrzymano dane:', userData);
  // Udajemy, że zaktualizowaliśmy profil użytkownika
  res.json({ status: 'success', message: 'Profil zaktualizowany!', data: userData });
});

// 5. POST /api/upload-avatar (Stub do plików multimedialnych) 
app.post('/api/upload-avatar', (req, res) => {
  // W przyszłości użyjemy tu 'multer' do odebrania pliku
  // i AWS SDK do wysłania go do S3 
  console.log('POST /api/upload-avatar (stub) - Udajemy wysłanie pliku');
  res.json({ 
    status: 'success', 
    message: 'Avatar pomyślnie wysłany!',
    // Zwracamy przykładowy URL, tak jakby zwróciło nam S3
    fileUrl: 'https://s3.example-aws-region.amazonaws.com/twoj-bucket/avatars/test-user-avatar.jpg' 
  });
});


// Start serwera
app.listen(PORT, () => {
  console.log(`Serwer backendu działa na http://localhost:${PORT}`);
});