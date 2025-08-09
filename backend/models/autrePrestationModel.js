const mongoose = require('mongoose');

const autrePrestationSchema = mongoose.Schema({
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
  numeroReference: {
    type: String,
    required: false
  },
  designation: {
    type: String,
    required: true
  },
  ville: {
    type: String
  },
  dateDebut: {
    type: Date
  },
  dateFin: {
    type: Date
  },
  duree: {
    type: String
  },
  prix: {
    type: Number,
    required: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'confirmee', 'realisee', 'annulee'],
    default: 'en_attente'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AutrePrestation', autrePrestationSchema); 