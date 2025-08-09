const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// @desc    Get permissions
// @route   GET /api/permissions
// @access  Private
const getPermissions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('permissions');
  
  res.status(200).json({
    success: true,
    data: user.permissions || []
  });
});

// @desc    Update permission
// @route   PUT /api/permissions/users/:userId
// @access  Private/Admin
const updatePermission = asyncHandler(async (req, res) => {
  const { permissions } = req.body;
  
  const user = await User.findById(req.params.userId);
  if (!user) {
    res.status(404);
    throw new Error('Utilisateur non trouvé');
  }
  
  // Mettre à jour toutes les permissions
  user.permissions = permissions || [];
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Permissions mises à jour avec succès',
    data: {
      id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    }
  });
});

// @desc    Get user permissions
// @route   GET /api/permissions/users/:userId
// @access  Private
const getUserPermissions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('permissions');
  
  if (!user) {
    res.status(404);
    throw new Error('Utilisateur non trouvé');
  }
  
  res.status(200).json({
    success: true,
    data: user.permissions || []
  });
});

// @desc    Get all users permissions
// @route   GET /api/permissions/users
// @access  Private/Admin
const getAllUsersPermissions = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('nom prenom email permissions role');
  
  const usersWithPermissions = users.map(user => ({
    id: user._id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    permissions: user.permissions || []
  }));
  
  res.status(200).json({
    success: true,
    data: usersWithPermissions
  });
});

module.exports = {
  getPermissions,
  updatePermission,
  getUserPermissions,
  getAllUsersPermissions
}; 