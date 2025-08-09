const mongoose = require('mongoose');

const billetSchema = mongoose.Schema(
  {
    numeroVol: {
      type: String,
      required: false,
    },
    compagnie: {
      type: String,
      required: false,
    },
    code_compagnie: {
      type: String,
      required: false,
    },
    logo_compagnie: {
      type: String,
      required: false,
    },
    dateDepart: {
      type: Date,
      required: false,
    },
    dateArrivee: {
      type: Date,
      required: false,
    },
    origine: {
      type: String,
      required: false,
    },
    destination: {
      type: String,
      required: false,
    },
    passager: {
      type: String,
      required: false,
    },
    prix: {
      type: Number,
      required: false,
    },
    statut: {
      type: String,
      enum: ['confirme', 'annule', 'en_attente', 'confirmé', 'annulé', 'issued', 'cancelled', 'pending', 'expired', 'refunded', 'reissued'],
      default: 'confirmé',
    },
    agenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
      required: false,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    informations: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    sourceFile: {
      type: String,
      required: false,
    },
    fournisseurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fournisseur',
      required: false,
    },
    factureFournisseurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FactureFournisseur',
      required: false,
    },
    factureClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facture',
      required: false,
    },
    // Nouveau champ pour éviter les doublons lors de l'import par email
    emailId: {
      type: String,
      required: false,
      index: true, // Index pour améliorer les performances de recherche
    },
  },
  {
    timestamps: false,
  }
);

// Index composé pour éviter les doublons par agence
billetSchema.index({ agenceId: 1, emailId: 1 }, { unique: true, sparse: true });

const BilletAvion = mongoose.model('BilletAvion', billetSchema);

module.exports = BilletAvion;