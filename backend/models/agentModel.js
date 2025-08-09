const mongoose = require('mongoose');

const agentSchema = mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
    },
    prenom: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    telephone: {
      type: String,
    },
    permissions: [
      {
        module: {
          type: String,
          required: true,
        },
        actions: [String],
      },
    ],
    statut: {
      type: String,
      enum: ['actif', 'suspendu'],
      default: 'actif',
    },
    dateCreation: {
      type: Date,
      default: Date.now,
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

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;