const firebaseService = require('../services/firebase');
const pokeapi = require('../services/pokeapi');
const { COMBAT_MIN_REWARD, COMBAT_MAX_REWARD, COMBAT_XP_BASE, MAX_LEVEL } = require('../config/constants');

function xpForLevel(level) {
  return level * level * 5;
}

function calcStats(baseStats, level) {
  const multiplier = level / 50;
  return {
    hp: Math.floor(baseStats.hp * multiplier) + 10,
    attack: Math.floor(baseStats.attack * multiplier) + 5,
    defense: Math.floor(baseStats.defense * multiplier) + 5,
    spAttack: Math.floor(baseStats.spAttack * multiplier) + 5,
    spDefense: Math.floor(baseStats.spDefense * multiplier) + 5,
    speed: Math.floor(baseStats.speed * multiplier) + 5
  };
}

const combatController = {
  async start(req, res) {
    try {
      const { captureId } = req.body;

      const playerPokemon = await firebaseService.getCaptureById(captureId);
      if (!playerPokemon) return res.status(404).json({ error: 'Pokemon no encontrado' });
      if (playerPokemon.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

      const wildPokemon = await pokeapi.getRandomPokemon();

      const playerStats = playerPokemon.stats;
      const wildLevel = Math.max(1, playerPokemon.level + Math.floor(Math.random() * 5) - 2);
      const wildStats = calcStats(wildPokemon.stats, wildLevel);

      let playerHP = playerStats.hp;
      let wildHP = wildStats.hp;
      const log = [];

      log.push(`¡Salvaje ${wildPokemon.name} Lv.${wildLevel} aparecio!`);

      while (playerHP > 0 && wildHP > 0) {
        const playerDamage = Math.max(1, Math.floor(
          ((playerStats.attack * 2) - wildStats.defense) * (0.85 + Math.random() * 0.15)
        ));
        wildHP -= playerDamage;
        log.push(`${playerPokemon.pokemonName} ataca por ${playerDamage}`);

        if (wildHP <= 0) break;

        const wildDamage = Math.max(1, Math.floor(
          ((wildStats.attack * 2) - playerStats.defense) * (0.85 + Math.random() * 0.15)
        ));
        playerHP -= wildDamage;
        log.push(`${wildPokemon.name} ataca por ${wildDamage}`);
      }

      const victory = playerHP > 0;
      let reward = 0;
      let itemDrop = null;
      let levelUp = null;

      if (victory) {
        reward = COMBAT_MIN_REWARD + Math.floor(Math.random() * (COMBAT_MAX_REWARD - COMBAT_MIN_REWARD));

        const xpGain = COMBAT_XP_BASE + wildLevel * 2;
        let newXp = (playerPokemon.xp || 0) + xpGain;
        let newLevel = playerPokemon.level || 1;

        log.push(`+${xpGain} XP`);

        while (newLevel < MAX_LEVEL && newXp >= xpForLevel(newLevel + 1)) {
          newXp -= xpForLevel(newLevel + 1);
          newLevel++;
        }

        const oldLevel = playerPokemon.level || 1;
        const leveledUp = newLevel > oldLevel;

        const updatedCapture = {
          level: newLevel,
          xp: newXp
        };

        if (leveledUp) {
          const basePokemon = await firebaseService.getPokemonByNumber(playerPokemon.pokemonId);
          const baseStats = basePokemon?.stats || playerPokemon.stats;
          updatedCapture.stats = calcStats(baseStats, newLevel);
          log.push(`¡${playerPokemon.pokemonName} subio a Lv.${newLevel}!`);
          levelUp = { from: oldLevel, to: newLevel, xpGain };
        } else {
          log.push(`+${xpGain} XP (${newXp}/${xpForLevel(newLevel + 1)})`);
        }

        await firebaseService.update('captures', captureId, updatedCapture);

        if (Math.random() < 0.1) {
          const items = await firebaseService.getAllItems();
          if (items.length > 0) {
            itemDrop = items[Math.floor(Math.random() * items.length)];
            await firebaseService.updateUserItem(req.userId, itemDrop.id, 1);
          }
        }

        const user = await firebaseService.getById('users', req.userId);
        await firebaseService.updateUserCoins(req.userId, (user.coins || 0) + reward);
      }

      const combatResult = await firebaseService.saveCombat({
        userId: req.userId,
        playerPokemon: {
          name: playerPokemon.pokemonName,
          sprite: playerPokemon.sprite,
          level: playerPokemon.level,
          pokemonId: playerPokemon.pokemonId
        },
        enemyPokemon: {
          name: wildPokemon.name,
          sprite: wildPokemon.sprites.front,
          level: wildLevel,
          pokemonId: wildPokemon.pokedexNumber
        },
        result: victory ? 'victory' : 'defeat',
        reward,
        itemDrop: itemDrop ? itemDrop.name : null,
        log,
        createdAt: new Date().toISOString()
      });

      res.json({
        result: victory ? 'victory' : 'defeat',
        playerHP: Math.max(0, playerHP),
        wildHP: Math.max(0, wildHP),
        reward,
        itemDrop: itemDrop ? itemDrop.name : null,
        levelUp,
        log,
        combatId: combatResult.id,
        playerPokemon: {
          name: playerPokemon.pokemonName,
          sprite: playerPokemon.sprite,
          level: playerPokemon.level,
          pokemonId: playerPokemon.pokemonId
        },
        enemyPokemon: {
          name: wildPokemon.name,
          sprite: wildPokemon.sprites.front,
          level: wildLevel,
          pokemonId: wildPokemon.pokedexNumber
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error en el combate', details: error.message });
    }
  },

  async history(req, res) {
    try {
      const combats = await firebaseService.getCombatHistory(req.userId);
      res.json(combats.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 50));
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener historial' });
    }
  }
};

module.exports = combatController;