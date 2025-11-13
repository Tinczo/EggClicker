// Plik: lambda_functions/podium_checker/index.js

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

// Nazwy tabel będą przekazane przez zmienne środowiskowe
const MAIN_TABLE_NAME = process.env.MAIN_TABLE_NAME;
const STATE_TABLE_NAME = process.env.STATE_TABLE_NAME;
const STATE_KEY = "previous_podium"; // Nasz "klucz" do pamięci
const PODIUM_SIZE = 3; // Sprawdzamy Top 3

exports.handler = async (event) => {
  console.log("--- Uruchomiono Strażnika Podium ---");

  try {
    // --- KROK 1: Pobierz AKTUALNE podium ---
    const rankingParams = {
      TableName: MAIN_TABLE_NAME,
      IndexName: 'LeaderboardIndex',
      KeyConditionExpression: 'leaderboard_pk = :pk',
      ExpressionAttributeValues: { ':pk': 'global_ranking' },
      ScanIndexForward: false, // Malejąco
      Limit: PODIUM_SIZE
    };
    const currentPodiumData = await docClient.query(rankingParams).promise();
    const currentPodium = currentPodiumData.Items.map(item => item.ItemID); // Lista ID [userA, userB, userC]
    console.log("Obecne podium:", currentPodium);

    // --- KROK 2: Pobierz POPRZEDNIE podium z "pamięci" ---
    const stateParams = {
      TableName: STATE_TABLE_NAME,
      Key: { StateID: STATE_KEY }
    };
    const previousStateData = await docClient.get(stateParams).promise();
    const previousPodium = previousStateData.Item ? previousStateData.Item.podium : []; // [] jeśli to pierwszy raz
    console.log("Poprzednie podium:", previousPodium);

    // --- KROK 3: Znajdź, kto spadł z podium ---
    const knockedOffUsers = previousPodium.filter(userId => !currentPodium.includes(userId));

    if (knockedOffUsers.length > 0) {
      console.log(`WYKRYTO ZMIANY! Użytkownicy, którzy spadli: ${knockedOffUsers.join(', ')}`);

      const notificationPromises = [];

      for (const userId of knockedOffUsers) {
        // Dla każdego, kto spadł, stwórz nowe powiadomienie w głównej tabeli
        const notification = {
          ItemID: `notification#${userId}#${Date.now()}`, // Unikalne ID powiadomienia
          userId: userId, // Dla kogo to powiadomienie
          message: `Właśnie spadłeś z podium w rankingu! Klikaj szybciej!`,
          isRead: false,
          timestamp: Date.now()
        };

        const putParams = {
          TableName: MAIN_TABLE_NAME,
          Item: notification
        };
        notificationPromises.push(docClient.put(putParams).promise());
      }
      await Promise.all(notificationPromises);
      console.log(`Stworzono ${knockedOffUsers.length} powiadomień.`);

    } else {
      console.log("Brak zmian na podium. Koniec pracy.");
    }

    // --- KROK 4: Zaktualizuj "pamięć" nowym stanem podium ---
    const updateStateParams = {
      TableName: STATE_TABLE_NAME,
      Item: {
        StateID: STATE_KEY,
        podium: currentPodium // Zapisz aktualne podium na następny raz
      }
    };
    await docClient.put(updateStateParams).promise();

    return { statusCode: 200, body: 'Sprawdzanie podium zakończone.' };

  } catch (err) {
    console.error("BLAD w Lambdzie Strażnika Podium:", err);
    return { statusCode: 500, body: JSON.stringify(err) };
  }
};