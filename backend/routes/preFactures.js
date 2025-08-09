const express = require('express');
const router = express.Router();
const {
  getPreFactures,
  getPreFactureById,
  createPreFacture,
  updatePreFacture,
  deletePreFacture,
  convertPreFactureToFacture,
  sendPreFacture,
  acceptPreFacture,
  rejectPreFacture,
  generatePreFacturePDF
} = require('../controllers/preFactureController');
const { protect, hasPermission } = require('../middlewares/authMiddleware');

// Get all devis
router.get('/', protect, hasPermission('pre-factures', 'lire'), getPreFactures);

// Get devis by ID
router.get('/:id', protect, hasPermission('pre-factures', 'lire'), getPreFactureById);

// Create new devis
router.post('/', protect, hasPermission('pre-factures', 'creer'), createPreFacture);

// Update devis
router.put('/:id', protect, hasPermission('pre-factures', 'modifier'), updatePreFacture);

// Delete devis
router.delete('/:id', protect, hasPermission('pre-factures', 'supprimer'), deletePreFacture);

// Convert devis to facture
router.post('/:id/convert', protect, hasPermission('pre-factures', 'modifier'), convertPreFactureToFacture);

// Send devis
router.put('/:id/send', protect, hasPermission('pre-factures', 'modifier'), sendPreFacture);

// Accept devis
router.put('/:id/accept', protect, hasPermission('pre-factures', 'modifier'), acceptPreFacture);

// Reject devis
router.put('/:id/reject', protect, hasPermission('pre-factures', 'modifier'), rejectPreFacture);

// Générer le PDF du devis (devis)
router.get('/:id/pdf', protect, hasPermission('pre-factures', 'lire'), generatePreFacturePDF);

module.exports = router;