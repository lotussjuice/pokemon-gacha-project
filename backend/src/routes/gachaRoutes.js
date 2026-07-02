const express = require('express');
const router = express.Router();
const gachaController = require('../controllers/gachaController');
const auth = require('../middleware/auth');

router.post('/pull', auth, gachaController.pull);

module.exports = router;
