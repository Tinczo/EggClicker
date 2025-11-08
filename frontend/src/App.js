import React, { useState, useEffect } from 'react';
import './App.css'; 

// Importujemy nasze nowe komponenty
import ClickCounter from './components/ClickCounter';
import Egg from './components/Egg';

const API_URL = 'http://localhost:3001';

// "Mądry" komponent - zarządza stanem i logiką API
function App() {
  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Logika pobierania danych (bez zmian) ---
  useEffect(() => {
    const fetchInitialClicks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/api/clicks`);
        const data = await response.json();
        setClickCount(data.count);
      } catch (error) {
        console.error('Błąd podczas pobierania kliknięć:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialClicks();
  }, []);

  // --- Logika wysyłania danych (bez zmian) ---
  const handleEggClick = async () => {
    try {
      const response = await fetch(`${API_URL}/api/click`, {
        method: 'POST',
      });
      const data = await response.json();
      setClickCount(data.count);
    } catch (error) {
      console.error('Błąd podczas rejestrowania kliknięcia:', error);
    }
  };

  // --- Renderowanie ---
  // App.js tylko "dyryguje" innymi komponentami.
  return (
    <div className="App">
      <header className="App-header">
        <h4>Egg Clicker 🥚</h4>
        
        {/* Przekazujemy stan jako propsy */}
        <ClickCounter count={clickCount} isLoading={isLoading} />
        
        {/* Przekazujemy funkcję i stan jako propsy */}
        <Egg onClick={handleEggClick} isLoading={isLoading} />

      </header>
    </div>
  );
}

export default App;