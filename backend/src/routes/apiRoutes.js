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
    // Aktualizujemy 3 rzeczy: licznik, nazwe ORAZ klucz GSI
    UpdateExpression: 'SET clickCount = if_not_exists(clickCount, :start) + :inc, username = :u, leaderboard_pk = :pk',
    ExpressionAttributeValues: {
      ':inc': 1,
      ':start': 0,
      ':u': username,
      ':pk': 'global_ranking' // Nasza stala wartosc dla rankingu
    },
    ReturnValues: 'UPDATED_NEW',
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

router.get('/ranking', async (req, res) => {
  const lastKey = req.query.pageKey ? JSON.parse(Buffer.from(req.query.pageKey, 'base64').toString('ascii')) : undefined;

  const params = {
    TableName: tableName,
    IndexName: 'LeaderboardIndex', // Uzywamy POPRAWNEGO indeksu

    KeyConditionExpression: 'leaderboard_pk = :pk',
    ExpressionAttributeValues: {
      ':pk': 'global_ranking'
    },

    ScanIndexForward: false, // Sortuj malejaco (najlepsi na gorze)
    Limit: 10, 
    ExclusiveStartKey: lastKey 
  };

  try {
    const data = await docClient.query(params).promise();

    const ranking = data.Items;
    const nextKey = data.LastEvaluatedKey 
      ? Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString('base64') 
      : null;

    console.log(`GET /api/ranking - Zwrócono ${ranking.length} użytkowników.`);

    res.json({
      ranking: ranking,
      nextPageKey: nextKey
    });

  } catch (err) {
    console.error("Błąd pobierania rankingu:", err);
    res.status(500).json({ error: 'Nie można pobrać rankingu' });
  }
});

router.get('/avatar-url', checkJwt, async (req, res) => {
  const userId = req.auth.sub;

  const params = {
    TableName: tableName,
    Key: {
      ItemID: userId,
    },
    ProjectionExpression: 'avatarUrl', 
  };

  try {
    const data = await docClient.get(params).promise();

    const avatarUrl = data.Item ? data.Item.avatarUrl : null;
    console.log(`GET /api/avatar-url dla ${userId} - Zwrócono: ${avatarUrl}`);
    res.json({ avatarUrl: avatarUrl });

  } catch (err) {
    console.error(`Błąd odczytu avatarUrl z DynamoDB dla ${userId}:`, err);
    res.status(500).json({ error: 'Nie można pobrać danych' });
  }
});

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


router.post('/feedback', checkJwt, (req, res) => {
  const userId = req.auth.sub;
  const username = req.auth['cognito:username'];

  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Wiadomość nie może być pusta' });
  }

  console.log(`--- NOWA OPINIA ---`);
  console.log(`Od Użytkownika: ${username} (${userId})`);
  console.log(`Wiadomość: ${message}`);
  console.log(`---------------------`);

  res.status(200).json({ status: 'success', message: 'Dziękujemy za Twoją opinię!' });
});

router.get('/notifications', checkJwt, async (req, res) => {
  const userId = req.auth.sub; // Wiemy, dla kogo szukamy

  const params = {
    TableName: tableName,
    IndexName: 'UserNotificationsIndex', // Używamy naszego nowego indeksu

    // "Daj mi wszystko, gdzie 'userId' to ID zalogowanego użytkownika"
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: {
      ':uid': userId
    },

    // Zwróć najnowsze powiadomienia jako pierwsze
    ScanIndexForward: false, 
    Limit: 20 // Ogranicz do ostatnich 20
  };

  try {
    const data = await docClient.query(params).promise();
    console.log(`GET /api/notifications dla ${userId} - Zwrócono ${data.Items.length} powiadomień.`);
    res.json(data.Items); // Zwróć listę powiadomień

  } catch (err) {
    console.error("Błąd pobierania powiadomień:", err);
    res.status(500).json({ error: 'Nie można pobrać powiadomień' });
  }
});

router.post('/notifications/mark-read', checkJwt, async (req, res) => {
  const userId = req.auth.sub;
  console.log(`POST /api/notifications/mark-read dla ${userId}`);

  try {
    // --- KROK 1: Znajdź wszystkie NIEPRZECZYTANE powiadomienia ---
    // Używamy tego samego GSI co wcześniej, ale dodajemy warunek "FilterExpression"
    // Niestety, nie możemy filtrować po 'isRead' w kluczu, więc musimy to zrobić po stronie serwera.

    const queryParams = {
      TableName: tableName,
      IndexName: 'UserNotificationsIndex',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      // Chcemy znaleźć tylko te, które są nieprzeczytane
      FilterExpression: 'isRead = :isReadVal',
      ExpressionAttributeValues: {
        ':uid': userId,
        ':isReadVal': false // Szukaj tylko tych z `isRead: false`
      },
      ProjectionExpression: 'ItemID' // Potrzebujemy tylko ich kluczy głównych
    };

    const data = await docClient.query(queryParams).promise();
    const unreadItems = data.Items;

    if (unreadItems.length === 0) {
      console.log("Brak nieprzeczytanych powiadomien do oznaczenia.");
      return res.json({ status: 'success', message: 'Brak zmian' });
    }

    console.log(`Znaleziono ${unreadItems.length} nieprzeczytanych powiadomien do aktualizacji.`);

    // --- KROK 2: Zaktualizuj każde powiadomienie (w paczce) ---
    // Tworzymy listę żądań aktualizacji
    const updatePromises = unreadItems.map(item => {
      const updateParams = {
        TableName: tableName,
        Key: {
          ItemID: item.ItemID // Używamy klucza głównego
        },
        UpdateExpression: 'SET isRead = :isReadVal',
        ExpressionAttributeValues: {
          ':isReadVal': true // Ustaw na "przeczytane"
        }
      };
      return docClient.update(updateParams).promise();
    });

    // Uruchom wszystkie aktualizacje równolegle
    await Promise.all(updatePromises);

    res.json({ status: 'success', message: `Oznaczono ${unreadItems.length} powiadomien jako przeczytane` });

  } catch (err) {
    // Błąd "FilterExpression" może się pojawić, jeśli GSI nie jest jeszcze w pełni zbudowany
    if (err.code === 'ValidationException' && err.message.includes('FilterExpression')) {
         console.warn("Ostrzezenie: GSI UserNotificationsIndex wciaz sie buduje. Nie mozna jeszcze filtrowac.");
         return res.json({ status: 'success', message: 'Indeks w trakcie budowy' });
    }
    console.error("Błąd oznaczania powiadomień jako przeczytane:", err);
    res.status(500).json({ error: 'Nie można zaktualizować powiadomień' });
  }
});

router.get('/health', (req, res) => {
  // Po prostu odpowiedz, że żyjesz
  res.status(200).json({ status: 'ok' });
});

module.exports = router;