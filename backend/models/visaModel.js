const mongoose = require('mongoose');

const visaSchema = new mongoose.Schema({
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
  paysDestination: {
    type: String,
    required: true
  },
  typeVisa: {
    type: String,
    enum: ['touristique', 'affaires', 'etudiant', 'travail', 'transit', 'autre'],
    required: true
  },
  dureeSejour: {
    type: Number,
    required: true
  },
  dateDepart: {
    type: Date,
    required: true
  },
  dateRetour: {
    type: Date,
    required: true
  },
  nombrePersonnes: {
    type: Number,
    required: true,
    default: 1
  },
  documentsFournis: [{
    type: String,
    enum: ['passeport', 'photo', 'justificatif_sejour', 'justificatif_financier', 'assurance', 'billet_avion', 'reservation_hotel', 'autre']
  }],
  statut: {
    type: String,
    enum: ['en_preparation', 'soumis', 'en_cours', 'approuve', 'refuse', 'annule'],
    default: 'en_preparation'
  },
  prix: {
    type: Number,
    required: true
  },
  devise: {
    type: String,
    default: 'DA'
  },
  fraisConsulaire: {
    type: Number,
    default: 0
  },
  fraisService: {
    type: Number,
    default: 0
  },
  dateSoumission: {
    type: Date
  },
  dateReponse: {
    type: Date
  },
  numeroDossier: {
    type: String
  },
  notes: {
    type: String,
    default: ''
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  factureClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facture',
    required: false
  }
}, {
  timestamps: true
});

// Créer un index composé pour que numeroDossier soit unique par agence
visaSchema.index({ agenceId: 1, numeroDossier: 1 }, { unique: true });

// Générer un numéro de dossier unique par agence
visaSchema.pre('save', async function(next) {
  if (!this.numeroDossier) {
    const count = await this.constructor.countDocuments({ agenceId: this.agenceId });
    this.numeroDossier = `VISA-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Visa', visaSchema); 