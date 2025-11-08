import React from 'react';

// "Głupi" komponent - tylko wyświetla dane, które dostanie 
function ClickCounter({ count, isLoading }) {
  return (
    <div className="click-counter">
      {isLoading ? 'Ładowanie...' : count}
    </div>
  );
}

export default ClickCounter;