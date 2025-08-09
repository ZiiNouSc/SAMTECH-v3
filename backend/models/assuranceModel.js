const mongoose = require('mongoose');

const assuranceSchema = mongoose.Schema({
  agenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agence',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  numeroPolice: {
    type: String,
    required: true
  },
  typeAssurance: {
    type: String,
    required: true
  },
  dateDebut: {
    type: Date,
    required: true
  },
  dateFin: {
    type: Date,
    required: true
  },
  prix: {
    type: Number,
    required: true
  },
  statut: {
    type: String,
    enum: ['inactive', 'active', 'validee', 'expiree', 'annulee'],
    default: 'inactive'
  },
  factureClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facture',
    required: false
  }
}, {
  timestamps: true
});

assuranceSchema.index({ agenceId: 1, numeroPolice: 1 }, { unique: true });

module.exports = mongoose.model('Assurance', assuranceSchema); 