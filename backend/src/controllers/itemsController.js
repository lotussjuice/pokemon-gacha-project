const firebaseService = require('../services/firebase');

const itemsController = {
  async getAll(req, res) {
    try {
      const items = await firebaseService.getAllItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener items' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const item = await firebaseService.getById('items', id);
      if (!item) return res.status(404).json({ error: 'Item no encontrado' });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener item' });
    }
  },

  async getMyItems(req, res) {
    try {
      const userItems = await firebaseService.getUserItems(req.userId);
      res.json(userItems);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener inventario' });
    }
  },

  async buy(req, res) {
    try {
      const { itemId } = req.body;
      
      const item = await firebaseService.getById('items', itemId);
      if (!item) return res.status(404).json({ error: 'Item no encontrado' });

      const user = await firebaseService.getById('users', req.userId);
      if ((user.coins || 0) < item.price) {
        return res.status(400).json({ 
          error: 'Monedas insuficientes',
          required: item.price,
          current: user.coins || 0
        });
      }

      await firebaseService.updateUserCoins(req.userId, user.coins - item.price);
      await firebaseService.updateUserItem(req.userId, itemId, 1);

      res.json({
        message: `${item.name} comprado`,
        cost: item.price,
        remainingCoins: user.coins - item.price
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al comprar item' });
    }
  },

  async sell(req, res) {
    try {
      const { id: userItemId } = req.params;
      const quantity = parseInt(req.query.quantity) || 1;

      const userItem = await firebaseService.getById('user_items', userItemId);
      if (!userItem) return res.status(404).json({ error: 'Item no encontrado en inventario' });
      if (userItem.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });
      if (userItem.quantity < quantity) {
        return res.status(400).json({ error: 'No tienes suficientes unidades' });
      }

      const item = await firebaseService.getById('items', userItem.itemId);
      const sellPrice = Math.floor((item?.price || 50) * 0.5);
      const totalEarned = sellPrice * quantity;

      if (userItem.quantity === quantity) {
        await firebaseService.delete('user_items', userItemId);
      } else {
        await firebaseService.update('user_items', userItemId, { 
          quantity: userItem.quantity - quantity 
        });
      }

      const user = await firebaseService.getById('users', req.userId);
      await firebaseService.updateUserCoins(req.userId, (user.coins || 0) + totalEarned);

      res.json({ message: `Vendido por ${totalEarned} monedas`, earned: totalEarned });
    } catch (error) {
      res.status(500).json({ error: 'Error al vender item' });
    }
  }
};

module.exports = itemsController;
