// Plik: frontend/src/components/UserProfile.js
import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import { Link } from 'react-router-dom';
import { Auth } from 'aws-amplify'; // Musimy pobrać token i zmienić hasło

function UserProfile() {
  // Stany do zarządzania danymi
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // --- NOWE STANY DLA ZMIANY HASŁA ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState(''); // Do pokazywania komunikatów

  // Wczytywanie danych użytkownika (to już masz i działa)
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const session = await Auth.currentSession();
        const token = session.getIdToken().getJwtToken();

        const response = await fetch('/api/user-profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Nie udało się pobrać danych');

        const data = await response.json();
        setUsername(data.username);
        setEmail(data.email);

      } catch (error) {
        console.error("Błąd wczytywania profilu:", error);
        setMessage(`Błąd wczytywania danych: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // --- NOWA LOGIKA PRZYCISKU "ZAPISZ ZMIANY" ---
  const handlePasswordChange = async () => {
    // Sprawdzamy, czy użytkownik w ogóle chce zmienić hasło
    if (!oldPassword || !newPassword) {
      setMessage('Proszę wypełnić oba pola hasła, aby je zmienić.');
      return;
    }
    
    setMessage('Zmieniam hasło...');
    try {
      // 1. Pobierz obiekt aktualnego użytkownika z Amplify
      const currentUser = await Auth.currentAuthenticatedUser();
      
      // 2. Wywołaj wbudowaną funkcję Amplify do zmiany hasła
      await Auth.changePassword(currentUser, oldPassword, newPassword);
      
      // 3. Sukces!
      setMessage('Hasło zostało pomyślnie zmienione!');
      setOldPassword('');
      setNewPassword('');

    } catch (err) {
      console.error('Błąd zmiany hasła:', err);
      setMessage(`Błąd: ${err.message || 'Niepoprawne stare hasło?'}`);
    }
  };

  if (isLoading) {
    return <div className="profile-container"><h2>Ładowanie profilu...</h2></div>;
  }

  return (
    <div className="profile-container">
      <h2>Panel Użytkownika</h2>
      
      <div className="profile-form">
        <label htmlFor="username">Nazwa użytkownika:</label>
        <input 
          id="username" 
          type="text" 
          value={username} 
          readOnly // --- USTAWIAMY `readOnly` ---
        />
        
        <label htmlFor="email">Email:</label>
        <input 
          id="email" 
          type="email" 
          value={email} 
          readOnly // --- USTAWIAMY `readOnly` ---
        />

        {/* --- DODAJ TĘ SEKCJĘ ZMIANY HASŁA --- */}
        <hr className="profile-divider" />
        <h2>Zmień hasło</h2>
        
        <label htmlFor="oldPassword">Stare hasło:</label>
        <input 
          id="oldPassword" 
          type="password" 
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="Wpisz swoje obecne hasło"
        />

        <label htmlFor="newPassword">Nowe hasło:</label>
        <input 
          id="newPassword" 
          type="password" 
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Wpisz nowe hasło (min. 8 znaków, duża litera, liczba)"
        />
        {/* --- KONIEC NOWEJ SEKCJI --- */}
      </div>
      
      {/* Komunikat o sukcesie/błędzie */}
      {message && <p className="profile-message">{message}</p>}

      <div className="profile-actions">
        {/* Przycisk wywołuje teraz tylko zmianę hasła */}
        <button onClick={handlePasswordChange} className="profile-save-button">
          Zmień hasło
        </button>
        <Link to="/" className="profile-back-button">
          Powrót do Jajka
        </Link>
      </div>
    </div>
  );
}

export default UserProfile;