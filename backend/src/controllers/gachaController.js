const firebaseService = require('../services/firebase');
const pokeapi = require('../services/pokeapi');
const { GACHA_COST_NORMAL, GACHA_COST_PREMIUM, SHINY_RATE } = require('../config/constants');

const gachaController = {
  async pull(req, res) {
    try {
      const { premium = false } = req.body;
      const cost = premium ? GACHA_COST_PREMIUM : GACHA_COST_NORMAL;

      const user = await firebaseService.getById('users', req.userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      if ((user.coins || 0) < cost) {
        return res.status(400).json({ 
          error: 'Monedas insuficientes', 
          required: cost, 
          current: user.coins || 0 
        });
      }

      const randomPokemon = await pokeapi.getRandomPokemon();
      const isShiny = Math.random() < SHINY_RATE;

      const natureId = Math.floor(Math.random() * 25) + 1;
      const nature = await pokeapi.getNatureById(natureId);

      const ivs = {
        hp: Math.floor(Math.random() * 32),
        attack: Math.floor(Math.random() * 32),
        defense: Math.floor(Math.random() * 32),
        spAttack: Math.floor(Math.random() * 32),
        spDefense: Math.floor(Math.random() * 32),
        speed: Math.floor(Math.random() * 32)
      };

      const sprite = isShiny ? randomPokemon.sprites.frontShiny : randomPokemon.sprites.front;

      const newCapture = await firebaseService.create('captures', {
        userId: req.userId,
        pokemonId: randomPokemon.pokedexNumber,
        pokemonName: randomPokemon.name,
        nickname: randomPokemon.name,
        level: 1,
        isShiny,
        nature: nature.name,
        ivs,
        sprite,
        types: randomPokemon.types,
        stats: randomPokemon.stats,
        capturedAt: new Date().toISOString()
      });

      await firebaseService.updateUserCoins(req.userId, user.coins - cost);

      res.json({
        message: isShiny ? '¡SHINY! ¡Pokemon capturado!' : 'Pokemon capturado',
        capture: newCapture,
        cost,
        remainingCoins: user.coins - cost
      });
    } catch (error) {
      res.status(500).json({ error: 'Error en el gacha', details: error.message });
    }
  }
};

module.exports = gachaController;
