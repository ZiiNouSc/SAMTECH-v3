const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const { getPermissions, updatePermission, getUserPermissions, getAllUsersPermissions } = require('../controllers/permissionsController');
const { ALL_MODULES_CONFIG } = require('../config/modules');

// Get all modules
router.get('/modules', protect, (req, res) => {
  try {
    // Utiliser la configuration centralisée
    const modules = ALL_MODULES_CONFIG.map(module => ({
      id: module.id,
      nom: module.nom,
      description: module.description,
      permissions: module.permissions
    }));
    
    res.status(200).json({
      success: true,
      data: modules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des modules',
      error: error.message
    });
  }
});

// Routes pour les permissions
router.get('/', protect, getPermissions);
router.get('/users', protect, admin, getAllUsersPermissions);
router.get('/users/:userId', protect, getUserPermissions);
router.put('/users/:userId', protect, admin, updatePermission);

module.exports = router;