const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.put('/profile', auth, userController.updateProfile);
router.delete('/reset', auth, userController.resetAccount);

module.exports = router;
