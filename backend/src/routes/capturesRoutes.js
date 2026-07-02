const express = require('express');
const router = express.Router();
const capturesController = require('../controllers/capturesController');
const auth = require('../middleware/auth');

router.get('/my', auth, capturesController.getMyCaptures);
router.get('/team', auth, capturesController.getTeam);
router.post('/direct', auth, capturesController.captureDirect);
router.get('/:id', auth, capturesController.getById);
router.patch('/:id/nickname', auth, capturesController.updateNickname);
router.patch('/:id/stat', auth, capturesController.editStat);
router.patch('/:id/sprite', auth, capturesController.changeSprite);
router.patch('/:id/nature', auth, capturesController.changeNature);
router.patch('/:id/moves', auth, capturesController.updateMoves);
router.put('/:id/evolve', auth, capturesController.evolve);
router.put('/team', auth, capturesController.updateTeam);
router.delete('/:id', auth, capturesController.release);

module.exports = router;
