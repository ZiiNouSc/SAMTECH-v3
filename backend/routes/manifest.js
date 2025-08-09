const express = require('express');
const router = express.Router();
const manifestController = require('../controllers/manifestController');
const { protect, agent } = require('../middlewares/authMiddleware');

router.get('/', protect, agent, manifestController.getAllManifests);
router.get('/:id', protect, agent, manifestController.getManifestById);
router.post('/', protect, agent, manifestController.createManifest);
router.put('/:id', protect, agent, manifestController.updateManifest);
router.delete('/:id', protect, agent, manifestController.deleteManifest);

module.exports = router; 