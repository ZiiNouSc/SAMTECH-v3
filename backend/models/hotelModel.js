const mongoose = require('mongoose');

const hotelSchema = mongoose.Schema({
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
  numeroVoucher: {
    type: String,
    required: true
  },
  nomHotel: {
    type: String,
    required: true
  },
  ville: {
    type: String,
    required: true
  },
  dateEntree: {
    type: Date,
    required: true
  },
  dateSortie: {
    type: Date,
    required: true
  },
  prix: {
    type: Number,
    required: true
  },
  statut: {
    type: String,
    enum: ['reserve', 'confirme', 'annule'],
    default: 'reserve'
  },
  factureClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facture',
    required: false
  }
}, {
  timestamps: true
});

hotelSchema.index({ agenceId: 1, numeroVoucher: 1 }, { unique: true });

module.exports = mongoose.model('Hotel', hotelSchema); 