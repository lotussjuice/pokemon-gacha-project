const express = require('express');
const router = express.Router();
const tradesController = require('../controllers/tradesController');
const auth = require('../middleware/auth');

router.post('/', auth, tradesController.create);
router.get('/', auth, tradesController.getAll);
router.post('/:id/accept', auth, tradesController.accept);
router.post('/:id/cancel', auth, tradesController.cancel);

module.exports = router;
