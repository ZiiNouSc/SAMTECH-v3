const mongoose = require('mongoose');

const todoSchema = mongoose.Schema(
  {
    titre: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    clientNom: {
      type: String,
    },
    dateEcheance: {
      type: Date,
      required: true,
    },
    priorite: {
      type: String,
      enum: ['faible', 'normale', 'haute', 'urgente'],
      default: 'normale',
    },
    statut: {
      type: String,
      enum: ['en_attente', 'en_cours', 'termine'],
      default: 'en_attente',
    },
    type: {
      type: String,
      enum: ['rappel', 'tache', 'suivi'],
      default: 'tache',
    },
    dateCreation: {
      type: Date,
      default: Date.now,
    },
    assigneA: {
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

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;