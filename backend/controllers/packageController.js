const asyncHandler = require('express-async-handler');
const Package = require('../models/packageModel');
const Agence = require('../models/agenceModel');

// @desc    Get all packages
// @route   GET /api/packages
// @access  Private
const getPackages = asyncHandler(async (req, res) => {
  // Filtre par agence connectée
  const agenceId = req.user?.agenceId;
  if (!agenceId) {
    return res.status(400).json({ success: false, message: "ID d'agence manquant" });
  }
  const packages = await Package.find({ agenceId });
  res.status(200).json({
    success: true,
    data: packages
  });
});

// @desc    Get public packages (visible only)
// @route   GET /api/packages/public
// @access  Public
const getPublicPackages = asyncHandler(async (req, res) => {
  const packages = await Package.find({ visible: true });
  
  res.status(200).json({
    success: true,
    data: packages
  });
});

// @desc    Get public packages for a specific agency (by slug)
// @route   GET /api/packages/public?agence=slug
// @access  Public
const getPublicPackagesByAgence = asyncHandler(async (req, res) => {
  const { agence } = req.query;
  console.log('Recherche packages pour agence slug:', agence); // Debug
  
  if (!agence) return res.status(400).json({ success: false, message: 'Agence manquante' });
  
  // Vérifier toutes les agences pour voir leurs slugs
  const allAgences = await Agence.find({}, 'nom slug');
  console.log('Toutes les agences et leurs slugs:', allAgences.map(a => ({ nom: a.nom, slug: a.slug }))); // Debug
  
  const agenceObj = await Agence.findOne({ slug: new RegExp(`^${agence}$`, 'i') });
  console.log('Agence trouvée:', agenceObj ? agenceObj.nom : 'Non trouvée'); // Debug
  console.log('Agence ID:', agenceObj ? agenceObj._id : 'N/A'); // Debug
  
  if (!agenceObj) return res.status(404).json({ success: false, message: 'Agence non trouvée' });
  
  // Vérifier tous les packages de cette agence
  const allPackages = await Package.find({ agenceId: agenceObj._id });
  console.log('Tous les packages de l\'agence:', allPackages.map(p => ({ nom: p.nom, visible: p.visible, agenceId: p.agenceId }))); // Debug
  
  const packages = await Package.find({ agenceId: agenceObj._id, visible: true });
  console.log('Packages trouvés (visibles):', packages.length); // Debug
  console.log('Packages:', packages.map(p => ({ nom: p.nom, visible: p.visible, agenceId: p.agenceId }))); // Debug
  
  res.json({ success: true, data: packages });
});

// @desc    Get package by ID
// @route   GET /api/packages/:id
// @access  Private
const getPackageById = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  
  if (pkg) {
    res.status(200).json({
      success: true,
      data: pkg
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Package non trouvé'
    });
  }
});

// @desc    Create new package
// @route   POST /api/packages
// @access  Private
const createPackage = asyncHandler(async (req, res) => {
  const { 
    nom, description, prix, duree, pays, villesHotels, placesDisponibles, 
    dateDebut, dateFin, image, enAvant, inclusions, itineraire, visible = true 
  } = req.body;
  
  if (!nom || !description || !prix || !pays) {
    return res.status(400).json({
      success: false,
      message: 'Les champs nom, description, prix et pays sont requis.'
    });
  }
  
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const pkg = await Package.create({
    ...req.body,
    agenceId
  });
  
  res.status(201).json({
    success: true,
    message: 'Package créé avec succès',
    data: pkg
  });
});

// @desc    Update package
// @route   PUT /api/packages/:id
// @access  Private
const updatePackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  
  if (pkg) {
    // Check ownership or superadmin role
    if (pkg.agenceId.toString() !== req.user.agenceId.toString() && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Action non autorisée' });
    }

    const updatedPackage = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    res.status(200).json({
      success: true,
      message: 'Package mis à jour avec succès',
      data: updatedPackage
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Package non trouvé'
    });
  }
});

// @desc    Toggle package visibility
// @route   PUT /api/packages/:id/toggle-visibility
// @access  Private
const togglePackageVisibility = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  
  if (pkg) {
    pkg.visible = !pkg.visible;
    const updatedPackage = await pkg.save();
    
    res.status(200).json({
      success: true,
      message: `Package ${pkg.visible ? 'visible' : 'masqué'}`,
      data: updatedPackage
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Package non trouvé'
    });
  }
});

// @desc    Delete package
// @route   DELETE /api/packages/:id
// @access  Private
const deletePackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  
  if (pkg) {
    await Package.deleteOne({ _id: pkg._id });
    
    res.status(200).json({
      success: true,
      message: 'Package supprimé avec succès'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Package non trouvé'
    });
  }
});

module.exports = {
  getPackages,
  getPublicPackages,
  getPackageById,
  createPackage,
  updatePackage,
  togglePackageVisibility,
  deletePackage,
  getPublicPackagesByAgence
};