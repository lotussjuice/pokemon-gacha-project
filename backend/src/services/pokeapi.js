const axios = require('axios');

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

const pokeapi = {
  async getPokemonById(id) {
    const { data } = await axios.get(`${POKEAPI_BASE}/pokemon/${id}`);
    return {
      pokedexNumber: data.id,
      name: data.name,
      types: data.types.map(t => t.type.name),
      stats: {
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
        spAttack: data.stats[3].base_stat,
        spDefense: data.stats[4].base_stat,
        speed: data.stats[5].base_stat
      },
      sprites: {
        front: data.sprites.front_default,
        frontShiny: data.sprites.front_shiny,
        back: data.sprites.back_default,
        backShiny: data.sprites.back_shiny
      },
      height: data.height,
      weight: data.weight,
      abilities: data.abilities.map(a => a.ability.name)
    };
  },

  async getPokemonByName(name) {
    const { data } = await axios.get(`${POKEAPI_BASE}/pokemon/${name.toLowerCase()}`);
    return {
      pokedexNumber: data.id,
      name: data.name,
      types: data.types.map(t => t.type.name),
      stats: {
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
        spAttack: data.stats[3].base_stat,
        spDefense: data.stats[4].base_stat,
        speed: data.stats[5].base_stat
      },
      sprites: {
        front: data.sprites.front_default,
        frontShiny: data.sprites.front_shiny,
        back: data.sprites.back_default,
        backShiny: data.sprites.back_shiny
      },
      height: data.height,
      weight: data.weight,
      abilities: data.abilities.map(a => a.ability.name)
    };
  },

  async searchPokemonByName(name) {
    try {
      const { data } = await axios.get(`${POKEAPI_BASE}/pokemon?limit=1500`);
      const results = data.results
        .filter(p => p.name.includes(name.toLowerCase()))
        .slice(0, 20)
        .map(p => {
          const idMatch = p.url.match(/\/(\d+)\/?$/);
          const id = idMatch ? parseInt(idMatch[1]) : 0;
          return { name: p.name, pokedexNumber: id };
        });
      return results;
    } catch {
      return [];
    }
  },

  async getRandomPokemon() {
    const id = Math.floor(Math.random() * 1025) + 1;
    return this.getPokemonById(id);
  },

  async getItemById(id) {
    const { data } = await axios.get(`${POKEAPI_BASE}/item/${id}`);
    return {
      pokeapiId: data.id,
      name: data.name,
      sprite: data.sprites?.default || null,
      category: data.category?.name || 'unknown',
      effect: data.effect_entries?.[0]?.short_effect || 'No effect'
    };
  },

  async getNatureById(id) {
    const { data } = await axios.get(`${POKEAPI_BASE}/nature/${id}`);
    return {
      name: data.name,
      decreasedStat: data.decreased_stat?.name || null,
      increasedStat: data.increased_stat?.name || null
    };
  },

  async getEvolutionInfo(pokemonId) {
    try {
      const { data: species } = await axios.get(`${POKEAPI_BASE}/pokemon-species/${pokemonId}`);
      const evoChainUrl = species.evolution_chain?.url;
      if (!evoChainUrl) return { evolvesTo: null, evolvesFrom: null };

      const { data: evoChain } = await axios.get(evoChainUrl);
      const result = this._findEvolution(evoChain.chain, pokemonId);
      return result;
    } catch {
      return { evolvesTo: null, evolvesFrom: null };
    }
  },

  async getMovesByPokemonId(pokemonId) {
    try {
      const { data } = await axios.get(`${POKEAPI_BASE}/pokemon/${pokemonId}`);
      return data.moves.map(m => ({
        name: m.move.name,
        url: m.move.url
      }));
    } catch {
      return [];
    }
  },

  _findEvolution(chain, currentId) {
    const currentNum = this._extractIdFromUrl(chain.species.url);

    if (currentNum === currentId && chain.evolves_to.length > 0) {
      const next = chain.evolves_to[0];
      return {
        evolvesTo: { id: this._extractIdFromUrl(next.species.url), name: next.species.name },
        evolvesFrom: null
      };
    }

    for (const evo of chain.evolves_to) {
      const evoNum = this._extractIdFromUrl(evo.species.url);
      if (evoNum === currentId) {
        return {
          evolvesTo: evo.evolves_to.length > 0 
            ? { id: this._extractIdFromUrl(evo.evolves_to[0].species.url), name: evo.evolves_to[0].species.name } 
            : null,
          evolvesFrom: { id: currentNum, name: chain.species.name }
        };
      }
      const nested = this._findEvolution(evo, currentId);
      if (nested.evolvesTo || nested.evolvesFrom) return nested;
    }

    return { evolvesTo: null, evolvesFrom: null };
  },

  _extractIdFromUrl(url) {
    const match = url.match(/\/(\d+)\/?$/);
    return match ? parseInt(match[1]) : null;
  }
};

module.exports = pokeapi;
