const express = require('express');
const router = express.Router();
const { 
  getOperations, 
  getStatistiques, 
  enregistrerEntree, 
  enregistrerSortie,
  getSoldeCaisse,
  getRapportCaisse,
  getOperationById,
  annulerOperation,
  modifierOperation
} = require('../controllers/caisseController');
const { protect, hasPermission } = require('../middlewares/authMiddleware');

// ===== ROUTES PRINCIPALES =====

// Get all operations with advanced filters
router.get('/operations', protect, hasPermission('caisse', 'lire'), getOperations);

// Get caisse statistics and summary
router.get('/statistics', protect, hasPermission('caisse', 'lire'), getStatistiques);

// Get current balance
router.get('/solde', protect, hasPermission('caisse', 'lire'), getSoldeCaisse);

// Create new operation (entrée)
router.post('/entree', protect, hasPermission('caisse', 'creer'), enregistrerEntree);

// Create new operation (sortie)
router.post('/sortie', protect, hasPermission('caisse', 'creer'), enregistrerSortie);

// Get operation by ID
router.get('/operations/:id', protect, hasPermission('caisse', 'lire'), getOperationById);

// Cancel operation (only for manual operations)
router.put('/operations/:id/annuler', protect, hasPermission('caisse', 'modifier'), annulerOperation);

// Update operation
router.put('/operations/:id', protect, hasPermission('caisse', 'modifier'), modifierOperation);

// Get rapport de caisse
router.get('/rapport', protect, hasPermission('caisse', 'lire'), getRapportCaisse);

module.exports = router;