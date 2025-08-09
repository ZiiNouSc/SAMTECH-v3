const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const { 
  getAuditLogs, 
  getAuditLogById, 
  getAuditStats, 
  exportAuditLogs 
} = require('../controllers/auditController');

// Toutes les routes d'audit nécessitent une authentification et des droits admin
router.use(protect);
router.use(admin);

// Routes pour les logs d'audit
router.get('/logs', getAuditLogs);
router.get('/logs/:id', getAuditLogById);
router.get('/stats', getAuditStats);
router.get('/export', exportAuditLogs);

module.exports = router;