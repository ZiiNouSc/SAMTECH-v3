const express = require('express');
const router = express.Router();
const { 
  getClients, 
  getClientById, 
  getClientHistory,
  createClient, 
  updateClient, 
  deleteClient,
  exportClientsExcel
} = require('../controllers/clientController');
const { protect, hasPermission } = require('../middlewares/authMiddleware');

// Get all clients
router.get('/', protect, hasPermission('clients', 'lire'), getClients);

// Export clients to Excel
router.get('/export/excel', protect, hasPermission('clients', 'lire'), exportClientsExcel);

// Get client by ID
router.get('/:id', protect, hasPermission('clients', 'lire'), getClientById);

// Get client history
router.get('/:id/history', protect, hasPermission('clients', 'lire'), getClientHistory);

// Create new client
router.post('/', protect, hasPermission('clients', 'creer'), createClient);

// Update client
router.put('/:id', protect, hasPermission('clients', 'modifier'), updateClient);

// Delete client
router.delete('/:id', protect, hasPermission('clients', 'supprimer'), deleteClient);

module.exports = router;