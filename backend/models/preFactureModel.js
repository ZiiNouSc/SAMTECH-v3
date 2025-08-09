const mongoose = require('mongoose');

// Schema pour les prestations
const prestationSchema = {
  type: {
    type: String,
    enum: ['billet', 'hotel', 'visa', 'assurance', 'autre'],
    required: true
  },
  designation: String,
  designationAuto: {
    type: Boolean,
    default: true
  },
  // Champs pour billet d'avion
  pax: String,
  numeroBillet: String,
  dateDepart: Date,
  dateRetour: Date,
  villeDepart: String,
  villeArrivee: String,
  compagnie: String,
  
  // Champs pour hôtel
  nomClient: String,
  nomHotel: String,
  ville: String,
  dateEntree: Date,
  dateSortie: Date,
  numeroVoucher: String,
  
  // Champs pour visa
  typeVisa: String,
  paysVise: String,
  dateDepot: Date,
  
  // Champs pour assurance
  nomAssure: String,
  typeAssurance: String,
  dateDebut: Date,
  dateFin: Date,
  numeroPolice: String,
  
  // Champs pour autre prestation
  designationLibre: String,
  duree: String
};

const preFactureSchema = mongoose.Schema(
  {
    numero: {
      type: String,
      required: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    agenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
      required: true
    },
    dateCreation: {
      type: Date,
      default: Date.now
    },
    articles: [{
      designation: {
        type: String,
        required: true
      },
      quantite: {
        type: Number,
        required: true,
        min: 1
      },
      prixUnitaire: {
        type: Number,
        required: true,
        min: 0
      },
      montant: {
        type: Number,
        required: true,
        min: 0
      },
      prestation: prestationSchema // Inclure les données de prestation
    }],
    montantHT: {
      type: Number,
      required: true,
      default: 0
    },
    montantTTC: {
      type: Number,
      required: true,
      default: 0
    },
    tva: {
      type: Number,
      default: 0
    },
    statut: {
      type: String,
      enum: ['brouillon', 'envoye', 'accepte', 'refuse', 'facture'],
      default: 'brouillon'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Créer un index composé pour que numero soit unique par agence
preFactureSchema.index({ numero: 1, agenceId: 1 }, { unique: true });

const PreFacture = mongoose.model('PreFacture', preFactureSchema);

module.exports = PreFacture;