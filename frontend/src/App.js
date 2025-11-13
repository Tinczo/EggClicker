import { Routes, Route, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import './App.css'; 

import ClickCounter from './components/ClickCounter';
import Egg from './components/Egg';
import UserProfile from './components/UserProfile';
import Ranking from './components/Ranking';
import Feedback from './components/Feedback';

import { Auth } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';


const API_URL = '';



function App({ signOut, user }) { 

  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [avatarUrl, setAvatarUrl] = useState(null); // URL awatara
  const [avatarLoading, setAvatarLoading] = useState(true); // Status ładowania awatara
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);


useEffect(() => {
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const clicksResponse = await fetch('/api/clicks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const clicksData = await clicksResponse.json();
      setClickCount(clicksData.count);

      const avatarResponse = await fetch('/api/avatar-url', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const avatarData = await avatarResponse.json();
      if (avatarData.avatarUrl) {
        setAvatarUrl(`${avatarData.avatarUrl}?t=${new Date().getTime()}`);
      }

      await fetchNotifications();

    } catch (error) {
      console.error('Błąd podczas ładowania danych:', error);
    } finally {
      setIsLoading(false);
      setAvatarLoading(false);
    }
  };
  loadInitialData();
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

const fetchNotifications = async () => {
  try {
    const session = await Auth.currentSession();
    const token = session.getIdToken().getJwtToken();
    const response = await fetch('/api/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Nie udało się pobrać powiadomień');

    const data = await response.json();
    setNotifications(data);

    if (data.some(n => n.isRead === false)) {
      setHasUnread(true);
    } else {
      setHasUnread(false);
    }

  } catch (error) {
    console.error("Błąd wczytywania powiadomień:", error);
  }
};

  const handleBellClick = async () => {
    setShowNotifications(prev => !prev);

    if (hasUnread) {
      console.log("Oznaczanie powiadomien jako przeczytane...");
      
      setHasUnread(false); 
      
      const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updatedNotifications);

      try {
        const session = await Auth.currentSession();
        const token = session.getIdToken().getJwtToken();
        
        await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        

      } catch (error) {
        console.error("Błąd oznaczania powiadomień jako przeczytane:", error);
        setHasUnread(true); 
      }
    }
  };

return (
    <div className="App">
      <header className="app-navbar">
        <Link to="/" className="header-logo-link" onClick={playJajcoSound}>
          <h1>🥚 Egg Clicker</h1>
        </Link>
        
        <div className="user-info">

        <Link to="/ranking" className="navbar-link">Ranking</Link>
        <Link to="/feedback" className="navbar-link">Opinie</Link>

          <div className="notifications-container">
            <button 
              onClick={handleBellClick}
              className={`notification-button ${hasUnread ? 'unread-bell' : ''}`} 
              title="Powiadomienia"
            >
              🔔
              {/* Czerwona kropka, jeśli są nieprzeczytane */}
              {hasUnread && <div className="notification-dot"></div>}
            </button>

            {/* Rozwijana lista powiadomień (zostaje bez zmian) */}
            {showNotifications && (
              <div className="notifications-dropdown">
                {notifications.length === 0 ? (
                  <div className="notification-item">Brak powiadomień</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.ItemID} className={`notification-item ${!n.isRead ? 'unread' : ''}`}>
                      <div className="notification-message">{n.message}</div>
                      <div className="notification-date">
                        {new Date(n.timestamp).toLocaleString('pl-PL', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <span>Witaj, {user.username}!</span>
          
          <Link 
            to="/profile"
            className="profile-button" 
            title="Przejdź do profilu"
          >
            <img 
              src={avatarUrl || '/default_avatar.png'} 
              alt="Awatar" 
              className="navbar-avatar" 
            />
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
            <UserProfile 
              user={user} 
              currentAvatarUrl={avatarUrl}
              setAppAvatarUrl={setAvatarUrl} 
            />
          } />

          <Route path="/ranking" element={<Ranking />} />
          <Route path="/feedback" element={<Feedback />} />

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