const asyncHandler = require('express-async-handler');
const Parametre = require('../models/parametreModel');

// @desc    Get all parametres
// @route   GET /api/parametres
// @access  Private/Admin
const getParametres = asyncHandler(async (req, res) => {
  const parametres = await Parametre.find({});
  res.json(parametres);
});

// @desc    Get parametre categories
// @route   GET /api/parametres/categories
// @access  Private/Admin
const getParametreCategories = asyncHandler(async (req, res) => {
  const categories = await Parametre.distinct('categorie');
  res.json(categories);
});

// @desc    Update parametre
// @route   PUT /api/parametres/:id
// @access  Private/Admin
const updateParametre = asyncHandler(async (req, res) => {
  const parametre = await Parametre.findById(req.params.id);

  if (parametre) {
    parametre.valeur = req.body.valeur || parametre.valeur;
    parametre.description = req.body.description || parametre.description;

    const updatedParametre = await parametre.save();
    res.json(updatedParametre);
  } else {
    res.status(404);
    throw new Error('Paramètre non trouvé');
  }
});

// @desc    Reset parametres
// @route   POST /api/parametres/reset
// @access  Private/Admin
const resetParametres = asyncHandler(async (req, res) => {
  // Logique pour réinitialiser les paramètres aux valeurs par défaut
  res.json({ message: 'Paramètres réinitialisés' });
});

module.exports = {
  getParametres,
  getParametreCategories,
  updateParametre,
  resetParametres
}; 