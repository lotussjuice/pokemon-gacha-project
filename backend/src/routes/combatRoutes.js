const express = require('express');
const router = express.Router();
const combatController = require('../controllers/combatController');
const auth = require('../middleware/auth');

router.post('/start', auth, combatController.start);
router.get('/history', auth, combatController.history);

module.exports = router;
