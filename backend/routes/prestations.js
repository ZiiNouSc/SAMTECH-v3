const express = require('express');
const router = express.Router();
const {
  getPrestationsNonFacturees,
  getPrestationByReference
} = require('../controllers/prestationController');
const { protect, hasPermission } = require('../middlewares/authMiddleware');

// Récupérer les prestations non facturées pour un client
router.get('/non-facturees/:clientId', protect, hasPermission('factures', 'lire'), getPrestationsNonFacturees);

// Rechercher une prestation par référence
router.get('/reference/:reference', protect, hasPermission('factures', 'lire'), getPrestationByReference);

module.exports = router; 