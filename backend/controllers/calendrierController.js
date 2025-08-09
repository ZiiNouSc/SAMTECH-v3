const asyncHandler = require('express-async-handler');
const Event = require('../models/eventModel');

// @desc    Get all events
// @route   GET /api/calendrier/events
// @access  Private
const getEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({}).populate('createur', 'nom prenom');
  res.json(events);
});

// @desc    Create new event
// @route   POST /api/calendrier/events
// @access  Private
const createEvent = asyncHandler(async (req, res) => {
  const { titre, description, dateDebut, dateFin, couleur } = req.body;

  const event = await Event.create({
    titre,
    description,
    dateDebut,
    dateFin,
    couleur,
    createur: req.user._id
  });

  if (event) {
    res.status(201).json(event);
  } else {
    res.status(400);
    throw new Error('Données invalides');
  }
});

// @desc    Update event
// @route   PUT /api/calendrier/events/:id
// @access  Private
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    event.titre = req.body.titre || event.titre;
    event.description = req.body.description || event.description;
    event.dateDebut = req.body.dateDebut || event.dateDebut;
    event.dateFin = req.body.dateFin || event.dateFin;
    event.couleur = req.body.couleur || event.couleur;

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } else {
    res.status(404);
    throw new Error('Événement non trouvé');
  }
});

// @desc    Delete event
// @route   DELETE /api/calendrier/events/:id
// @access  Private
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    await event.remove();
    res.json({ message: 'Événement supprimé' });
  } else {
    res.status(404);
    throw new Error('Événement non trouvé');
  }
});

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
};