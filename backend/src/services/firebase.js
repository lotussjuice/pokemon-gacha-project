const db = require('../config/firebase');

const collections = {
  USERS: 'users',
  POKEMON: 'pokemon',
  CAPTURES: 'captures',
  ITEMS: 'items',
  USER_ITEMS: 'user_items',
  TRADES: 'trades',
  TRADE_MESSAGES: 'trade_messages',
  COMBATS: 'combats'
};

const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

function getCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

const firebaseService = {
  // Generic
  async getById(collection, id) {
    const key = `${collection}:id:${id}`;
    const cached = getCache(key);
    if (cached) return cached;

    const doc = await db.collection(collection).doc(id).get();
    const result = doc.exists ? { id: doc.id, ...doc.data() } : null;
    
    setCache(key, result);
    return result;
  },

  async create(collection, data) {
    invalidateCache(collection);
    const docRef = await db.collection(collection).add(data);
    return { id: docRef.id, ...data };
  },

  async update(collection, id, data) {
    invalidateCache(collection);
    await db.collection(collection).doc(id).update(data);
    return { id, ...data };
  },

  async delete(collection, id) {
    invalidateCache(collection);
    await db.collection(collection).doc(id).delete();
    return true;
  },

  async query(collection, field, operator, value) {
    const key = `${collection}:q:${field}:${operator}:${value}`;
    const cached = getCache(key);
    if (cached) return cached;

    const snapshot = await db.collection(collection)
      .where(field, operator, value)
      .get();
    const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    setCache(key, result);
    return result;
  },

  // Users
  async getUserByUsername(username) {
    const result = await this.query(collections.USERS, 'username', '==', username);
    return result[0] || null;
  },

  async getUserByEmail(email) {
    const result = await this.query(collections.USERS, 'email', '==', email);
    return result[0] || null;
  },

  async updateUserCoins(userId, coins) {
    return this.update(collections.USERS, userId, { coins });
  },

  async updateDailyClaim(userId) {
    return this.update(collections.USERS, userId, { 
      dailyClaimAt: new Date().toISOString() 
    });
  },

  // Pokemon
  async getAllPokemon() {
    const key = `${collections.POKEMON}:all`;
    const cached = getCache(key);
    if (cached) return cached;

    const snapshot = await db.collection(collections.POKEMON).get();
    const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    setCache(key, result);
    return result;
  },

  async getPokemonByNumber(pokedexNumber) {
    const result = await this.query(
      collections.POKEMON, 
      'pokedexNumber', 
      '==', 
      pokedexNumber
    );
    return result[0] || null;
  },

  async searchPokemonByName(name) {
    const key = `${collections.POKEMON}:search:${name}`;
    const cached = getCache(key);
    if (cached) return cached;

    const snapshot = await db.collection(collections.POKEMON)
      .where('name', '>=', name.toLowerCase())
      .where('name', '<=', name.toLowerCase() + '\uf8ff')
      .limit(20)
      .get();
    const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    setCache(key, result);
    return result;
  },

  // Captures
  async getCapturesByUser(userId) {
    return this.query(collections.CAPTURES, 'userId', '==', userId);
  },

  async getCaptureById(captureId) {
    return this.getById(collections.CAPTURES, captureId);
  },

  // Items
  async getAllItems() {
    const key = `${collections.ITEMS}:all`;
    const cached = getCache(key);
    if (cached) return cached;

    const snapshot = await db.collection(collections.ITEMS).get();
    const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    setCache(key, result);
    return result;
  },

  async getUserItems(userId) {
    return this.query(collections.USER_ITEMS, 'userId', '==', userId);
  },

  async updateUserItem(userId, itemId, quantity) {
    const existing = await this.query(
      collections.USER_ITEMS, 
      'userId', '==', userId
    );
    const userItem = existing.find(ui => ui.itemId === itemId);
    
    if (userItem) {
      return this.update(collections.USER_ITEMS, userItem.id, { 
        quantity: userItem.quantity + quantity 
      });
    } else {
      return this.create(collections.USER_ITEMS, { userId, itemId, quantity });
    }
  },

  // Combats
  async saveCombat(combatData) {
    return this.create(collections.COMBATS, combatData);
  },

  async getCombatHistory(userId) {
    return this.query(collections.COMBATS, 'userId', '==', userId);
  }
};

module.exports = firebaseService;
