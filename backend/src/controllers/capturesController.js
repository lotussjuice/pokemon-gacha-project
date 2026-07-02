const firebaseService = require('../services/firebase');
const pokeapi = require('../services/pokeapi');

const VALID_STATS = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'];

const capturesController = {
  async getMyCaptures(req, res) {
    try {
      const captures = await firebaseService.getCapturesByUser(req.userId);
      res.json(captures);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener capturas' });
    }
  },

  async captureDirect(req, res) {
    try {
      const { pokemonName } = req.body;
      if (!pokemonName) return res.status(400).json({ error: 'Nombre de Pokemon requerido' });

      let pokemonData;
      try {
        pokemonData = await pokeapi.getPokemonByName(pokemonName.toLowerCase().trim());
      } catch (e) {
        return res.status(404).json({ error: 'Pokemon no encontrado en PokeAPI' });
      }

      // Generate a random nature
      const natures = [
        'adamant', 'bashful', 'bold', 'brave', 'calm', 'careful', 'docile', 'gentle',
        'hardy', 'hasty', 'impish', 'jolly', 'lax', 'lonely', 'mild', 'modest',
        'naive', 'naughty', 'quiet', 'quirky', 'rash', 'relaxed', 'sassy', 'serious', 'timid'
      ];
      const nature = natures[Math.floor(Math.random() * natures.length)];

      const newCapture = {
        userId: req.userId,
        pokemonId: pokemonData.pokedexNumber,
        pokemonName: pokemonData.name,
        nickname: pokemonData.name,
        level: 1,
        xp: 0,
        sprite: pokemonData.sprites.front,
        types: pokemonData.types,
        stats: pokemonData.stats,
        nature: nature,
        isShiny: Math.random() < 0.05,
        ivs: {
          hp: Math.floor(Math.random() * 32),
          attack: Math.floor(Math.random() * 32),
          defense: Math.floor(Math.random() * 32),
          spAttack: Math.floor(Math.random() * 32),
          spDefense: Math.floor(Math.random() * 32),
          speed: Math.floor(Math.random() * 32)
        },
        moves: [],
        createdAt: new Date().toISOString()
      };

      const result = await firebaseService.create('captures', newCapture);
      res.status(201).json({ message: 'Pokemon capturado directamente', capture: result });
    } catch (error) {
      res.status(500).json({ error: 'Error en captura directa' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const capture = await firebaseService.getCaptureById(id);
      if (!capture) return res.status(404).json({ error: 'Captura no encontrada' });
      if (capture.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });
      res.json(capture);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener captura' });
    }
  },

  async updateNickname(req, res) {
    try {
      const { id } = req.params;
      const { nickname } = req.body;

      if (!nickname || nickname.trim() === '') {
        return res.status(400).json({ error: 'El apodo es requerido' });
      }

      const capture = await firebaseService.getCaptureById(id);
      if (!capture) return res.status(404).json({ error: 'Captura no encontrada' });
      if (capture.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

      await firebaseService.update('captures', id, { nickname: nickname.trim() });
      res.json({ message: 'Apodo actualizado', nickname: nickname.trim() });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar apodo' });
    }
  },

  async editStat(req, res) {
    try {
      const { id } = req.params;
      const { statName, value } = req.body;

      if (!statName || !VALID_STATS.includes(statName)) {
        return res.status(400).json({ error: `Stat inválida. Válidas: ${VALID_STATS.join(', ')}` });
      }
      if (value === undefined || isNaN(value) || value < 0) {
        return res.status(400).json({ error: 'El valor debe ser un número positivo' });
      }

      const capture = await firebaseService.getCaptureById(id);
      if (!capture) return res.status(404).json({ error: 'Captura no encontrada' });
      if (capture.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

      const updatedStats = { ...capture.stats, [statName]: Number(value) };
      await firebaseService.update('captures', id, { stats: updatedStats });

      res.json({ message: `Stat ${statName} actualizada a ${value}`, stats: updatedStats });
    } catch (error) {
      res.status(500).json({ error: 'Error al editar stat' });
    }
  },

  async changeSprite(req, res) {
    try {
      const { id } = req.params;
      const { sprite } = req.body;

      if (!sprite || typeof sprite !== 'string') {
        return res.status(400).json({ error: 'Sprite URL requerida' });
      }

      const capture = await firebaseService.getCaptureById(id);
      if (!capture) return res.status(404).json({ error: 'Captura no encontrada' });
      if (capture.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

      await firebaseService.update('captures', id, { sprite });
      res.json({ message: 'Sprite actualizado', sprite });
    } catch (error) {
      res.status(500).json({ error: 'Error al cambiar sprite' });
    }
  },

  async changeNature(req, res) {
    try {
      const { id } = req.params;
      const { nature } = req.body;

      if (!nature || typeof nature !== 'string') {
        return res.status(400).json({ error: 'Naturaleza requerida' });
      }

      const capture = await firebaseService.getCaptureById(id);
      if (!capture) return res.status(404).json({ error: 'Captura no encontrada' });
      if (capture.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

      await firebaseService.update('captures', id, { nature: nature.trim() });
      res.json({ message: 'Naturaleza actualizada', nature: nature.trim() });
    } catch (error) {
      res.status(500).json({ error: 'Error al cambiar naturaleza' });
    }
  },

  async updateMoves(req, res) {
    try {
      const { id } = req.params;
      const { moves } = req.body;

      if (!Array.isArray(moves)) {
        return res.status(400).json({ error: 'Moves debe ser un array' });
      }

      const capture = await firebaseService.getCaptureById(id);
      if (!capture) return res.status(404).json({ error: 'Captura no encontrada' });
      if (capture.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

      await firebaseService.update('captures', id, { moves });
      res.json({ message: 'Movimientos actualizados', moves });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar movimientos' });
    }
  },

  async evolve(req, res) {
    try {
      const { id } = req.params;

      const capture = await firebaseService.getCaptureById(id);
      if (!capture) return res.status(404).json({ error: 'Captura no encontrada' });
      if (capture.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

      const evoInfo = await pokeapi.getEvolutionInfo(capture.pokemonId);
      if (!evoInfo.evolvesTo) {
        return res.status(400).json({ error: 'Este Pokemon no tiene evolucion' });
      }

      const nextEvo = await pokeapi.getPokemonById(evoInfo.evolvesTo.id);

      const evolvedData = {
        pokemonId: nextEvo.pokedexNumber,
        pokemonName: nextEvo.name,
        sprite: nextEvo.sprites.front,
        types: nextEvo.types,
        stats: nextEvo.stats
      };

      await firebaseService.update('captures', id, evolvedData);
      res.json({ message: `${capture.pokemonName} evolucion a ${nextEvo.name}`, capture: { id, ...capture, ...evolvedData } });
    } catch (error) {
      res.status(500).json({ error: 'Error al evolucionar' });
    }
  },

  async updateTeam(req, res) {
    try {
      const { teamIds } = req.body;

      if (!Array.isArray(teamIds) || teamIds.length > 6) {
        return res.status(400).json({ error: 'El equipo debe ser un array de máximo 6 IDs' });
      }

      const userCaptures = await firebaseService.getCapturesByUser(req.userId);
      const userCaptureIds = userCaptures.map(c => c.id);

      const invalidIds = teamIds.filter(id => !userCaptureIds.includes(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({ error: 'Algunos IDs no pertenecen a tus capturas', invalidIds });
      }

      const user = await firebaseService.getById('users', req.userId);
      await firebaseService.update('users', req.userId, { team: teamIds });

      res.json({ message: 'Equipo actualizado', team: teamIds });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar equipo' });
    }
  },

  async getTeam(req, res) {
    try {
      const user = await firebaseService.getById('users', req.userId);
      const teamIds = user.team || [];

      if (teamIds.length === 0) return res.json([]);

      const team = [];
      for (const captureId of teamIds) {
        const capture = await firebaseService.getCaptureById(captureId);
        if (capture) team.push(capture);
      }

      res.json(team);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener equipo' });
    }
  },

  async release(req, res) {
    try {
      const { id } = req.params;
      
      const capture = await firebaseService.getCaptureById(id);
      if (!capture) return res.status(404).json({ error: 'Captura no encontrada' });
      if (capture.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

      const user = await firebaseService.getById('users', req.userId);
      if (user.team && user.team.includes(id)) {
        const newTeam = user.team.filter(teamId => teamId !== id);
        await firebaseService.update('users', req.userId, { team: newTeam });
      }

      await firebaseService.delete('captures', id);
      res.json({ message: `${capture.pokemonName} fue liberado` });
    } catch (error) {
      res.status(500).json({ error: 'Error al liberar pokemon' });
    }
  }
};

module.exports = capturesController;
