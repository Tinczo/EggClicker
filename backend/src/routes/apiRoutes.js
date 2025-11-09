const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk'); // Importujemy AWS SDK
const checkJwt = require('../middleware/auth');

// --- Konfiguracja AWS ---
// AWS SDK automatycznie wykryje poświadczenia (rolę IAM),
// gdy kod będzie działał na Fargate.
// Musimy mu tylko podać region.
AWS.config.update({ region: process.env.AWS_REGION });

// Tworzymy "klienta" do komunikacji z DynamoDB
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'EggClickerData'; // Nazwa tabeli z naszego Terraform

// --- Implementacja endpointów (wersja z DynamoDB) ---

// 1. GET /clicks - Pobiera aktualną liczbę kliknięć z bazy
router.get('/clicks', checkJwt, async (req, res) => {

  const userId = req.auth.sub;
  
  const params = {
    TableName: tableName,
    Key: {
      ItemID: userId,
    },
  };

  try {
    const data = await docClient.get(params).promise();
    
    // Jeśli wiersz 'global_clicks' jeszcze nie istnieje, zwróć 0
    const count = data.Item ? data.Item.clickCount : 0;
    
    console.log(`GET /api/clicks dla ${userId} - Zwrócono z DynamoDB: ${count}`);
    res.json({ count: count });
  } catch (err) {
    console.error(`Błąd odczytu z DynamoDB dla ${userId}:`, err);
    res.status(500).json({ error: 'Nie można pobrać danych' });
  }
});

// 2. POST /click - Rejestruje (atomowo) nowe kliknięcie w bazie
router.post('/click', checkJwt, async (req, res) => {
  const userId = req.auth.sub;

  const params = {
    TableName: tableName,
    Key: {
      ItemID: userId, // Aktualizujemy wiersz "global_clicks"
    },
    // To jest "magia" DynamoDB:
    // Atomowo "dodaj 1" do atrybutu "clickCount".
    // Jeśli "clickCount" nie istnieje, ustaw go najpierw na 0, a potem dodaj 1.
    UpdateExpression: 'SET clickCount = if_not_exists(clickCount, :start) + :inc',
    ExpressionAttributeValues: {
      ':inc': 1,   // Wartość do dodania
      ':start': 0, // Wartość startowa, jeśli nie istnieje
    },
    ReturnValues: 'UPDATED_NEW', // Zwróć nam nową wartość po aktualizacji
  };

  try {
    const data = await docClient.update(params).promise();
    const newCount = data.Attributes.clickCount;
    
    console.log(`POST /api/click dla ${userId} - Nowa liczba w DynamoDB: ${newCount}`);
    res.json({ count: newCount });
  } catch (err) {
    console.error(`Błąd zapisu do DynamoDB dla ${userId}:`, err);
    res.status(500).json({ error: 'Nie można zapisać kliknięcia' });
  }
});

// --- Pozostałe Stuby (bez zmian) ---

router.get('/user-profile', checkJwt, (req, res) => {
  // Teraz też możemy tu użyć ID użytkownika!
  const userId = req.auth.sub;
  console.log(`GET /api/user-profile (stub) dla ${userId}`);
  res.json({
    username: userId, // Zwróćmy prawdziwe ID
    email: req.auth.email, // Middleware express-jwt (teoretycznie) też to udostępnia
    user_clicks: "TODO: Pobierz z DynamoDB",
    join_date: '2025-01-01',
  });
});

router.post('/user-profile', checkJwt, (req, res) => {
  const userId = req.auth.sub;
  console.log(`POST /api/user-profile (stub) dla ${userId}`);
  res.json({ status: 'success', message: 'Profil zaktualizowany!' });
});

router.post('/upload-avatar', checkJwt, (req, res) => {
  const userId = req.auth.sub;
  console.log(`POST /api/upload-avatar (stub) dla ${userId}`);
  res.json({
    status: 'success',
    fileUrl: 'https.s3.example-aws-region.amazonaws.com/twoj-bucket/avatars/test-user-avatar.jpg',
  });
});

router.get('/health', (req, res) => {
  // Po prostu odpowiedz, że żyjesz
  res.status(200).json({ status: 'ok' });
});

module.exports = router;