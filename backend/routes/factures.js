const express = require('express');
const router = express.Router();
const { 
  getFactures, 
  getFactureById, 
  createFacture, 
  updateFacture, 
  markFactureAsPaid, 
  makePayment,
  sendFactureEmail,
  deleteFacture,
  generateFacturePDF,
  recalculateClientBalances,
  createAvoir,
  cancelFacture,
  refundFacture,
  exportFacturesToExcel,
  payerFactureFournisseur,
  verifierCapacitePaiement
} = require('../controllers/factureController');
const { protect, hasPermission } = require('../middlewares/authMiddleware');

// Get all factures
router.get('/', protect, hasPermission('factures', 'lire'), getFactures);

// Get facture by ID
router.get('/:id', protect, hasPermission('factures', 'lire'), getFactureById);

// Create new facture
router.post('/', protect, hasPermission('factures', 'creer'), createFacture);

// Update facture
router.put('/:id', protect, hasPermission('factures', 'modifier'), updateFacture);

// Mark facture as paid
router.put('/:id/pay', protect, hasPermission('factures', 'modifier'), markFactureAsPaid);

// Make payment on facture
router.post('/:id/payment', protect, hasPermission('factures', 'modifier'), makePayment);

// Send facture
router.post('/:id/send-email', protect, hasPermission('factures', 'modifier'), sendFactureEmail);

// Delete facture
router.delete('/:id', protect, hasPermission('factures', 'supprimer'), deleteFacture);

// Generate PDF for facture
router.get('/:id/pdf', protect, hasPermission('factures', 'lire'), generateFacturePDF);

// Export factures to Excel
router.get('/export/excel', protect, hasPermission('factures', 'lire'), exportFacturesToExcel);

// Recalculate client balances
router.post('/recalculate-balances', protect, hasPermission('factures', 'modifier'), recalculateClientBalances);

// Créer un avoir sur une facture
router.post('/:id/avoir', protect, hasPermission('factures', 'modifier'), createAvoir);

// Annuler une facture
router.put('/:id/cancel', protect, hasPermission('factures', 'modifier'), cancelFacture);

// Rembourser une facture
router.post('/:id/refund', protect, hasPermission('factures', 'modifier'), refundFacture);

// Changer le statut de la facture à envoyée
router.put('/:id/send', protect, hasPermission('factures', 'modifier'), require('../controllers/factureController').sendFacture);

// Payer une facture fournisseur avec choix du mode de paiement
router.post('/:id/payer-fournisseur', protect, hasPermission('factures', 'modifier'), payerFactureFournisseur);

// Vérifier la capacité de paiement d'un fournisseur
router.get('/verifier-paiement/:fournisseurId', protect, hasPermission('factures', 'lire'), verifierCapacitePaiement);

module.exports = router;
