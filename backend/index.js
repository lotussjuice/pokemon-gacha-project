require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pokemonRoutes = require('./routes/pokemonRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Uso de rutas
app.use('/api/pokemon', pokemonRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});