const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['superadmin', 'agence', 'agent'],
    required: true
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT', 'CONNECT', 'DISCONNECT', 'SEND_FACTURE', 'PAY_FACTURE', 'ADVANCE_FOURNISSEUR', 'PAY_FOURNISSEUR', 'SEND_EMAIL', 'SET_DRAFT', 'modification_operation'],
    required: true
  },
  module: {
    type: String,
    enum: ['clients', 'factures', 'reservations', 'agents', 'parametres', 'auth', 'dashboard', 'permissions', 'audit', 'caisse', 'profile', 'fournisseurs'],
    required: true
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  success: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number, // en millisecondes
    default: 0
  },
  affectedResource: {
    type: String, // ex: "client:123", "facture:456"
    default: null
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances des requêtes
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ module: 1, timestamp: -1 });
auditLogSchema.index({ userRole: 1, timestamp: -1 });
auditLogSchema.index({ success: 1, timestamp: -1 });
auditLogSchema.index({ affectedResource: 1, timestamp: -1 });

// Méthode statique pour créer un log d'audit
auditLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Erreur lors de la création du log d\'audit:', error);
    throw error;
  }
};

// Méthode statique pour obtenir les statistiques
auditLogSchema.statics.getStats = async function(filters = {}) {
  try {
    const matchStage = {};
    
    if (filters.action) matchStage.action = filters.action;
    if (filters.module) matchStage.module = filters.module;
    if (filters.userRole) matchStage.userRole = filters.userRole;
    if (filters.success !== undefined) matchStage.success = filters.success === 'true';
    if (filters.startDate || filters.endDate) {
      matchStage.timestamp = {};
      if (filters.startDate) matchStage.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        matchStage.timestamp.$lte = endDate;
      }
    }

    const stats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          successCount: { $sum: { $cond: ['$success', 1, 0] } },
          failureCount: { $sum: { $cond: ['$success', 0, 1] } },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    const actionStats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const moduleStats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$module',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return {
      totalLogs: stats[0]?.totalLogs || 0,
      successCount: stats[0]?.successCount || 0,
      failureCount: stats[0]?.failureCount || 0,
      avgDuration: Math.round(stats[0]?.avgDuration || 0),
      actionStats,
      moduleStats
    };
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    throw error;
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema); 