import React, { useState, useEffect } from 'react';
import './App.css'; 

import ClickCounter from './components/ClickCounter';
import Egg from './components/Egg';


const API_URL = '';

function App() {
  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Logika API (bez zmian) ---
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

  return (
    <div className="App">
      
      <header className="app-navbar">
        <h1>🥚 Egg Clicker</h1>
      </header>

      <main className="app-content">
        
        <Egg onClick={handleEggClick} isLoading={isLoading} />
        
        <ClickCounter count={clickCount} isLoading={isLoading} />

      </main>

    </div>
  );
}

export default App;