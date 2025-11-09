import React, { useState, useEffect } from 'react';
import './App.css'; 

import ClickCounter from './components/ClickCounter';
import Egg from './components/Egg';

import { Auth } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';


const API_URL = '';

function App({ signOut, user }) { 

  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Logika API (bez zmian) ---
// ...
useEffect(() => {
  const fetchInitialClicks = async () => {
    try {
      setIsLoading(true);

      // --- POCZĄTEK ZMIAN ---
      // Pobieramy sesję zalogowanego użytkownika
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const response = await fetch(`${API_URL}/api/clicks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

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
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const response = await fetch(`${API_URL}/api/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
        
        <div className="user-info">
          <span>Witaj, {user.attributes.email}!</span>
          
          <button onClick={signOut} className="sign-out-button">
            Wyloguj się
          </button>
        </div>
      </header>
      

      <main className="app-content">
        
        <Egg onClick={handleEggClick} isLoading={isLoading} />
        
        <ClickCounter count={clickCount} isLoading={isLoading} />

      </main>

    </div>
  );
}

export default withAuthenticator(App, {
  // 1. Jakie pola ma akceptować formularz LOGOWANIA
  loginMechanisms: [
    'email', // Tylko e-mail
  ],
  // 2. Jakie pola ma pokazywać formularz REJESTRACJI
  // (Amplify jest na tyle mądry, że sam doda pola "Email", "Password", "Confirm Password")
  // Nie musimy już prosić o "email", bo jest on teraz głównym loginem.
  signUpAttributes: [
    // Możemy tu dodać np. 'name' (imię), jeśli byśmy je mieli w schemacie,
    // ale na razie zostawmy puste.
  ],
});