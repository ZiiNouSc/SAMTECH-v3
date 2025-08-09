const mongoose = require('mongoose');

const reponseSchema = mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: String,
  userRole: String
});

const ticketSchema = mongoose.Schema(
  {
    agenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
      required: true,
    },
    sujet: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    statut: {
      type: String,
      enum: ['ouvert', 'en_cours', 'ferme'],
      default: 'ouvert',
    },
    priorite: {
      type: String,
      enum: ['faible', 'normale', 'haute', 'urgente'],
      default: 'normale',
    },
    dateCreation: {
      type: Date,
      default: Date.now,
    },
    dateMAJ: {
      type: Date,
      default: Date.now,
    },
    reponses: [reponseSchema],
  },
  {
    timestamps: true,
  }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;