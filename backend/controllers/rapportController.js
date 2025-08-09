const asyncHandler = require('express-async-handler');
const Rapport = require('../models/rapportModel');

// @desc    Get all rapports
// @route   GET /api/rapports
// @access  Private/Admin
const getRapports = asyncHandler(async (req, res) => {
  const rapports = await Rapport.find({}).populate('createur', 'nom prenom');
  res.json(rapports);
});

// @desc    Get rapport by ID
// @route   GET /api/rapports/:id
// @access  Private/Admin
const getRapportById = asyncHandler(async (req, res) => {
  const rapport = await Rapport.findById(req.params.id).populate('createur', 'nom prenom');
  if (rapport) {
    res.json(rapport);
  } else {
    res.status(404);
    throw new Error('Rapport non trouvé');
  }
});

// @desc    Create new rapport
// @route   POST /api/rapports
// @access  Private/Admin
const createRapport = asyncHandler(async (req, res) => {
  const { titre, contenu, type, periode } = req.body;

  const rapport = await Rapport.create({
    titre,
    contenu,
    type,
    periode,
    createur: req.user._id
  });

  if (rapport) {
    res.status(201).json(rapport);
  } else {
    res.status(400);
    throw new Error('Données invalides');
  }
});

// @desc    Update rapport
// @route   PUT /api/rapports/:id
// @access  Private/Admin
const updateRapport = asyncHandler(async (req, res) => {
  const rapport = await Rapport.findById(req.params.id);

  if (rapport) {
    rapport.titre = req.body.titre || rapport.titre;
    rapport.contenu = req.body.contenu || rapport.contenu;
    rapport.type = req.body.type || rapport.type;
    rapport.periode = req.body.periode || rapport.periode;

    const updatedRapport = await rapport.save();
    res.json(updatedRapport);
  } else {
    res.status(404);
    throw new Error('Rapport non trouvé');
  }
});

// @desc    Delete rapport
// @route   DELETE /api/rapports/:id
// @access  Private/Admin
const deleteRapport = asyncHandler(async (req, res) => {
  const rapport = await Rapport.findById(req.params.id);

  if (rapport) {
    await rapport.remove();
    res.json({ message: 'Rapport supprimé' });
  } else {
    res.status(404);
    throw new Error('Rapport non trouvé');
  }
});

// @desc    Get reservations report
// @route   GET /api/rapports/reservations
// @access  Private/Admin
const getReservationsReport = asyncHandler(async (req, res) => {
  // Logique pour générer le rapport des réservations
  res.json({ message: 'Rapport des réservations' });
});

// @desc    Get activity report
// @route   GET /api/rapports/activity
// @access  Private/Admin
const getActivityReport = asyncHandler(async (req, res) => {
  // Logique pour générer le rapport d'activité
  res.json({ message: 'Rapport d\'activité' });
});

module.exports = {
  getRapports,
  getRapportById,
  createRapport,
  updateRapport,
  deleteRapport,
  getReservationsReport,
  getActivityReport
}; 