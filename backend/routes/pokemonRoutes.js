const express = require('express');
const router = express.Router();
const pokemonController = require('../controllers/pokemonController');

// Pokedex Maestra
router.get('/pokedex', pokemonController.obtenerPokedex);
router.get('/pokedex/random', pokemonController.obtenerAleatorio);
router.post('/pokedex', pokemonController.crearPokemonMaster);
router.put('/pokedex/:id', pokemonController.actualizarPokemonMaster);
router.delete('/pokedex/:id', pokemonController.eliminarPokemonMaster);

// Capturas (PC del Usuario)
router.get('/capturas', pokemonController.obtenerCapturas);
router.post('/capturas', pokemonController.capturarPokemon);
router.put('/capturas/evolucionar/:id', pokemonController.evolucionarPokemon);
router.patch('/capturas/apodo/:id', pokemonController.editarApodo);
router.patch('/capturas/stat/:id', pokemonController.editarStat);
router.patch('/capturas/naturaleza/:id', pokemonController.cambiarNaturaleza);
router.patch('/capturas/sprite/:id', pokemonController.cambiarSprite);
router.delete('/capturas/:id', pokemonController.borrarCaptura);

// Usuarios
router.put('/usuarios/:id', pokemonController.actualizarUsuario);
router.post('/usuarios', pokemonController.crearUsuario);

// Equipo
router.get('/equipos/:userId', pokemonController.obtenerEquipo);
router.put('/equipos/:userId', pokemonController.elegirEquipo);

module.exports = router;