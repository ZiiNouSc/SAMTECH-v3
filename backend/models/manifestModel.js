const mongoose = require('mongoose');

const manifestSchema = new mongoose.Schema({
  agenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agence',
    required: true
  },
  numeroManifest: {
    type: String,
    required: true
  },
  compagnieTransport: {
    type: String,
    required: true
  },
  typeTransport: {
    type: String,
    enum: ['avion', 'bus', 'train', 'bateau', 'autre'],
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  dateDepart: {
    type: Date,
    required: true
  },
  dateRetour: {
    type: Date
  },
  nombrePassagers: {
    type: Number,
    required: true,
    default: 0
  },
  passagers: [{
    nom: {
      type: String,
      required: true
    },
    prenom: {
      type: String,
      required: true
    },
    dateNaissance: {
      type: Date,
      required: true
    },
    numeroPasseport: {
      type: String
    },
    numeroCarteIdentite: {
      type: String
    },
    telephone: {
      type: String
    },
    email: {
      type: String
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    }
  }],
  compagnieLogo: {
    type: String,
    default: ''
  },
  compagnieIataId: {
    type: String,
    default: ''
  },
  observations: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Créer un index composé pour que numeroManifest soit unique par agence
manifestSchema.index({ agenceId: 1, numeroManifest: 1 }, { unique: true });

// Générer un numéro de manifest unique par agence
manifestSchema.pre('save', async function(next) {
  if (!this.numeroManifest) {
    const count = await this.constructor.countDocuments({ agenceId: this.agenceId });
    this.numeroManifest = `MAN-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Manifest', manifestSchema); 