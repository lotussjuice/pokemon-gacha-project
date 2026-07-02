const firebaseService = require('../services/firebase');
const pokeapi = require('../services/pokeapi');

const tradesController = {
  async create(req, res) {
    try {
      const { offeredCaptureId, wantedPokemonName } = req.body;

      if (!offeredCaptureId || !wantedPokemonName) {
        return res.status(400).json({ error: 'offeredCaptureId y wantedPokemonName son requeridos' });
      }

      const offeredCapture = await firebaseService.getCaptureById(offeredCaptureId);
      if (!offeredCapture) return res.status(404).json({ error: 'La captura ofrecida no existe' });
      if (offeredCapture.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

      try {
        await pokeapi.getPokemonByName(wantedPokemonName.toLowerCase());
      } catch {
        return res.status(400).json({ error: `"${wantedPokemonName}" no existe en PokeAPI` });
      }

      const user = await firebaseService.getById('users', req.userId);

      const trade = await firebaseService.create('trades', {
        creatorId: req.userId,
        creatorUsername: user?.username || 'unknown',
        offeredCaptureId,
        offeredPokemonName: offeredCapture.pokemonName,
        wantedPokemonName: wantedPokemonName.toLowerCase(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      res.status(201).json({ message: 'Intercambio publicado', trade });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear intercambio' });
    }
  },

  async getAll(req, res) {
    try {
      const snapshot = await require('../config/firebase').collection('trades')
        .where('status', '==', 'pending')
        .get();

      const trades = [];
      for (const doc of snapshot.docs) {
        const tradeData = { id: doc.id, ...doc.data() };
        try {
          tradeData.capture = await firebaseService.getCaptureById(tradeData.offeredCaptureId);
        } catch {
          tradeData.capture = null;
        }
        trades.push(tradeData);
      }
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener intercambios' });
    }
  },

  async accept(req, res) {
    try {
      const { id } = req.params;
      const { responderCaptureId } = req.body;

      if (!responderCaptureId) {
        return res.status(400).json({ error: 'responderCaptureId es requerido' });
      }

      const trade = await firebaseService.getById('trades', id);
      if (!trade) return res.status(404).json({ error: 'Intercambio no encontrado' });
      if (trade.status !== 'pending') return res.status(400).json({ error: 'El intercambio ya no esta disponible' });
      if (trade.creatorId === req.userId) return res.status(400).json({ error: 'No puedes aceptar tu propio intercambio' });

      const responderCapture = await firebaseService.getCaptureById(responderCaptureId);
      if (!responderCapture) return res.status(404).json({ error: 'Tu captura no existe' });
      if (responderCapture.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

      const wantedName = trade.wantedPokemonName.toLowerCase();
      if (responderCapture.pokemonName.toLowerCase() !== wantedName) {
        return res.status(400).json({ error: `Este intercambio requiere un ${trade.wantedPokemonName}` });
      }

      const offeredCapture = await firebaseService.getCaptureById(trade.offeredCaptureId);
      if (!offeredCapture) return res.status(400).json({ error: 'El pokemon ofrecido ya no existe' });

      await firebaseService.update('captures', trade.offeredCaptureId, { userId: req.userId });
      await firebaseService.update('captures', responderCaptureId, { userId: trade.creatorId });
      await firebaseService.update('trades', id, { status: 'accepted', acceptedAt: new Date().toISOString() });

      res.json({ message: 'Intercambio completado' });
    } catch (error) {
      res.status(500).json({ error: 'Error al aceptar intercambio' });
    }
  },

  async cancel(req, res) {
    try {
      const { id } = req.params;

      const trade = await firebaseService.getById('trades', id);
      if (!trade) return res.status(404).json({ error: 'Intercambio no encontrado' });
      if (trade.creatorId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

      await firebaseService.update('trades', id, { status: 'cancelled' });
      res.json({ message: 'Intercambio cancelado' });
    } catch (error) {
      res.status(500).json({ error: 'Error al cancelar intercambio' });
    }
  }
};

module.exports = tradesController;
