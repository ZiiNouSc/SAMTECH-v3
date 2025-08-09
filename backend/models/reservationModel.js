const mongoose = require('mongoose');

const reservationSchema = mongoose.Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    agenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agence',
      required: true,
    },
    // Informations du client
    nom: {
      type: String,
      required: true,
    },
    prenom: {
      type: String,
      required: true,
    },
    telephone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    nombrePlaces: {
      type: Number,
      required: true,
      min: 1,
    },
    commentaire: {
      type: String,
      required: false,
    },
    // Statut de la réservation
    statut: {
      type: String,
      enum: ['en_attente', 'confirmee', 'annulee', 'terminee'],
      default: 'en_attente',
    },
    // Informations supplémentaires
    dateReservation: {
      type: Date,
      default: Date.now,
    },
    dateConfirmation: {
      type: Date,
      default: null,
    },
    montantTotal: {
      type: Number,
      required: true,
    },
    // Notes internes
    notesInterne: {
      type: String,
      required: false,
    },
    // Source de la réservation
    source: {
      type: String,
      enum: ['vitrine_public', 'admin', 'autre'],
      default: 'vitrine_public',
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
reservationSchema.index({ agenceId: 1, statut: 1 });
reservationSchema.index({ packageId: 1 });
reservationSchema.index({ dateReservation: -1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;