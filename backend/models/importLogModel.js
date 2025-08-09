const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema({
  emailId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  originalModule: {
    type: String,
    required: true,
    enum: ['billets', 'hotel', 'visa', 'assurance']
  },
  finalModule: {
    type: String,
    required: true,
    enum: ['billets', 'hotel', 'visa', 'assurance']
  },
  reclassified: {
    type: Boolean,
    default: false,
    index: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  indicators: [{
    type: String
  }],
  status: {
    type: String,
    required: true,
    enum: ['success', 'error', 'pending'],
    default: 'pending'
  },
  message: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  agenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agence',
    required: true,
    index: true
  },
  // Données de l'email original
  emailSubject: String,
  emailSender: String,
  emailBody: String,
  attachmentNames: [String],
  // Données extraites
  extractedData: {
    type: mongoose.Schema.Types.Mixed
  },
  // ID de l'entrée créée dans le module final
  createdEntryId: {
    type: mongoose.Schema.Types.ObjectId
  },
  // Métadonnées supplémentaires
  processingTime: Number, // temps en ms
  errorDetails: String
}, {
  timestamps: true
});

// Index composé pour les requêtes fréquentes
importLogSchema.index({ agenceId: 1, timestamp: -1 });
importLogSchema.index({ agenceId: 1, finalModule: 1 });
importLogSchema.index({ agenceId: 1, reclassified: 1 });
importLogSchema.index({ agenceId: 1, status: 1 });

// Méthodes statiques utiles
importLogSchema.statics.getStatsByAgence = function(agenceId, dateFrom, dateTo) {
  const matchConditions = { agenceId };
  
  if (dateFrom || dateTo) {
    matchConditions.timestamp = {};
    if (dateFrom) matchConditions.timestamp.$gte = new Date(dateFrom);
    if (dateTo) matchConditions.timestamp.$lte = new Date(dateTo);
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalImports: { $sum: 1 },
        successfulImports: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        reclassifiedImports: {
          $sum: { $cond: ['$reclassified', 1, 0] }
        },
        avgConfidence: { $avg: '$confidence' },
        moduleDistribution: {
          $push: {
            originalModule: '$originalModule',
            finalModule: '$finalModule',
            reclassified: '$reclassified'
          }
        }
      }
    }
  ]);
};

importLogSchema.statics.getReclassificationPatterns = function(agenceId, limit = 10) {
  return this.aggregate([
    { 
      $match: { 
        agenceId,
        reclassified: true,
        status: 'success'
      }
    },
    {
      $group: {
        _id: {
          from: '$originalModule',
          to: '$finalModule'
        },
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        commonIndicators: { $push: '$indicators' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

// Middleware pour nettoyer les anciens logs (optionnel)
importLogSchema.statics.cleanupOldLogs = function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate },
    status: { $ne: 'error' } // Garder les erreurs plus longtemps pour debugging
  });
};

// Virtuel pour calculer la durée de traitement
importLogSchema.virtual('processingTimeFormatted').get(function() {
  if (!this.processingTime) return null;
  
  if (this.processingTime < 1000) {
    return `${this.processingTime}ms`;
  } else {
    return `${(this.processingTime / 1000).toFixed(2)}s`;
  }
});

// Export du modèle
const ImportLog = mongoose.model('ImportLog', importLogSchema);

module.exports = ImportLog; 