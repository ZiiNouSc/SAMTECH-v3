const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getCreances, sendReminder, getCreanceStats } = require('../controllers/creanceController');

// Get all creances
router.get('/', protect, getCreances);

// Send reminder for a creance
router.post('/:id/reminder', protect, sendReminder);

// Get creance statistics
router.get('/stats', protect, getCreanceStats);

module.exports = router;