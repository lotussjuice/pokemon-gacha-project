const firebaseService = require('../services/firebase');
const { DAILY_COINS } = require('../config/constants');

const coinsController = {
  async getBalance(req, res) {
    try {
      const user = await firebaseService.getById('users', req.userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      res.json({ coins: user.coins || 0 });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener saldo' });
    }
  },

  async claimDaily(req, res) {
    try {
      const user = await firebaseService.getById('users', req.userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      const lastClaim = user.dailyClaimAt ? new Date(user.dailyClaimAt) : null;
      const now = new Date();
      
      if (lastClaim) {
        const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
        if (hoursSinceLastClaim < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceLastClaim);
          return res.status(400).json({ 
            error: `Ya reclamaste hoy. Vuelve en ${hoursRemaining} horas`,
            nextClaimIn: hoursRemaining
          });
        }
      }

      const newCoins = (user.coins || 0) + DAILY_COINS;
      await firebaseService.updateUserCoins(req.userId, newCoins);
      await firebaseService.updateDailyClaim(req.userId);

      res.json({ 
        message: `+${DAILY_COINS} monedas reclamadas`,
        coins: newCoins
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al reclamar monedas' });
    }
  }
};

module.exports = coinsController;
