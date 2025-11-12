import React, { useState } from 'react';
import './Feedback.css'; // Stworzymy ten plik za chwilę
import { Auth } from 'aws-amplify';
import { Link } from 'react-router-dom';

function Feedback() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(''); // Do pokazywania "Wysłano!"

  const handleSubmit = async (e) => {
    e.preventDefault(); // Zatrzymaj domyślne przeładowanie strony
    setStatus('Wysyłanie...');

    try {
      // 1. Pobierz token JWT
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      // 2. Wyślij wiadomość do naszego nowego backendu
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: message })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Błąd serwera');
      }

      // 3. Sukces!
      setStatus(data.message); // "Dziękujemy za Twoją opinię!"
      setMessage(''); // Wyczyść pole tekstowe

    } catch (err) {
      console.error('Błąd wysyłania opinii:', err);
      setStatus(`Błąd: ${err.message}`);
    }
  };

  return (
    <div className="feedback-container">
      <h2>Prześlij Opinię</h2>
      <p>Masz pomysł na ulepszenie aplikacji? Znalazłeś błąd? Daj nam znać!</p>

      <form className="feedback-form" onSubmit={handleSubmit}>
        <label htmlFor="feedback-message">Twoja wiadomość:</label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="8"
          placeholder="Super aplikacja, ale..."
          required
        />

        <button type="submit" className="feedback-submit-button">Wyślij</button>

        {status && <p className="feedback-status">{status}</p>}
      </form>

      <Link to="/" className="feedback-back-link">Powrót do Jajka</Link>
    </div>
  );
}

export default Feedback;