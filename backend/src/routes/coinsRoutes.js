const express = require('express');
const router = express.Router();
const coinsController = require('../controllers/coinsController');
const auth = require('../middleware/auth');

router.get('/balance', auth, coinsController.getBalance);
router.post('/daily', auth, coinsController.claimDaily);

module.exports = router;
