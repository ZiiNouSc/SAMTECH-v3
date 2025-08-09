const express = require('express');
const router = express.Router();
const autrePrestationController = require('../controllers/autrePrestationController');
const { protect, agent } = require('../middlewares/authMiddleware');

router.get('/', protect, agent, autrePrestationController.getAllPrestations);
router.get('/:id', protect, agent, autrePrestationController.getPrestationById);
router.post('/', protect, agent, autrePrestationController.createPrestation);
router.put('/:id', protect, agent, autrePrestationController.updatePrestation);
router.delete('/:id', protect, agent, autrePrestationController.deletePrestation);

module.exports = router; 