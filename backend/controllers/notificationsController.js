// CONTRÔLEUR NOTIFICATIONS - COMMENTÉ TEMPORAIREMENT
// Ce contrôleur de notifications est temporairement désactivé
// Il sera réactivé une fois le système de notifications implémenté

/*
const asyncHandler = require('express-async-handler');
const Notification = require('../models/notificationModel');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { page = 1, limit = 20, statut, type, priorite } = req.query;
  
  // Build filter
  const filter = { agenceId };
  
  if (statut) filter.statut = statut;
  if (type) filter.type = type;
  if (priorite) filter.priorite = priorite;
  
  const notifications = await Notification.find(filter)
    .sort({ dateCreation: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ 
    agenceId, 
    statut: 'en_attente' 
  });
  
  res.status(200).json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  });
});

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
const getNotificationById = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const notification = await Notification.findOne({
    _id: req.params.id,
    agenceId
  });
  
  if (notification) {
    res.status(200).json({
      success: true,
      data: notification
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Notification non trouvée'
    });
  }
});

// @desc    Create new notification
// @route   POST /api/notifications
// @access  Private
const createNotification = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { 
    type, 
    titre, 
    message, 
    destinataire, 
    priorite = 'normale',
    module,
    lien
  } = req.body;
  
  if (!type || !titre || !message) {
    return res.status(400).json({
      success: false,
      message: 'Type, titre et message sont requis'
    });
  }
  
  const notification = await Notification.create({
    type,
    titre,
    message,
    destinataire: destinataire || req.user?.email,
    statut: 'en_attente',
    priorite,
    module,
    lien,
    agenceId,
    dateCreation: new Date()
  });
  
  res.status(201).json({
    success: true,
    message: 'Notification créée avec succès',
    data: notification
  });
});

// @desc    Update notification status
// @route   PUT /api/notifications/:id/status
// @access  Private
const updateNotificationStatus = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { statut } = req.body;
  
  if (!statut || !['en_attente', 'envoye', 'lu', 'echec'].includes(statut)) {
    return res.status(400).json({
      success: false,
      message: 'Statut invalide'
    });
  }
  
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, agenceId },
    { 
      statut,
      ...(statut === 'lu' && { dateOuverture: new Date() }),
      ...(statut === 'envoye' && { dateEnvoi: new Date() })
    },
    { new: true }
  );
  
  if (notification) {
    res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: notification
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Notification non trouvée'
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const result = await Notification.updateMany(
    { agenceId, statut: 'en_attente' },
    { 
      statut: 'lu',
      dateOuverture: new Date()
    }
  );
  
  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} notifications marquées comme lues`,
    modifiedCount: result.modifiedCount
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    agenceId
  });
  
  if (notification) {
    res.status(200).json({
      success: true,
      message: 'Notification supprimée avec succès'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Notification non trouvée'
    });
  }
});

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
const getNotificationStats = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const stats = await Notification.getStats(agenceId);
  
  res.status(200).json({
    success: true,
    data: stats[0] || {
      total: 0,
      envoye: 0,
      en_attente: 0,
      echec: 0,
      lu: 0
    }
  });
});

module.exports = {
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotificationStatus,
  markAllAsRead,
  deleteNotification,
  getNotificationStats
};
*/

// Export temporaire
module.exports = {}; 