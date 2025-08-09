const mongoose = require('mongoose');

const clientSchema = mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
    },
    prenom: {
      type: String,
      default: '',
    },
    entreprise: {
      type: String,
      default: '',
    },
    typeClient: {
      type: String,
      enum: ['particulier', 'entreprise', 'partenaire'],
      default: 'particulier',
    },
    email: {
      type: String,
      required: false,
    },
    telephone: {
      type: String,
      required: true,
    },
    adresse: {
      type: String,
      required: false,
    },
    codePostal: {
      type: String,
      default: '',
    },
    ville: {
      type: String,
      default: '',
    },
    pays: {
      type: String,
      default: 'Algérie',
    },
    solde: {
      type: Number,
      default: 0,
    },
    soldeInitial: {
      type: Number,
      default: 0,
    },
    dateCreation: {
      type: Date,
      default: Date.now,
    },
    statut: {
      type: String,
      enum: ['actif', 'inactif', 'suspendu'],
      default: 'actif',
    },
    notes: {
      type: String,
      default: '',
    },
    agenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;