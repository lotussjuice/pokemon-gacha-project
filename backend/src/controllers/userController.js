const firebaseService = require('../services/firebase');
const { DAILY_COINS } = require('../config/constants');

const userController = {
  async updateProfile(req, res) {
    try {
      const { username, email, avatar } = req.body;

      const user = await firebaseService.getById('users', req.userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      if (username && username !== user.username) {
        const existing = await firebaseService.getUserByUsername(username);
        if (existing && existing.id !== req.userId) {
          return res.status(409).json({ error: 'El username ya está en uso' });
        }
      }

      if (email && email !== user.email) {
        const existing = await firebaseService.getUserByEmail(email);
        if (existing && existing.id !== req.userId) {
          return res.status(409).json({ error: 'El email ya está registrado' });
        }
      }

      const updates = {};
      if (username) updates.username = username;
      if (email) updates.email = email;
      if (avatar) updates.avatar = avatar;

      await firebaseService.update('users', req.userId, updates);

      res.json({ message: 'Perfil actualizado', ...user, ...updates });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  },

  async resetAccount(req, res) {
    try {
      const user = await firebaseService.getById('users', req.userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      const captures = await firebaseService.getCapturesByUser(req.userId);
      for (const capture of captures) {
        await firebaseService.delete('captures', capture.id);
      }

      const userItems = await firebaseService.getUserItems(req.userId);
      for (const ui of userItems) {
        await firebaseService.delete('user_items', ui.id);
      }

      const combats = await firebaseService.query('combats', 'userId', '==', req.userId);
      for (const c of combats) {
        await firebaseService.delete('combats', c.id);
      }

      await firebaseService.update('users', req.userId, {
        coins: DAILY_COINS,
        dailyClaimAt: null,
        team: []
      });

      res.json({ message: 'Cuenta reiniciada. Se conservan datos de perfil.', coins: DAILY_COINS });
    } catch (error) {
      res.status(500).json({ error: 'Error al reiniciar cuenta' });
    }
  }
};

module.exports = userController;
