import { Routes, Route, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './App.css'; 

import ClickCounter from './components/ClickCounter';
import Egg from './components/Egg';
import UserProfile from './components/UserProfile';

import { Auth } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';


const API_URL = '';



function App({ signOut, user }) { 

  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);


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

const playJajcoSound = () => {
    const audio = new Audio('/jajo.mp3');

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Blad odtwarzania dzwieku (byc moze polityka autoplay):", error);
      });
    }
  };

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
        <Link to="/" className="header-logo-link" onClick={playJajcoSound}>
          <h1>🥚 Egg Clicker</h1>
        </Link>
        
        <div className="user-info">
          <span>Witaj, {user.username}!</span>
          
          <Link 
            to="/profile"
            className="profile-button" 
            title="Przejdź do profilu"
          >
            👤
          </Link>
          
          <button onClick={signOut} className="sign-out-button">
            Wyloguj się
          </button>
        </div>
      </header>
      
      <main className="app-content">
        
        <Routes>
          <Route path="/" element={
            <>
              <Egg onClick={handleEggClick} isLoading={isLoading} />
              <ClickCounter count={clickCount} isLoading={isLoading} />
            </>
          } />
          
          <Route path="/profile" element={
            <UserProfile user={user} />
          } />

        </Routes>
        
      </main>
    </div>
  );
}

export default withAuthenticator(App, {
  // 1. Jakie pola ma akceptować formularz LOGOWANIA
  loginMechanisms: [
    'username', // Pozwol logowac sie nazwa
    'email',    // ORAZ pozwol logowac sie mailem
  ],
  // 2. Jakie pola ma pokazywać formularz REJESTRACJI
  // (Amplify jest na tyle mądry, że sam doda pola "Email", "Password", "Confirm Password")
  // Nie musimy już prosić o "email", bo jest on teraz głównym loginem.
  signUpAttributes: [
    'email', // Popros o email przy rejestracji
  ],
});