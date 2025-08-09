const asyncHandler = require('express-async-handler');
const Notification = require('../models/notificationModel');

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ 
    destinataire: req.user._id 
  }).sort({ dateCreation: -1 });
  
  res.json(notifications);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  
  if (notification && notification.destinataire.toString() === req.user._id.toString()) {
    notification.lu = true;
    notification.dateLecture = new Date();
    const updatedNotification = await notification.save();
    res.json(updatedNotification);
  } else {
    res.status(404);
    throw new Error('Notification non trouvée');
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  
  if (notification && notification.destinataire.toString() === req.user._id.toString()) {
    await notification.remove();
    res.json({ message: 'Notification supprimée' });
  } else {
    res.status(404);
    throw new Error('Notification non trouvée');
  }
});

// @desc    Get notification stats
// @route   GET /api/notifications/stats
// @access  Private
const getNotificationStats = asyncHandler(async (req, res) => {
  const total = await Notification.countDocuments({ destinataire: req.user._id });
  const nonLues = await Notification.countDocuments({ 
    destinataire: req.user._id, 
    lu: false 
  });
  
  res.json({
    total,
    nonLues,
    lues: total - nonLues
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  getNotificationStats
}; 