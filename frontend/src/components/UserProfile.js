// Plik: frontend/src/components/UserProfile.js
// --- WERSJA FINALNA (ŁĄCZY ZMIANĘ HASŁA + AWATAR) ---

import React, { useState, useRef } from 'react'; // Dodajemy useRef
import './UserProfile.css';
import { Link } from 'react-router-dom';
import { Auth } from 'aws-amplify';

// Importujemy komponenty do kadrowania
// (Upewnij się, że masz go zainstalowanego: npm install react-image-crop)
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; // Style dla kadrowania

// Funkcja pomocnicza do kadrowania (z dokumentacji react-image-crop)
function getCroppedImg(image, crop, fileName) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        console.error('Canvas jest pusty');
        return reject(new Error('Błąd kadrowania obrazu'));
      }
      blob.name = fileName;
      resolve(blob);
    }, 'image/png'); // Zapisujemy jako PNG
  });
}


function UserProfile({ user, currentAvatarUrl, setAppAvatarUrl }) {
  
  // Stany dla zmiany hasła (z Twojego pliku)
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  // --- NOWE STANY DLA AWATARA ---
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState('Nie wybrano pliku'); // <-- Dla tłumaczenia
  
  // Funkcja wywoływana po wybraniu pliku
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Resetuj kadrowanie
      const reader = new FileReader();
      reader.addEventListener('load', () => setSrc(reader.result.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setSelectedFileName(e.target.files[0].name);
    }
  };

  // Funkcja wywoływana przy ładowaniu obrazka, ustawia domyślne kadrowanie
  function onImageLoad(e) {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    // Ustawia domyślne kadrowanie 1:1 na środku
    setCrop(centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width, height
    ));
    setCompletedCrop(centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width, height
    ));
  }
  
  // --- ZAKTUALIZOWANA LOGIKA ZAPISU ---
  // Łączymy obie funkcje w jedną
  const handleSaveChanges = async () => {
    setMessage('Przetwarzanie...');
    let successMessages = [];
    let errorMessages = [];

    // --- CZĘŚĆ 1: ZMIANA HASŁA (Twoja logika) ---
    if (oldPassword && newPassword) {
      try {
        const currentUser = await Auth.currentAuthenticatedUser();
        await Auth.changePassword(currentUser, oldPassword, newPassword);
        successMessages.push('Hasło zostało zmienione.');
        setOldPassword('');
        setNewPassword('');
      } catch (err) {
        console.error('Błąd zmiany hasła:', err);
        errorMessages.push(`Błąd hasła: ${err.message || 'Niepoprawne stare hasło?'}`);
      }
    }

    // --- CZĘŚĆ 2: WYSYŁANIE AWATARA (Nowa logika) ---
    if (completedCrop && imgRef.current) {
      try {
        const croppedImageBlob = await getCroppedImg(
          imgRef.current,
          completedCrop,
          'avatar.png'
        );

        const formData = new FormData();
        formData.append('avatar', croppedImageBlob, 'avatar.png');

        const session = await Auth.currentSession();
        const token = session.getIdToken().getJwtToken();

        const response = await fetch('/api/upload-avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Błąd serwera (${response.status})`);
        }

        const data = await response.json();
        successMessages.push('Awatar został zaktualizowany!');
        console.log('Nowy URL awatara:', data.avatarUrl);
        const newAvatarUrl = `${data.avatarUrl}?t=${new Date().getTime()}`;
        setAppAvatarUrl(newAvatarUrl);
        
        setSrc(null);
        setSelectedFileName('Nie wybrano pliku');

      } catch (err) {
        console.error('Błąd wysyłania awatara:', err);
        errorMessages.push(`Błąd awatara: ${err.message}`);
      }
    }

    // Ustaw finalny komunikat
    if (errorMessages.length > 0) {
      setMessage(errorMessages.join(' '));
    } else if (successMessages.length > 0) {
      setMessage(successMessages.join(' '));
    } else if (!oldPassword && !src) {
      setMessage('Nie wprowadzono żadnych zmian.');
    }
  };
  
  // --- ZAKTUALIZOWANY FORMULARZ ---
  return (
    <div className="profile-container">
      <h2>Panel Użytkownika</h2>
      
      {/* Komunikat o sukcesie/błędzie */}
      
      <div className="profile-form">
        <label htmlFor="username">Nazwa użytkownika:</label>
        <input 
          id="username" 
          type="text" 
          value={user.username}
          readOnly 
        />
        
        <label htmlFor="email">Email:</label>
        <input 
          id="email" 
          type="email" 
          value={user.attributes.email}
          readOnly 
        />

        {/* --- NOWA SEKCJA AWATARA --- */}
        <hr className="profile-divider" />
        <h3>Zmień awatar</h3>
        <img 
          src={currentAvatarUrl || '/default_avatar.png'} 
          alt="Obecny awatar" 
          className="profile-avatar-preview" 
        />

        {/* 2. Tłumaczenie przycisku input[type=file] */}
        <label htmlFor="avatar-upload" className="file-upload-label">
          Wybierz nowy obrazek
        </label>
        <input 
          id="avatar-upload"
          type="file" 
          accept="image/*" 
          onChange={onSelectFile}
          style={{ display: 'none' }} // Ukrywamy prawdziwy przycisk
        />
        <span className="file-name-display">{selectedFileName}</span>

        {src && (
          <div className="crop-container">
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
              aspect={1} // Wymuś kwadrat 1:1
            >
              <img src={src} onLoad={onImageLoad} alt="Podgląd" />
            </ReactCrop>
          </div>
        )}
        {/* --- KONIEC SEKCJI AWATARA --- */}

        <hr className="profile-divider" />
        <h3>Zmień hasło</h3>
        
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
          placeholder="Wpisz nowe hasło (min. 6 znaków, mała litera, liczba)"
        />
      </div>
      
      {message && <p className="profile-message">{message}</p>}

      <div className="profile-actions">
        {/* Przycisk wywołuje teraz obie funkcje */}
        <button onClick={handleSaveChanges} className="profile-save-button">
          Zapisz zmiany
        </button>
        <Link to="/" className="profile-back-button">
          Powrót do Jajka
        </Link>
      </div>
    </div>
  );
}

export default UserProfile;