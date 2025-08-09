const mongoose = require('mongoose');

const fournisseurSchema = new mongoose.Schema({
    nom: {
      type: String,
      required: true,
    trim: true
    },
    entreprise: {
      type: String,
      required: true,
    trim: true
    },
    email: {
      type: String,
      required: true,
    trim: true,
    lowercase: true
    },
    telephone: {
      type: String,
    trim: true
    },
    adresse: {
      type: String,
    trim: true
  },
  codePostal: {
    type: String,
    trim: true
  },
  ville: {
    type: String,
    trim: true
  },
  pays: {
    type: String,
    default: 'Algérie',
    trim: true
  },
  // Données de facturation
  nif: {
    type: String,
    trim: true
  },
  nis: {
    type: String,
    trim: true
  },
  art: {
    type: String,
    trim: true
  },
  siret: {
      type: String,
    trim: true
  },
  tva: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
    },
    agenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
    required: true
  },
  // Soldes stockés directement en DB - modifiables manuellement
  detteFournisseur: {
    type: Number,
    default: 0
  },
  soldeCrediteur: {
    type: Number,
    default: 0
  },
  services: {
    type: [String],
    default: []
  },
  autresService: {
    type: String,
    trim: true
  },
  commissionRules: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  rtsRules: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  }
}, {
    timestamps: true
});

// Index pour les performances - email unique par agence
fournisseurSchema.index({ agenceId: 1, email: 1 }, { unique: true });
fournisseurSchema.index({ agenceId: 1, entreprise: 1 });

module.exports = mongoose.model('Fournisseur', fournisseurSchema);