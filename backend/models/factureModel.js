const mongoose = require('mongoose');

const articleSchema = mongoose.Schema({
  designation: {
    type: String,
    required: true,
  },
  quantite: {
    type: Number,
    required: true,
  },
  prixUnitaire: {
    type: Number,
    required: true,
  },
  montant: {
    type: Number,
    required: true,
  },
});

const versementSchema = mongoose.Schema({
  montant: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  moyenPaiement: { type: String, enum: ['especes', 'virement', 'cheque'], required: true },
  utiliseSoldeCrediteur: { type: Boolean, default: false }
});

const factureSchema = mongoose.Schema(
  {
    numero: {
      type: String,
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: false,
    },
    dateEmission: {
      type: Date,
      required: true,
    },
    dateEcheance: {
      type: Date,
      required: true,
    },
    statut: {
      type: String,
      enum: ['brouillon', 'envoyee', 'partiellement_payee', 'payee', 'en_retard', 'annulee'],
      default: 'brouillon',
    },
    montantHT: {
      type: Number,
      required: true,
    },
    montantTTC: {
      type: Number,
      required: true,
    },
    montantPaye: {
      type: Number,
      default: 0,
    },
    modePaiement: {
      type: String,
      enum: ['moyen_paiement', 'solde_crediteur', 'mixte'],
      default: 'moyen_paiement'
    },
    montantPayeParSolde: {
      type: Number,
      default: 0,
    },
    montantPayeParMoyen: {
      type: Number,
      default: 0,
    },
    versements: [versementSchema],
    articles: [articleSchema],
    lastReminder: {
      type: Date,
    },
    agenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
      required: true,
    },
    fournisseurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fournisseur',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Créer un index composé unique sur numero et agenceId
factureSchema.index({ numero: 1, agenceId: 1 }, { unique: true });

const Facture = mongoose.model('Facture', factureSchema);

module.exports = Facture;


