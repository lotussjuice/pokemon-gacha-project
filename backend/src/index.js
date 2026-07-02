require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const coinsRoutes = require('./routes/coinsRoutes');
const pokemonRoutes = require('./routes/pokemonRoutes');
const gachaRoutes = require('./routes/gachaRoutes');
const capturesRoutes = require('./routes/capturesRoutes');
const combatRoutes = require('./routes/combatRoutes');
const itemsRoutes = require('./routes/itemsRoutes');
const userRoutes = require('./routes/userRoutes');
const tradesRoutes = require('./routes/tradesRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/coins', coinsRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/gacha', gachaRoutes);
app.use('/api/captures', capturesRoutes);
app.use('/api/combat', combatRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trades', tradesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
