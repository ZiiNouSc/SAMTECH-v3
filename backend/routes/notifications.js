const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  deleteNotification,
  getNotificationStats
} = require('../controllers/notificationController');

const { protect } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(protect);

// Get all notifications
router.get('/', getNotifications);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Mark notification as read
router.put('/:id/read', markAsRead);

// Delete specific notification
router.delete('/:id', deleteNotification);

module.exports = router;