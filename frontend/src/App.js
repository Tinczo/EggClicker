import React, { useState, useEffect } from 'react';
import './App.css'; // Możesz tu dodać style dla jajka
import eggImage from './egg.png';

// Definiujemy URL naszego backendu
const API_URL = 'http://localhost:3001';

function App() {
  // Stan do przechowywania liczby kliknięć
  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. Pobranie początkowej liczby kliknięć przy starcie aplikacji ---
  useEffect(() => {
    // Definiujemy funkcję asynchroniczną wewnątrz useEffect
    const fetchInitialClicks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/api/clicks`); // GET /api/clicks
        const data = await response.json();
        setClickCount(data.count);
      } catch (error) {
        console.error('Błąd podczas pobierania kliknięć:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialClicks(); // Wywołujemy funkcję
  }, []); // Pusta tablica [] oznacza, że ten efekt uruchomi się tylko raz (po zamontowaniu)

  // --- 2. Funkcja obsługująca kliknięcie w jajko ---
  const handleEggClick = async () => {
    try {
      const response = await fetch(`${API_URL}/api/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setClickCount(data.count); 
    } catch (error) {
      console.error('Błąd podczas rejestrowania kliknięcia:', error);
    }
  };

  // --- Renderowanie komponentu ---
  return (
    <div className="App">
      <header className="App-header">

        

        <h1>Egg Clicker 🥚 </h1>
        
        {/* Wyświetlacz licznika */}

        {/* Nasze "Jajko" do klikania */}
        <button 
          className="egg-button" 
          onClick={handleEggClick} 
          disabled={isLoading}
        >
          <img src={eggImage} alt="Clickable Egg" style={{ width: '200px' }} />
        </button>

        
        <div className="click-counter">
          {isLoading ? 'Ładowanie...' : clickCount}
        </div>
        
      </header>
    </div>
  );
}

export default App;