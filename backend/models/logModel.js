const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
    enum: ['debug', 'info', 'success', 'warning', 'error', 'fatal'],
    default: 'info'
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  module: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  agenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agence'
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  url: {
    type: String,
    trim: true
  },
  statusCode: {
    type: Number
  },
  duration: {
    type: Number // en millisecondes
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  erreur: {
    message: String,
    stack: String,
    code: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
logSchema.index({ timestamp: -1 });
logSchema.index({ level: 1, timestamp: -1 });
logSchema.index({ action: 1, timestamp: -1 });
logSchema.index({ agenceId: 1, timestamp: -1 });
logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ module: 1, timestamp: -1 });

// Méthodes statiques
logSchema.statics.findByLevel = function(level, options = {}) {
  const query = { level };
  
  if (options.agenceId) query.agenceId = options.agenceId;
  if (options.userId) query.userId = options.userId;
  if (options.module) query.module = options.module;
  if (options.startDate) query.timestamp = { $gte: options.startDate };
  if (options.endDate) {
    if (query.timestamp) {
      query.timestamp.$lte = options.endDate;
    } else {
      query.timestamp = { $lte: options.endDate };
    }
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

logSchema.statics.findByAgence = function(agenceId, options = {}) {
  const query = { agenceId };
  
  if (options.level) query.level = options.level;
  if (options.action) query.action = options.action;
  if (options.module) query.module = options.module;
  if (options.startDate) query.timestamp = { $gte: options.startDate };
  if (options.endDate) {
    if (query.timestamp) {
      query.timestamp.$lte = options.endDate;
    } else {
      query.timestamp = { $lte: options.endDate };
    }
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

logSchema.statics.getStats = function(agenceId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { $match: { agenceId, timestamp: { $gte: startDate } } },
    { $group: { _id: '$level', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

logSchema.statics.getActivityStats = function(agenceId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { $match: { agenceId, timestamp: { $gte: startDate } } },
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

// Méthodes de création de logs
logSchema.statics.info = function(data) {
  return this.create({ ...data, level: 'info' });
};

logSchema.statics.success = function(data) {
  return this.create({ ...data, level: 'success' });
};

logSchema.statics.warning = function(data) {
  return this.create({ ...data, level: 'warning' });
};

logSchema.statics.error = function(data) {
  return this.create({ ...data, level: 'error' });
};

logSchema.statics.fatal = function(data) {
  return this.create({ ...data, level: 'fatal' });
};

logSchema.statics.debug = function(data) {
  return this.create({ ...data, level: 'debug' });
};

// Méthodes d'instance
logSchema.methods.addDetail = function(key, value) {
  if (!this.details) this.details = {};
  this.details[key] = value;
  return this.save();
};

logSchema.methods.setError = function(error) {
  this.erreur = {
    message: error.message,
    stack: error.stack,
    code: error.code
  };
  this.level = 'error';
  return this.save();
};

// Middleware pre-save
logSchema.pre('save', function(next) {
  // Limiter la taille des détails
  if (this.details && JSON.stringify(this.details).length > 10000) {
    this.details = { message: 'Données trop volumineuses pour être affichées' };
  }
  
  // Limiter la taille de l'erreur
  if (this.erreur && this.erreur.stack && this.erreur.stack.length > 5000) {
    this.erreur.stack = this.erreur.stack.substring(0, 5000) + '...';
  }
  
  next();
});

// Méthodes virtuelles
logSchema.virtual('isError').get(function() {
  return ['error', 'fatal'].includes(this.level);
});

logSchema.virtual('isWarning').get(function() {
  return ['warning'].includes(this.level);
});

logSchema.virtual('isSuccess').get(function() {
  return ['success'].includes(this.level);
});

// Configuration pour inclure les virtuels dans la sérialisation JSON
logSchema.set('toJSON', { virtuals: true });
logSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Log', logSchema); 