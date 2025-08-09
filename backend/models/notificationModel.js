// MODÈLE NOTIFICATIONS - COMMENTÉ TEMPORAIREMENT
// Ce modèle de notifications est temporairement désactivé
// Il sera réactivé une fois le système de notifications implémenté

/*
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['email', 'sms', 'push', 'system']
  },
  titre: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  destinataire: {
    type: String,
    required: true
  },
  statut: {
    type: String,
    required: true,
    enum: ['en_attente', 'envoye', 'lu', 'echec'],
    default: 'en_attente'
  },
  priorite: {
    type: String,
    required: true,
    enum: ['basse', 'normale', 'haute', 'urgente'],
    default: 'normale'
  },
  module: {
    type: String,
    trim: true
  },
  lien: {
    type: String,
    trim: true
  },
  agenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agence',
    required: true
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateEnvoi: {
    type: Date
  },
  dateOuverture: {
    type: Date
  },
  erreur: {
    type: String,
    trim: true
  },
  tentatives: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
notificationSchema.index({ agenceId: 1, statut: 1 });
notificationSchema.index({ destinataire: 1, dateCreation: -1 });
notificationSchema.index({ type: 1, statut: 1 });
notificationSchema.index({ priorite: 1, dateCreation: -1 });

// Méthodes statiques
notificationSchema.statics.findByAgence = function(agenceId, options = {}) {
  const { page = 1, limit = 20, statut, type, priorite } = options;
  
  const filter = { agenceId };
  if (statut) filter.statut = statut;
  if (type) filter.type = type;
  if (priorite) filter.priorite = priorite;
  
  return this.find(filter)
    .sort({ dateCreation: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

notificationSchema.statics.getStats = function(agenceId) {
  return this.aggregate([
    { $match: { agenceId: mongoose.Types.ObjectId(agenceId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        envoye: { $sum: { $cond: [{ $eq: ['$statut', 'envoye'] }, 1, 0] } },
        en_attente: { $sum: { $cond: [{ $eq: ['$statut', 'en_attente'] }, 1, 0] } },
        echec: { $sum: { $cond: [{ $eq: ['$statut', 'echec'] }, 1, 0] } },
        lu: { $sum: { $cond: [{ $eq: ['$statut', 'lu'] }, 1, 0] } }
      }
    }
  ]);
};

// Méthodes d'instance
notificationSchema.methods.markAsRead = function() {
  this.statut = 'lu';
  this.dateOuverture = new Date();
  return this.save();
};

notificationSchema.methods.markAsSent = function() {
  this.statut = 'envoye';
  this.dateEnvoi = new Date();
  return this.save();
};

notificationSchema.methods.markAsFailed = function(error) {
  this.statut = 'echec';
  this.erreur = error;
  this.tentatives += 1;
  return this.save();
};

// Middleware pre-save
notificationSchema.pre('save', function(next) {
  if (this.isNew) {
    this.dateCreation = new Date();
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
*/

// Export temporaire
module.exports = null; 