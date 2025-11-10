import React, { useState } from 'react'; 
import './UserProfile.css';
import { Link } from 'react-router-dom';
import { Auth } from 'aws-amplify';


function UserProfile({ user }) {
  
  // Stany TYLKO dla zmiany hasła
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  // Logika zmiany hasła (zostaje bez zmian)
  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword) {
      setMessage('Proszę wypełnić oba pola hasła, aby je zmienić.');
      return;
    }
    setMessage('Zmieniam hasło...');
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(currentUser, oldPassword, newPassword);
      setMessage('Hasło zostało pomyślnie zmienione!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      console.error('Błąd zmiany hasła:', err);
      setMessage(`Błąd: ${err.message || 'Niepoprawne stare hasło?'}`);
    }
  };

  // Nie ma już "isLoading", bo dane mamy od razu
  return (
    <div className="profile-container">
      <h2>Panel Użytkownika</h2>
      
      <div className="profile-form">
        <label htmlFor="username">Nazwa użytkownika:</label>
        <input 
          id="username" 
          type="text" 
          value={user.username} // Czytamy prosto z propa
          readOnly 
        />
        
        <label htmlFor="email">Email:</label>
        <input 
          id="email" 
          type="email" 
          value={user.attributes.email} // Czytamy atrybut prosto z propa
          readOnly 
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