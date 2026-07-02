const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const firebaseService = require('../services/firebase');
const { DAILY_COINS, JWT_EXPIRES_IN } = require('../config/constants');

const authController = {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email y password son requeridos' });
      }

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: 'Username debe tener entre 3 y 20 caracteres' });
      }

      const existingUser = await firebaseService.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: 'El username ya está en uso' });
      }

      const existingEmail = await firebaseService.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = await firebaseService.create('users', {
        username,
        email,
        password: hashedPassword,
        avatar: `https://play.pokemonshowdown.com/sprites/trainers/${Math.floor(Math.random() * 100)}.png`,
        coins: DAILY_COINS,
        dailyClaimAt: null,
        createdAt: new Date().toISOString()
      });

      const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN 
      });

      res.status(201).json({ 
        token, 
        user: { 
          id: newUser.id, 
          username, 
          email, 
          avatar: newUser.avatar,
          coins: newUser.coins 
        } 
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al registrar usuario', details: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email y password son requeridos' });
      }

      const user = await firebaseService.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN 
      });

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          avatar: user.avatar,
          coins: user.coins 
        } 
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al iniciar sesión', details: error.message });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await firebaseService.getById('users', req.userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coins: user.coins,
        dailyClaimAt: user.dailyClaimAt,
        createdAt: user.createdAt
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener perfil', details: error.message });
    }
  }
};

module.exports = authController;
