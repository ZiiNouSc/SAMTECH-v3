const mongoose = require('mongoose');

const rapportSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['financier', 'clients', 'reservations', 'activite', 'personnalise']
  },
  parametres: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resultats: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv', 'json'],
    default: 'pdf'
  },
  statut: {
    type: String,
    enum: ['en_cours', 'termine', 'erreur'],
    default: 'en_cours'
  },
  agenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agence',
    required: true
  },
  createur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date,
    default: Date.now
  },
  dateExecution: {
    type: Date
  },
  fichierUrl: {
    type: String
  },
  taille: {
    type: Number
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
rapportSchema.index({ agenceId: 1, type: 1 });
rapportSchema.index({ createur: 1, dateCreation: -1 });
rapportSchema.index({ statut: 1 });

module.exports = mongoose.model('Rapport', rapportSchema); 