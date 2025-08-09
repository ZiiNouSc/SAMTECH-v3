const express = require('express');
const router = express.Router();
const {
  getLogs,
  getLogById,
  deleteLog,
  clearOldLogs,
  getLogStats
} = require('../controllers/logController');

const { protect, admin } = require('../middlewares/authMiddleware');

// All routes require authentication and admin access
router.use(protect, admin);

// Get all logs
router.get('/', getLogs);

// Get log statistics
router.get('/stats', getLogStats);

// Clear old logs
router.delete('/old', clearOldLogs);

// Get and delete specific log
router.route('/:id')
  .get(getLogById)
  .delete(deleteLog);

module.exports = router;