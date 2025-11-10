const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk'); // Importujemy AWS SDK
const checkJwt = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// --- Konfiguracja AWS ---
// AWS SDK automatycznie wykryje poświadczenia (rolę IAM),
// gdy kod będzie działał na Fargate.
// Musimy mu tylko podać region.
AWS.config.update({ region: process.env.AWS_REGION });

// Tworzymy "klienta" do komunikacji z DynamoDB
const docClient = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const tableName = 'EggClickerData'; // Nazwa tabeli z naszego Terraform
const s3BucketName = process.env.S3_BUCKET_NAME;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Akceptowane sa tylko pliki obrazow (jpeg, png, gif)!"));
  }
}).single('avatar');

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
// Plik: backend/src/routes/apiRoutes.js


// 2. POST /click - WERSJA OSTATECZNA (z poprawną nazwą użytkownika)
router.post('/click', checkJwt, async (req, res) => {
  // "Ochroniarz" (checkJwt) dał nam ID oraz nazwę użytkownika z tokenu
  const userId = req.auth.sub;
  
  // --- TUTAJ JEST POPRAWKA ---
  // Używamy notacji z nawiasami, bo nazwa pola zawiera ":"
  const username = req.auth['cognito:username']; 

  // Dodatkowe zabezpieczenie: sprawdź, czy username istnieje
  if (!username) {
    console.error('Brak nazwy uzytkownika (cognito:username) w tokenie:', req.auth);
    return res.status(500).json({ error: 'Blad tokenu: brak nazwy uzytkownika' });
  }

  const params = {
    TableName: tableName,
    Key: {
      ItemID: userId, // Klucz główny
    },
    // Przywracamy naszą pełną logikę zapisu
    UpdateExpression: 'SET clickCount = if_not_exists(clickCount, :start) + :inc, username = :u',
    ExpressionAttributeValues: {
      ':inc': 1,
      ':start': 0,
      ':u': username, // Przekazujemy poprawną nazwę użytkownika do zapisu
    },
    ReturnValues: 'UPDATED_NEW', // Zwróć zaktualizowane wartości
  };

  try {
    const data = await docClient.update(params).promise();
    const newCount = data.Attributes.clickCount;
    
    console.log(`POST /api/click dla ${userId} (${username}) - Nowa liczba w DynamoDB: ${newCount}`);
    res.json({ count: newCount }); 
  } catch (err) {
    console.error(`Błąd zapisu do DynamoDB dla ${userId}:`, err);
    res.status(500).json({ error: 'Nie można zapisać kliknięcia' });
  }
});

// Plik: backend/src/routes/apiRoutes.js

// ... (wszystkie inne endpointy: /health, /clicks, /click, /user-profile) ...

router.post('/upload-avatar', checkJwt, (req, res) => {

  // 1. Użyj middleware 'upload', aby przetworzyć plik
  upload(req, res, async (err) => {
    if (err) {
      // Obsłuż błędy Multera (np. zły typ pliku, plik za duży)
      console.error("Blad Multera:", err.message);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nie wybrano pliku' });
    }

    const userId = req.auth.sub;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const s3Key = `avatars/${userId}${fileExtension}`;

    console.log(`Przesylanie pliku do S3 dla ${userId} jako ${s3Key}...`);

    // 3. Parametry wysyłania do S3
    const s3Params = {
      Bucket: s3BucketName,
      Key: s3Key,
      Body: req.file.buffer, // Plik z pamięci (z Multera)
      ContentType: req.file.mimetype,
      ACL: 'public-read' // Ustawiamy plik jako publicznie czytelny
    };

    try {
      const s3Data = await s3.upload(s3Params).promise();
      const avatarUrl = s3Data.Location;
      
      console.log(`Plik zapisany w S3: ${avatarUrl}`);

      // 5. Zapisanie URL-a w DynamoDB
      const dynamoParams = {
        TableName: tableName,
        Key: { ItemID: userId },
        UpdateExpression: 'SET avatarUrl = :url',
        ExpressionAttributeValues: {
          ':url': avatarUrl
        }
      };
      await docClient.update(dynamoParams).promise();

      console.log(`URL awatara zapisany w DynamoDB dla ${userId}`);

      // 6. Odesłanie sukcesu do frontendu
      res.json({ avatarUrl: avatarUrl });

    } catch (s3Err) {
      console.error("Blad podczas wysylania do S3 lub zapisu do DynamoDB:", s3Err);
      res.status(500).json({ error: 'Blad serwera podczas przetwarzania pliku.' });
    }
  });
});

router.get('/health', (req, res) => {
  // Po prostu odpowiedz, że żyjesz
  res.status(200).json({ status: 'ok' });
});

module.exports = router;