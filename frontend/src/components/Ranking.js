import React, { useState, useEffect } from 'react';
import './Ranking.css'; // Stworzymy ten plik za chwilę

function Ranking() {
  const [rankingList, setRankingList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // --- Logika Paginacji ---
  // Przechowujemy "wskaźniki" dla każdej strony
  // pageKeys[0] = undefined (dla pierwszej strony)
  // pageKeys[1] = "klucz_do_strony_2"
  // pageKeys[2] = "klucz_do_strony_3"
  const [pageKeys, setPageKeys] = useState([undefined]); 
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const hasNextPage = pageKeys[currentPageIndex + 1] !== null;
  const hasPreviousPage = currentPageIndex > 0;

  useEffect(() => {
    const fetchRanking = async () => {
      setIsLoading(true);
      setMessage(null);

      // Pobierz "wskaźnik" dla obecnej strony
      const key = pageKeys[currentPageIndex];
      const url = key ? `/api/ranking?pageKey=${encodeURIComponent(key)}` : '/api/ranking';

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Nie udało się pobrać rankingu');
        }
        const data = await response.json();

        setRankingList(data.ranking);

        // Zapisz "wskaźnik" do następnej strony, jeśli istnieje
        // Jeśli nie istnieje, oznaczmy go jako `null`
        const nextKey = data.nextPageKey || null;

        // Upewnij się, że nie dodajemy go w kółko
        if (currentPageIndex + 1 >= pageKeys.length) {
          setPageKeys(prevKeys => [...prevKeys, nextKey]);
        }

      } catch (err) {
        console.error(err);
        setMessage(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRanking();
  }, [currentPageIndex]); // Uruchom ten efekt ponownie, gdy zmieni się strona

  const goToNextPage = () => {
    setCurrentPageIndex(prevIndex => prevIndex + 1);
  };

  const goToPreviousPage = () => {
    setCurrentPageIndex(prevIndex => Math.max(0, prevIndex - 1));
  };

  return (
    <div className="ranking-container">
      <h2>Tabela Rankingowa</h2>

      {isLoading && <p>Ładowanie rankingu...</p>}
      {message && <p className="ranking-message error">{message}</p>}

      {!isLoading && !message && (
        <>
          <table className="ranking-table">
            <thead>
              <tr>
                <th>Poz.</th>
                <th>Nazwa Użytkownika</th>
                <th>Liczba Kliknięć</th>
              </tr>
            </thead>
            <tbody>
              {rankingList.map((user, index) => (
                <tr key={user.ItemID}>
                  {/* Numer pozycji = (numer strony * 10) + indeks w tablicy + 1 */}
                  <td>{currentPageIndex * 10 + index + 1}</td>
                  <td>{user.username}</td>
                  <td>{user.clickCount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* --- Nawigacja Paginacji --- */}
          <div className="pagination-controls">
            <button 
              onClick={goToPreviousPage} 
              disabled={!hasPreviousPage}
            >
              &lt; Poprzednia
            </button>
            <span className="current-page">Strona {currentPageIndex + 1}</span>
            <button 
              onClick={goToNextPage}
              disabled={!hasNextPage}
            >
              Następna &gt;
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Ranking;