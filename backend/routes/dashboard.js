const express = require('express');
const router = express.Router();
const { 
  getStats, 
  getSuperadminStats, 
  getAgenceStats,
  getAgentStats,
  getDashboardOverview,
  getRecentActivities,
  getFinancialSummary,
  getTopClients,
  getDashboardAlerts
} = require('../controllers/dashboardController');
const { protect, admin, agency, agent } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(protect);

// General dashboard stats (for all users)
router.get('/stats', getStats);

// Superadmin routes
router.get('/superadmin/stats', admin, getSuperadminStats);

// Agent routes (accessible to agents) - PLACÉ AVANT LE MIDDLEWARE AGENCY
router.get('/agent/stats', agent, getAgentStats);

// Agency routes
router.use(agency);

router.get('/agence/stats', getAgenceStats);
router.get('/overview', getDashboardOverview);
router.get('/activities', getRecentActivities);
router.get('/financial', getFinancialSummary);
router.get('/top-clients', getTopClients);
router.get('/alerts', getDashboardAlerts);

module.exports = router;