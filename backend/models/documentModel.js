const mongoose = require('mongoose');

const documentSchema = mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['pdf', 'doc', 'excel', 'image', 'autre'],
      required: true,
    },
    taille: {
      type: Number,
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    clientNom: {
      type: String,
    },
    categorie: {
      type: String,
      enum: ['contrat', 'facture', 'devis', 'photo', 'passeport', 'autre'],
      required: true,
    },
    dateCreation: {
      type: Date,
      default: Date.now,
    },
    dateModification: {
      type: Date,
      default: Date.now,
    },
    url: {
      type: String,
      required: true,
    },
    description: {
      type: String,
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

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;