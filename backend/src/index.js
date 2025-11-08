const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Importujemy nasze nowe trasy
const apiRoutes = require('./routes/apiRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// --- Główne kierowanie ruchem ---
// Wszystkie zapytania na '/api' będą obsługiwane przez nasz router
app.use('/api', apiRoutes);

// Start serwera
app.listen(PORT, () => {
  console.log(`Serwer backendu działa na http://localhost:${PORT}`);
});