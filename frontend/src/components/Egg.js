import React from 'react';
// Ten komponent sam importuje swój obrazek
// Ścieżka '../' cofa się z 'components' do 'src'
import eggImage from '../egg.png'; 

function Egg({ onClick, isLoading }) {
  return (
    <button
      className="egg-button"
      onClick={onClick} // Używamy funkcji 'onClick' przekazanej z App.js
      disabled={isLoading} // Używamy stanu 'isLoading' przekazanego z App.js
      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <img src={eggImage} alt="Clickable Egg" />
    </button>
  );
}

export default Egg;