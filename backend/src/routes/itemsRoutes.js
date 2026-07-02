const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const auth = require('../middleware/auth');

router.get('/', auth, itemsController.getAll);
router.get('/my', auth, itemsController.getMyItems);
router.get('/:id', auth, itemsController.getById);
router.post('/buy', auth, itemsController.buy);
router.delete('/sell/:id', auth, itemsController.sell);

module.exports = router;
