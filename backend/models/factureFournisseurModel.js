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
  moyenPaiement: { type: String, enum: ['especes', 'virement', 'cheque', 'carte', 'solde_crediteur'], required: true },
  utiliseSoldeCrediteur: { type: Boolean, default: false },
  reference: { type: String, default: '' },
  notes: { type: String, default: '' }
});

const historiquePaiementSchema = mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  typePaiement: { type: String, enum: ['solde', 'caisse', 'mixte'], required: true },
  montantTotalPaye: { type: Number, required: true },
  montantSolde: { type: Number, default: 0 },
  montantCaisse: { type: Number, default: 0 },
  modePaiementCaisse: { type: String, enum: ['especes', 'virement', 'cheque', 'carte'], default: 'especes' },
  detteRestante: { type: Number, default: 0 },
  reference: { type: String, default: '' },
  notes: { type: String, default: '' },
  operationCaisseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation' }
});

const factureFournisseurSchema = mongoose.Schema(
  {
    numero: {
      type: String,
      required: true,
    },
    fournisseurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fournisseur',
      required: true,
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
      enum: ['brouillon', 'en_attente', 'recue', 'partiellement_payee', 'payee', 'en_retard', 'annulee'],
      default: 'en_attente',
    },
    montantHT: {
      type: Number,
      required: true,
    },
    montantTVA: {
      type: Number,
      default: 0,
    },
    tva: {
      type: Number,
      default: 0,
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
      enum: ['caisse', 'solde', 'mixte'],
      default: 'caisse'
    },
    montantPayeParSolde: {
      type: Number,
      default: 0,
    },
    montantPayeParCaisse: {
      type: Number,
      default: 0,
    },
    versements: [versementSchema],
    historiquePaiements: [historiquePaiementSchema],
    articles: [articleSchema],
    billetsAssocies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BilletAvion'
    }],
    lastReminder: {
      type: Date,
    },
    agenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
      required: true,
    },
    notes: {
      type: String,
    },
    documents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }]
  },
  {
    timestamps: true,
  }
);

// Créer un index composé unique sur numero et agenceId
factureFournisseurSchema.index({ numero: 1, agenceId: 1 }, { unique: true });

// Méthode pour calculer le montant restant à payer
factureFournisseurSchema.methods.calculerMontantRestant = function() {
  return this.montantTTC - (this.montantPaye || 0);
};

// Méthode pour vérifier si la facture est complètement payée
factureFournisseurSchema.methods.estCompletementPayee = function() {
  return this.montantPaye >= this.montantTTC;
};

// Middleware pre-save pour mettre à jour le statut automatiquement
factureFournisseurSchema.pre('save', function(next) {
  const montantRestant = this.calculerMontantRestant();
  
  if (montantRestant <= 0) {
    this.statut = 'payee';
  } else if (this.montantPaye > 0) {
    this.statut = 'partiellement_payee';
  } else if (this.dateEcheance < new Date() && this.statut !== 'payee' && this.statut !== 'partiellement_payee') {
    this.statut = 'en_retard';
  }
  
  next();
});

const FactureFournisseur = mongoose.model('FactureFournisseur', factureFournisseurSchema);

module.exports = FactureFournisseur; 