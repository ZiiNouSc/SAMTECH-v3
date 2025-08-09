const express = require('express');
const router = express.Router();
const { protect, agent } = require('../middlewares/authMiddleware');
const {
  getAllFactures,
  getFactureById,
  createFacture,
  updateFacture,
  deleteFacture,
  markAsPaid,
  markAsOverdue,
  generatePDF
} = require('../controllers/factureFournisseurController');

// Routes pour les factures fournisseurs
router.get('/', protect, agent, getAllFactures);
router.get('/:id', protect, agent, getFactureById);
router.get('/:id/pdf', protect, agent, generatePDF);
router.post('/', protect, agent, createFacture);
router.put('/:id', protect, agent, updateFacture);
router.delete('/:id', protect, agent, deleteFacture);

// Routes spéciales
router.put('/:id/mark-paid', protect, agent, markAsPaid);
router.put('/:id/mark-overdue', protect, agent, markAsOverdue);

module.exports = router; 