const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['appel', 'email', 'rencontre', 'devis', 'vente'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: true
  },
  resultat: {
    type: String,
    enum: ['positif', 'neutre', 'negatif'],
    default: 'positif'
  }
}, { timestamps: true });

const contactCrmSchema = new mongoose.Schema({
  agenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agence',
    required: true
  },
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  entreprise: {
    type: String,
    default: null
  },
  email: {
    type: String,
    required: true
  },
  telephone: {
    type: String,
    required: true
  },
  statut: {
    type: String,
    enum: ['prospect', 'client', 'ancien_client'],
    default: 'prospect'
  },
  source: {
    type: String,
    enum: ['site_web', 'recommandation', 'publicite', 'salon', 'autre'],
    default: 'site_web'
  },
  score: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  derniereInteraction: {
    type: Date,
    default: Date.now
  },
  prochainRappel: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  interactions: [interactionSchema],
  isClient: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
contactCrmSchema.index({ agenceId: 1, statut: 1 });
contactCrmSchema.index({ agenceId: 1, email: 1 });
contactCrmSchema.index({ agenceId: 1, nom: 1, prenom: 1 });

module.exports = mongoose.model('ContactCrm', contactCrmSchema); 