const express = require('express');
const router = express.Router();
const pokemonController = require('../controllers/pokemonController');
const pokeapi = require('../services/pokeapi');
const auth = require('../middleware/auth');

router.get('/', auth, pokemonController.getAll);
router.get('/random', auth, pokemonController.getRandom);
router.get('/search', auth, pokemonController.search);
router.get('/pokeapi-search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = await pokeapi.searchPokemonByName(q);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar en PokeAPI' });
  }
});
router.get('/:id/evolution', auth, async (req, res) => {
  try {
    const info = await pokeapi.getEvolutionInfo(parseInt(req.params.id));
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener info de evolucion' });
  }
});
router.get('/:id/moves', auth, async (req, res) => {
  try {
    const moves = await pokeapi.getMovesByPokemonId(parseInt(req.params.id));
    res.json(moves);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});
router.get('/:id', auth, pokemonController.getById);
router.post('/', auth, pokemonController.create);
router.delete('/:id', auth, pokemonController.delete);

module.exports = router;
