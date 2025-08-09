const mongoose = require('mongoose');

const factureFournisseurSchema = new mongoose.Schema({
  fournisseurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fournisseur',
    required: true
  },
  numero: {
    type: String,
    required: true,
    unique: true
  },
  dateEmission: {
    type: Date,
    required: true,
    default: Date.now
  },
  dateEcheance: {
    type: Date,
    required: true
  },
  statut: {
    type: String,
    enum: ['brouillon', 'envoyée', 'payée', 'en_retard'],
    default: 'brouillon'
  },
  montantHT: {
    type: Number,
    required: true
  },
  montantTTC: {
    type: Number,
    required: true
  },
  montantTVA: {
    type: Number,
    default: 0
  },
  tva: {
    type: Number,
    default: 0
  },
  articles: [{
    designation: {
      type: String,
      required: true
    },
    quantite: {
      type: Number,
      required: true,
      default: 1
    },
    prixUnitaire: {
      type: Number,
      required: true
    },
    montant: {
      type: Number,
      required: true
    }
  }],
  notes: {
    type: String
  },
  conditionsPaiement: {
    type: String,
    default: 'Paiement à 30 jours'
  },
  emailEnvoye: {
    type: Boolean,
    default: false
  },
  datePaiement: {
    type: Date
  },
  billetsAssocies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BilletAvion'
  }]
}, {
  timestamps: true
});

// Génération automatique du numéro de facture
factureFournisseurSchema.pre('save', async function(next) {
  if (this.isNew && !this.numero) {
    const count = await this.constructor.countDocuments();
    this.numero = `FF-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Mise à jour du statut en fonction de la date d'échéance
factureFournisseurSchema.methods.updateStatut = function() {
  const today = new Date();
  if (this.statut === 'envoyée' && this.dateEcheance < today) {
    this.statut = 'en_retard';
  }
  return this.save();
};

module.exports = mongoose.model('FactureFournisseur', factureFournisseurSchema); 