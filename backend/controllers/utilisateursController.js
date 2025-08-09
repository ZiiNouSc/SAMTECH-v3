const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/userModel');
const Agence = require('../models/agenceModel');

// @desc    Get all users
// @route   GET /api/utilisateurs
// @access  Private/Agency
const getUtilisateurs = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { page = 1, limit = 20, statut, role, search } = req.query;
  
  // Build filter
  const filter = { agenceId };
  
  if (statut) filter.statut = statut;
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { nom: { $regex: search, $options: 'i' } },
      { prenom: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const utilisateurs = await Utilisateur.find(filter)
    .select('-password')
    .sort({ dateCreation: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await Utilisateur.countDocuments(filter);
  
  res.status(200).json({
    success: true,
    data: utilisateurs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  });
});

// @desc    Get user by ID
// @route   GET /api/utilisateurs/:id
// @access  Private/Agency
const getUtilisateurById = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const utilisateur = await Utilisateur.findOne({
    _id: req.params.id,
    agenceId
  }).select('-password');
  
  if (utilisateur) {
    res.status(200).json({
      success: true,
      data: utilisateur
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }
});

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
const createUtilisateur = asyncHandler(async (req, res) => {
  const {
    nom,
    prenom,
    email,
    password,
    telephone,
    role,
    agenceId,
    statut
  } = req.body;

  // Validation des champs requis
  if (!nom || !prenom || !email || !password) {
    res.status(400);
    throw new Error('Nom, prénom, email et mot de passe sont requis');
  }

  // Vérifier si l'utilisateur existe déjà
  const userExists = await Utilisateur.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
  if (userExists) {
    res.status(400);
    throw new Error('Un utilisateur avec cet email existe déjà');
  }

  // Créer l'utilisateur (le hashage sera fait automatiquement par le middleware pre-save)
  const user = await Utilisateur.create({
    nom,
    prenom,
    email,
    password, // Le modèle va automatiquement hasher ce mot de passe
    telephone,
    role: role || 'agence',
    agenceId,
    statut: statut || 'actif'
  });

  if (user) {
    const userResponse = {
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      agenceId: user.agenceId,
      statut: user.statut,
      dateInscription: user.dateInscription
    };

    res.status(201).json({
      success: true,
      data: userResponse
    });
  } else {
    res.status(400);
    throw new Error('Données utilisateur invalides');
  }
});

// @desc    Update user
// @route   PUT /api/utilisateurs/:id
// @access  Private/Agency
const updateUtilisateur = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { 
    nom, 
    prenom, 
    email, 
    password, 
    role,
    telephone,
    poste,
    permissions,
    statut
  } = req.body;
  
  // Trouver l'utilisateur d'abord
  const utilisateur = await Utilisateur.findOne({
    _id: req.params.id,
    agenceId
  });
  
  if (!utilisateur) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }
  
  // Mettre à jour les champs
  if (nom !== undefined) utilisateur.nom = nom;
  if (prenom !== undefined) utilisateur.prenom = prenom;
  if (email !== undefined) utilisateur.email = email;
  if (role !== undefined) utilisateur.role = role;
  if (telephone !== undefined) utilisateur.telephone = telephone;
  if (poste !== undefined) utilisateur.poste = poste;
  if (permissions !== undefined) utilisateur.permissions = permissions;
  if (statut !== undefined) utilisateur.statut = statut;
  
  // Mettre à jour le mot de passe si fourni (le modèle va automatiquement hasher)
  if (password) {
    utilisateur.password = password;
  }
  
  utilisateur.dateModification = new Date();
  
  // Sauvegarder (le middleware pre-save sera déclenché)
  await utilisateur.save();
  
  // Retourner l'utilisateur sans le mot de passe
  const userResponse = utilisateur.toObject();
  delete userResponse.password;
  
  res.status(200).json({
    success: true,
    message: 'Utilisateur mis à jour avec succès',
    data: userResponse
  });
});

// @desc    Delete user
// @route   DELETE /api/utilisateurs/:id
// @access  Private/Agency
const deleteUtilisateur = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  // Prevent deleting own account
  if (req.params.id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Vous ne pouvez pas supprimer votre propre compte'
    });
  }
  
  const utilisateur = await Utilisateur.findOneAndDelete({
    _id: req.params.id,
    agenceId
  });
  
  if (utilisateur) {
    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }
});

// @desc    Change user password
// @route   PUT /api/utilisateurs/:id/password
// @access  Private/Agency
const changePassword = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { password, nouveauPassword } = req.body;
  
  if (!password || !nouveauPassword) {
    return res.status(400).json({
      success: false,
      message: 'Ancien et nouveau mot de passe sont requis'
    });
  }
  
  const utilisateur = await Utilisateur.findOne({
    _id: req.params.id,
    agenceId
  });
  
  if (!utilisateur) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }
  
  // Verify current password using the model's matchPassword method
  const isMatch = await utilisateur.matchPassword(password);
  
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Mot de passe actuel incorrect'
    });
  }
  
  // Update password (le modèle va automatiquement hasher via le middleware pre-save)
  utilisateur.password = nouveauPassword;
  await utilisateur.save();
  
  res.status(200).json({
    success: true,
    message: 'Mot de passe modifié avec succès'
  });
});

// @desc    Get user profile
// @route   GET /api/utilisateurs/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const utilisateur = await Utilisateur.findById(req.user.id)
    .select('-password')
    .populate('agenceId', 'nom adresse telephone');
  
  if (utilisateur) {
    res.status(200).json({
      success: true,
      data: utilisateur
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/utilisateurs/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { nom, prenom, telephone, poste } = req.body;
  
  const updateData = {};
  if (nom !== undefined) updateData.nom = nom;
  if (prenom !== undefined) updateData.prenom = prenom;
  if (telephone !== undefined) updateData.telephone = telephone;
  if (poste !== undefined) updateData.poste = poste;
  
  updateData.dateModification = new Date();
  
  const utilisateur = await Utilisateur.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true }
  ).select('-password');
  
  if (utilisateur) {
    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: utilisateur
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/utilisateurs/stats
// @access  Private/Agency
const getUtilisateurStats = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  // Users by role
  const byRole = await Utilisateur.aggregate([
    { $match: { agenceId } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Users by status
  const byStatus = await Utilisateur.aggregate([
    { $match: { agenceId } },
    { $group: { _id: '$statut', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Users by creation date (last 12 months)
  const byMonth = await Utilisateur.aggregate([
    { $match: { agenceId } },
    {
      $group: {
        _id: {
          year: { $year: '$dateCreation' },
          month: { $month: '$dateCreation' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  const totalUsers = byRole.reduce((sum, item) => sum + item.count, 0);
  const activeUsers = byStatus.find(item => item._id === 'actif')?.count || 0;
  
  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      byRole,
      byStatus,
      byMonth
    }
  });
});

// @desc    Get all users (for superadmin)
// @route   GET /api/users
// @access  Private/Superadmin
const getAllUsers = asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est superadmin
  if (process.env.NODE_ENV !== 'development' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }
  
  const users = await Utilisateur.find({})
    .select('-password')
    .sort({ dateCreation: -1 });
  
  res.status(200).json({
    success: true,
    data: users
  });
});

// @desc    Assign user to agency
// @route   PUT /api/users/:userId/assign-agency
// @access  Private/Superadmin
const assignToAgency = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { agenceId } = req.body;

  // Vérifier que l'utilisateur est superadmin
  if (process.env.NODE_ENV !== 'development' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  // Validation des données
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID de l\'agence requis'
    });
  }

  // Vérifier si l'agence existe
  const agence = await Agence.findById(agenceId);
  if (!agence) {
    return res.status(404).json({
      success: false,
      message: 'Agence non trouvée'
    });
  }

  // Mettre à jour l'utilisateur
  const user = await Utilisateur.findByIdAndUpdate(
    userId,
    { agenceId: agenceId },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Remove user from agency
// @route   PUT /api/users/:userId/remove-agency
// @access  Private/Superadmin
const removeFromAgency = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Vérifier que l'utilisateur est superadmin
  if (process.env.NODE_ENV !== 'development' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  // Mettre à jour l'utilisateur pour retirer l'agence
  const user = await Utilisateur.findByIdAndUpdate(
    userId,
    { $unset: { agenceId: 1 } },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

module.exports = {
  getUtilisateurs,
  getUtilisateurById,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
  changePassword,
  getProfile,
  updateProfile,
  getUtilisateurStats,
  getAllUsers,
  assignToAgency,
  removeFromAgency
}; 