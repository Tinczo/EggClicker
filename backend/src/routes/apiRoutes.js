const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk'); // Importujemy AWS SDK

// --- Konfiguracja AWS ---
// AWS SDK automatycznie wykryje poświadczenia (rolę IAM),
// gdy kod będzie działał na Fargate.
// Musimy mu tylko podać region.
AWS.config.update({ region: process.env.AWS_REGION });

// Tworzymy "klienta" do komunikacji z DynamoDB
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'EggClickerData'; // Nazwa tabeli z naszego Terraform
const globalClicksID = 'global_clicks'; // ID naszego globalnego licznika w tabeli

// --- Implementacja endpointów (wersja z DynamoDB) ---

// 1. GET /clicks - Pobiera aktualną liczbę kliknięć z bazy
router.get('/clicks', async (req, res) => {
  const params = {
    TableName: tableName,
    Key: {
      ItemID: globalClicksID, // Pobieramy konkretny wiersz o ID "global_clicks"
    },
  };

  try {
    const data = await docClient.get(params).promise();
    
    // Jeśli wiersz 'global_clicks' jeszcze nie istnieje, zwróć 0
    const count = data.Item ? data.Item.clickCount : 0;
    
    console.log('GET /api/clicks - Zwrócono z DynamoDB:', count);
    res.json({ count: count });
  } catch (err) {
    console.error('Błąd odczytu z DynamoDB:', err);
    res.status(500).json({ error: 'Nie można pobrać danych' });
  }
});

// 2. POST /click - Rejestruje (atomowo) nowe kliknięcie w bazie
router.post('/click', async (req, res) => {
  const params = {
    TableName: tableName,
    Key: {
      ItemID: globalClicksID, // Aktualizujemy wiersz "global_clicks"
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
    
    console.log('POST /api/click - Nowa liczba w DynamoDB:', newCount);
    res.json({ count: newCount });
  } catch (err) {
    console.error('Błąd zapisu do DynamoDB:', err);
    res.status(500).json({ error: 'Nie można zapisać kliknięcia' });
  }
});

// --- Pozostałe Stuby (bez zmian) ---

router.get('/user-profile', (req, res) => {
  console.log('GET /api/user-profile (stub)');
  res.json({
    username: 'TestowyInzynier',
    email: 'test@example.com',
    user_clicks: 123,
    join_date: '2025-01-01',
  });
});

router.post('/user-profile', (req, res) => {
  console.log('POST /api/user-profile (stub)');
  res.json({ status: 'success', message: 'Profil zaktualizowany!' });
});

router.post('/upload-avatar', (req, res) => {
  console.log('POST /api/upload-avatar (stub)');
  res.json({
    status: 'success',
    fileUrl: 'https://s3.example-aws-region.amazonaws.com/twoj-bucket/avatars/test-user-avatar.jpg',
  });
});

module.exports = router;