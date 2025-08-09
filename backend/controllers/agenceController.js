const asyncHandler = require('express-async-handler');
const Agence = require('../models/agenceModel');
const User = require('../models/userModel');

// @desc    Get all agences
// @route   GET /api/agences
// @access  Private/Admin
const getAgences = asyncHandler(async (req, res) => {
  // Migrer les agences existantes qui ont un slug null
  try {
    await Agence.migrateSlugs();
  } catch (error) {
    console.error('Erreur lors de la migration des slugs:', error);
  }
  
  const agences = await Agence.find({});
  res.json(agences);
});

// @desc    Get agence by ID
// @route   GET /api/agences/:id
// @access  Private/Admin
const getAgenceById = asyncHandler(async (req, res) => {
  const agence = await Agence.findById(req.params.id);
  if (agence) {
    res.json(agence);
  } else {
    res.status(404);
    throw new Error('Agence non trouvée');
  }
});

// @desc    Create new agence
// @route   POST /api/agences
// @access  Private/Admin
const createAgence = asyncHandler(async (req, res) => {
  const { nom, adresse, telephone, email, modulesActifs = [] } = req.body;

  const agenceExists = await Agence.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
  if (agenceExists) {
    res.status(400);
    throw new Error('Une agence avec cet email existe déjà');
  }

  const agence = await Agence.create({
    nom,
    adresse,
    telephone,
    email,
    modulesActifs,
    statut: 'en_attente'
  });

  if (agence) {
    res.status(201).json({
      success: true,
      data: agence
    });
  } else {
    res.status(400);
    throw new Error('Données invalides');
  }
});

// @desc    Approve agence
// @route   PUT /api/agences/:id/approve
// @access  Private/Admin
const approveAgence = asyncHandler(async (req, res) => {
  const agence = await Agence.findById(req.params.id);

  if (agence) {
    agence.statut = 'approuve';
    agence.dateApprobation = new Date();
    const updatedAgence = await agence.save();

    // Approuver automatiquement l'utilisateur associé à cette agence
    const user = await User.findOne({ agenceId: agence._id });
    if (user) {
      user.statut = 'actif';
      await user.save();
    }

    res.json(updatedAgence);
  } else {
    res.status(404);
    throw new Error('Agence non trouvée');
  }
});

// @desc    Reject agence
// @route   PUT /api/agences/:id/reject
// @access  Private/Admin
const rejectAgence = asyncHandler(async (req, res) => {
  const agence = await Agence.findById(req.params.id);

  if (agence) {
    agence.statut = 'rejete';
    agence.dateRejet = new Date();
    const updatedAgence = await agence.save();

    // Suspendre l'utilisateur associé à cette agence
    const user = await User.findOne({ agenceId: agence._id });
    if (user) {
      user.statut = 'suspendu';
      await user.save();
    }

    res.json(updatedAgence);
  } else {
    res.status(404);
    throw new Error('Agence non trouvée');
  }
});

// @desc    Suspend agence
// @route   PUT /api/agences/:id/suspend
// @access  Private/Admin
const suspendAgence = asyncHandler(async (req, res) => {
  const agence = await Agence.findById(req.params.id);

  if (agence) {
    agence.statut = 'suspendu';
    agence.dateSuspension = new Date();
    const updatedAgence = await agence.save();

    // Suspendre l'utilisateur associé à cette agence
    const user = await User.findOne({ agenceId: agence._id });
    if (user) {
      user.statut = 'suspendu';
      await user.save();
    }

    res.json(updatedAgence);
  } else {
    res.status(404);
    throw new Error('Agence non trouvée');
  }
});

// @desc    Update agence modules
// @route   PUT /api/agences/:id/modules
// @access  Private/Admin
const updateAgenceModules = asyncHandler(async (req, res) => {
  const { modulesActifs } = req.body;
  const agence = await Agence.findById(req.params.id);

  if (agence) {
    agence.modulesActifs = modulesActifs;
    const updatedAgence = await agence.save();
    res.json(updatedAgence);
  } else {
    res.status(404);
    throw new Error('Agence non trouvée');
  }
});

// @desc    Get users of an agence
// @route   GET /api/agences/:id/users
// @access  Private/Admin
const getAgenceUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ agenceId: req.params.id }).select('-password');
  res.json(users);
});

// @desc    Approve user of an agence
// @route   PUT /api/agences/:id/users/:userId/approve
// @access  Private/Admin
const approveAgenceUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  
  if (user && user.agenceId.toString() === req.params.id) {
    user.statut = 'actif';
    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error('Utilisateur non trouvé ou ne correspond pas à cette agence');
  }
});

// @desc    Suspend user of an agence
// @route   PUT /api/agences/:id/users/:userId/suspend
// @access  Private/Admin
const suspendAgenceUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  
  if (user && user.agenceId.toString() === req.params.id) {
    user.statut = 'suspendu';
    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error('Utilisateur non trouvé ou ne correspond pas à cette agence');
  }
});

// @desc    Update agency profile information
// @route   PUT /api/agences/profile
// @access  Private
const updateAgencyProfile = asyncHandler(async (req, res) => {
  try {
    const { agenceId } = req.user;
    
    if (!agenceId) {
      return res.status(400).json({
        success: false,
        message: 'ID de l\'agence manquant'
      });
    }

    const {
      nom,
      typeActivite,
      pays,
      wilaya,
      adresse,
      siteWeb,
      numeroRC,
      numeroNIF,
      numeroNIS,
      articleImposition,
      email,
      telephone,
      ibanRIB,
      logo
    } = req.body;

    // Vérifier si l'agence existe
    const agence = await Agence.findById(agenceId);
    
    if (!agence) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      });
    }

    // Vérifier si l'email est déjà utilisé par une autre agence
    if (email && email !== agence.email) {
      const emailExists = await Agence.findOne({ 
        email, 
        _id: { $ne: agenceId } 
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé par une autre agence'
        });
      }
    }

    // Vérifier si le RC ou NIF est déjà utilisé par une autre agence
    if ((numeroRC && numeroRC !== agence.numeroRC) || 
        (numeroNIF && numeroNIF !== agence.numeroNIF)) {
      const agenceExists = await Agence.findOne({
        $or: [
          ...(numeroRC && numeroRC !== agence.numeroRC ? [{ numeroRC }] : []),
          ...(numeroNIF && numeroNIF !== agence.numeroNIF ? [{ numeroNIF }] : [])
        ],
        _id: { $ne: agenceId }
      });

      if (agenceExists) {
        return res.status(400).json({
          success: false,
          message: 'Ces coordonnées administratives sont déjà utilisées par une autre agence'
        });
      }
    }

    // Mettre à jour l'agence
    const updatedAgence = await Agence.findByIdAndUpdate(
      agenceId,
      {
        nom,
        typeActivite,
        pays,
        wilaya,
        adresse,
        siteWeb,
        numeroRC,
        numeroNIF,
        numeroNIS,
        articleImposition,
        email,
        telephone,
        ibanRIB,
        ...(logo && { logo })
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profil de l\'agence mis à jour avec succès',
      data: updatedAgence
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour',
      error: error.message
    });
  }
});

// @desc    Get agency profile for current user
// @route   GET /api/agences/profile
// @access  Private
const getAgencyProfile = asyncHandler(async (req, res) => {
  try {
    const { agenceId } = req.user;
    
    if (!agenceId) {
      return res.status(400).json({
        success: false,
        message: 'ID de l\'agence manquant'
      });
    }

    const agence = await Agence.findById(agenceId);
    
    if (!agence) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      });
    }

    // Ajout du champ gmailConnected pour le frontend
    const data = {
      ...agence.toObject(),
      gmailConnected: !!(agence.gmailToken && agence.gmailRefreshToken)
    };

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération',
      error: error.message
    });
  }
});

module.exports = {
  getAgences,
  getAgenceById,
  createAgence,
  approveAgence,
  rejectAgence,
  suspendAgence,
  updateAgenceModules,
  getAgenceUsers,
  approveAgenceUser,
  suspendAgenceUser,
  updateAgencyProfile,
  getAgencyProfile
};