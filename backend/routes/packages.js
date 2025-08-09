const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getPackages, getPackageById, createPackage, updatePackage, deletePackage, togglePackageVisibility, getPublicPackagesByAgence } = require('../controllers/packageController');

// Get all packages
router.get('/', protect, getPackages);

// Route publique pour les packages d'une agence (DOIT être avant /:id)
router.get('/public', getPublicPackagesByAgence);

// Get package by ID
router.get('/:id', protect, getPackageById);

// Create new package
router.post('/', protect, createPackage);

// Update package
router.put('/:id', protect, updatePackage);

// Route pour la visibilité
router.put('/:id/toggle-visibility', protect, togglePackageVisibility);

// Delete package
router.delete('/:id', protect, deletePackage);

module.exports = router;