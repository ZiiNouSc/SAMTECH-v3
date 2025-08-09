const mongoose = require('mongoose');

const villeHotelSchema = new mongoose.Schema({
  ville: { type: String, required: true },
  hotel: { type: String }
});

const itineraireSchema = new mongoose.Schema({
  jour: { type: Number, required: true },
  description: { type: String, required: true }
});

const packageSchema = mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    prix: {
      type: Number,
      required: true,
    },
    duree: {
      type: String,
    },
    pays: {
      type: String,
      required: true,
    },
    villesHotels: [villeHotelSchema],
    placesDisponibles: {
      type: Number,
    },
    dateDebut: {
      type: Date,
    },
    dateFin: {
      type: Date,
    },
    image: {
      type: String,
    },
    enAvant: {
      type: Boolean,
      default: false,
    },
    inclusions: {
      type: [String],
      default: [],
    },
    itineraire: [itineraireSchema],
    visible: {
      type: Boolean,
      default: true,
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

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;