// Plik: frontend/src/components/Ranking.js
// --- WERSJA POPRAWIONA (z lepszym UX ładowania i przyciskiem powrotu) ---

import React, { useState, useEffect } from 'react';
import './Ranking.css';
import { Link } from 'react-router-dom'; // <-- KROK 1: DODAJ IMPORT

function Ranking() {
  const [rankingList, setRankingList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);
  
  const [pageKeys, setPageKeys] = useState([undefined]); 
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const hasNextPage = pageKeys[currentPageIndex + 1] !== null;
  const hasPreviousPage = currentPageIndex > 0;

  useEffect(() => {
    // Uwaga: Zmieniamy 'setIsLoading(true)' na samym początku.
    // Chcemy, aby tabela została na miejscu podczas ładowania.
    // Ustawimy to tylko na początku, a potem będziemy zarządzać tym wewnątrz.
    if (currentPageIndex === 0) {
      setIsLoading(true);
    }
    
    setMessage(null);

    const fetchRanking = async () => {
      // --- KROK 2: Ustawiamy isLoading(true) tylko na początku pobierania ---
      setIsLoading(true); 
      
      const key = pageKeys[currentPageIndex];
      const url = key ? `/api/ranking?pageKey=${encodeURIComponent(key)}` : '/api/ranking';
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Nie udało się pobrać rankingu');
        }
        const data = await response.json();
        setRankingList(data.ranking); // Ustaw nowe dane
        
        const nextKey = data.nextPageKey || null;
        if (currentPageIndex + 1 >= pageKeys.length) {
          setPageKeys(prevKeys => [...prevKeys, nextKey]);
        }
        
      } catch (err) {
        console.error(err);
        setMessage(err.message);
      } finally {
        // --- KROK 2 (cd.): Wyłączamy ładowanie po zakończeniu ---
        setIsLoading(false);
      }
    };
    
    fetchRanking();
  }, [currentPageIndex]); // Zależność jest poprawna

  const goToNextPage = () => {
    if (!isLoading) { // Zapobiegaj podwójnemu kliknięciu
      setCurrentPageIndex(prevIndex => prevIndex + 1);
    }
  };

  const goToPreviousPage = () => {
    if (!isLoading) { // Zapobiegaj podwójnemu kliknięciu
      setCurrentPageIndex(prevIndex => Math.max(0, prevIndex - 1));
    }
  };

  // --- KROK 3: ZAKTUALIZOWANA LOGIKA RENDEROWANIA ---
  return (
    <div className="ranking-container">
      <h2>Tabela Rankingowa</h2>
      
      {/* Komunikat o błędzie (jeśli wystąpi) */}
      {message && <p className="ranking-message error">{message}</p>}

      {/* Tabela i kontrolki są teraz renderowane ZAWSZE.
        Usunęliśmy opakowujący warunek `!isLoading`.
        To zapobiegnie "skakaniu" layoutu.
      */}
      <>
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Poz.</th>
              <th>Awatar</th>
              <th>Nazwa Użytkownika</th>
              <th>Liczba Kliknięć</th>
            </tr>
          </thead>
          <tbody>
            {/* Jeśli ładujemy, a lista jest pusta (pierwsze ładowanie),
              to ciało będzie puste. To jest OK.
              Jeśli ładujemy kolejną stronę, wciąż widać starą listę,
              co jest lepsze niż "skok" layoutu.
            */}
            {rankingList.map((user, index) => (
              <tr key={user.ItemID}>
                <td>{currentPageIndex * 10 + index + 1}</td>
                <td className="ranking-avatar-cell">
                    <img 
                      src={user.avatarUrl || '/default_avatar.png'} 
                      alt={user.username}
                      className="ranking-avatar"
                    />
                  </td>
                <td>{user.username}</td>
                <td>{user.clickCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* --- Nawigacja Paginacji (ZAKTUALIZOWANA) --- */}
        <div className="pagination-controls">
          <button 
            onClick={goToPreviousPage} 
            // Wyłącz przycisk także podczas ładowania
            disabled={!hasPreviousPage || isLoading}
          >
            &lt; Poprzednia
          </button>
          
          {/* Implementacja Twojego pomysłu: */}
          <span className="current-page">
            {isLoading ? 'Ładowanie...' : `Strona ${currentPageIndex + 1}`}
          </span>
          
          <button 
            onClick={goToNextPage}
            // Wyłącz przycisk także podczas ładowania
            disabled={!hasNextPage || isLoading}
          >
            Następna &gt;
          </button>
        </div>

        {/* --- KROK 4: DODANIE PRZYCISKU POWROTU --- */}
        <Link to="/" className="ranking-back-link">
          Powrót do Jajka
        </Link>
      </>
    </div>
  );
}

export default Ranking;