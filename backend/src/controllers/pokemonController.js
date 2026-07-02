const firebaseService = require('../services/firebase');
const pokeapi = require('../services/pokeapi');

const pokemonController = {
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const pokemon = await firebaseService.getAllPokemon();
      
      const start = (page - 1) * limit;
      const end = start + parseInt(limit);
      const paginated = pokemon.slice(start, end);

      res.json({
        data: paginated,
        total: pokemon.length,
        page: parseInt(page),
        totalPages: Math.ceil(pokemon.length / limit)
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener pokemones' });
    }
  },

  async getRandom(req, res) {
    try {
      const pokemon = await pokeapi.getRandomPokemon();
      res.json(pokemon);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener pokemon aleatorio' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const pokemon = await firebaseService.getPokemonByNumber(parseInt(id));
      
      if (!pokemon) {
        return res.status(404).json({ error: 'Pokemon no encontrado en la base' });
      }

      res.json(pokemon);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener pokemon' });
    }
  },

  async search(req, res) {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).json({ error: 'Parametro de busqueda requerido' });

      const results = await firebaseService.searchPokemonByName(q);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Error al buscar pokemon' });
    }
  },

  async create(req, res) {
    try {
      const { pokedexNumber, name, types, stats, sprites, height, weight, abilities } = req.body;

      if (!pokedexNumber || !name) {
        return res.status(400).json({ error: 'pokedexNumber y name son requeridos' });
      }

      const existing = await firebaseService.getPokemonByNumber(parseInt(pokedexNumber));
      if (existing) {
        return res.status(409).json({ error: 'El Pokemon ya existe en la Pokedex' });
      }

      const num = parseInt(pokedexNumber);
      const defaultSprites = {
        front: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${num}.png`,
        frontShiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${num}.png`,
        back: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${num}.png`,
        backShiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/${num}.png`
      };
      const pokemonData = {
        pokedexNumber: num,
        name: name.toLowerCase(),
        types: types || [],
        stats: stats || { hp: 50, attack: 50, defense: 50, spAttack: 50, spDefense: 50, speed: 50 },
        sprites: sprites && sprites.front ? sprites : defaultSprites,
        height: height || 0,
        weight: weight || 0,
        abilities: abilities || []
      };

      const docRef = await firebaseService.create('pokemon', pokemonData);
      res.status(201).json({ message: 'Pokemon anadido a la Pokedex', id: docRef.id, pokemon: pokemonData });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear pokemon' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const pokemon = await firebaseService.getById('pokemon', id);
      if (!pokemon) {
        return res.status(404).json({ error: 'Pokemon no encontrado en la Pokedex' });
      }

      await firebaseService.delete('pokemon', id);
      res.json({ message: `Pokemon ${pokemon.name} eliminado de la Pokedex` });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar pokemon' });
    }
  }
};

module.exports = pokemonController;
