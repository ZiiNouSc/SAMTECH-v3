const mongoose = require('mongoose');

const moduleRequestSchema = mongoose.Schema(
  {
    agenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
      required: true,
    },
    modules: {
      type: [String],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    statut: {
      type: String,
      enum: ['en_attente', 'approuve', 'rejete'],
      default: 'en_attente',
    },
    dateCreation: {
      type: Date,
      default: Date.now,
    },
    dateTraitement: {
      type: Date,
    },
    commentaireAdmin: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const ModuleRequest = mongoose.model('ModuleRequest', moduleRequestSchema);

module.exports = ModuleRequest;