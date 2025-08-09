const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Agence = require('../models/agenceModel');
const generateToken = require('../utils/generateToken');
const mongoose = require('mongoose');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  console.log('[LOGIN] Tentative de connexion', req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('[LOGIN] Email ou mot de passe manquant');
    return res.status(400).json({
      success: false,
      message: 'Email et mot de passe requis'
    });
  }

  try {
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    console.log('[LOGIN] Utilisateur trouvé:', user ? user.email : 'Aucun');

    if (user && (await user.matchPassword(password))) {
      console.log('[LOGIN] Mot de passe correct');
      // Pour les agents, récupérer les agences associées
      let userAgences = [];
      if (user.role === 'agent') {
        if (user.agences && user.agences.length > 0) {
          userAgences = await Agence.find({ _id: { $in: user.agences } });
        } else if (user.agenceId) {
          const agence = await Agence.findById(user.agenceId);
          if (agence) {
            userAgences = [agence];
          }
        }
      } else if (user.role === 'agence') {
        // Correction : toujours recharger l'agence depuis la base pour avoir modulesActifs à jour
        let agence = null;
        if (user.agenceId) {
          agence = await Agence.findById(user.agenceId);
        } else if (user.agences && user.agences.length > 0) {
          agence = await Agence.findById(user.agences[0]);
        }
        if (agence) {
          userAgences = [agence];
        }
      }
      // Correction : tous les id en string
      const userWithoutPassword = {
        id: user._id.toString(),
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        agenceId: user.agenceId ? user.agenceId.toString() : undefined,
        agences: userAgences.map(a => ({
          id: a._id.toString(),
          nom: a.nom,
          email: a.email,
          statut: a.statut,
          modulesActifs: a.modulesActifs
        })),
        statut: user.statut,
        permissions: user.permissions
      };
      console.log('[LOGIN] user renvoyé au frontend:', userWithoutPassword);
      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        user: userWithoutPassword,
        token: generateToken(user._id)
      });
    } else {
      console.log('[LOGIN] Identifiants incorrects');
      res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }
  } catch (err) {
    console.error('[LOGIN] Erreur serveur:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion',
      error: err.message
    });
  }
});

// @desc    Register a new user with wizard
// @route   POST /api/auth/register-wizard
// @access  Public
const registerWizard = asyncHandler(async (req, res) => {
  try {
    const { agence, utilisateur, logo } = req.body;

    if (!agence || !utilisateur) {
      return res.status(400).json({
        success: false,
        message: 'Données d\'inscription manquantes'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email: { $regex: new RegExp(`^${utilisateur.email}$`, 'i') } });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier si l'agence existe déjà (par RC ou NIF)
    if (agence.numeroRC || agence.numeroNIF) {
      const agenceExists = await Agence.findOne({
        $or: [
          ...(agence.numeroRC ? [{ numeroRC: agence.numeroRC }] : []),
          ...(agence.numeroNIF ? [{ numeroNIF: agence.numeroNIF }] : [])
        ]
      });

      if (agenceExists) {
        return res.status(400).json({
          success: false,
          message: 'Une agence avec ces coordonnées existe déjà'
        });
      }
    }

    // Préparer les données de l'agence
    const agenceData = {
      nom: agence.nom,
      typeActivite: agence.typeActivite || 'agence-voyage',
      pays: agence.pays || 'Algérie',
      wilaya: agence.wilaya,
      adresse: agence.adresse,
      siteWeb: agence.siteWeb,
      numeroRC: agence.numeroRC,
      numeroNIF: agence.numeroNIF,
      numeroNIS: agence.numeroNIS,
      articleImposition: agence.articleImposition,
      email: agence.email,
      telephone: agence.telephone,
      ibanRIB: agence.ibanRIB,
      statut: 'en_attente',
      modulesActifs: [], // Vide au début, le superadmin les activera
      modulesChoisis: agence.modulesActifs || [], // Modules choisis dans le wizard
      logo: logo ? (typeof logo === 'string' ? logo : logo.name) : null
    };

    // Créer la nouvelle agence
    const newAgence = await Agence.create(agenceData);

    // Préparer les données de l'utilisateur
    const userData = {
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      telephone: utilisateur.telephone || '', // S'assurer que le téléphone est inclus
      password: utilisateur.password,
      role: 'agence',
      statut: 'en_attente',
      agenceId: newAgence._id,
      permissions: [
        {
          module: 'clients',
          actions: ['lire', 'ecrire', 'supprimer']
        },
        {
          module: 'fournisseurs',
          actions: ['lire', 'ecrire', 'supprimer']
        },
        {
          module: 'factures',
          actions: ['lire', 'ecrire', 'supprimer']
        },
        {
          module: 'caisse',
          actions: ['lire', 'ecrire', 'supprimer']
        }
      ]
    };

    // Créer le nouvel utilisateur
    const newUser = await User.create(userData);

    if (newUser && newAgence) {
      // Retourner la réponse sans le mot de passe
      const userWithoutPassword = {
        id: newUser._id,
        email: newUser.email,
        nom: newUser.nom,
        prenom: newUser.prenom,
        role: newUser.role,
        agenceId: newUser.agenceId,
        statut: newUser.statut
      };

      res.status(201).json({
        success: true,
        message: 'Inscription réussie, en attente d\'approbation',
        user: userWithoutPassword,
        agence: {
          id: newAgence._id,
          nom: newAgence.nom,
          statut: newAgence.statut
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la création du compte'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription wizard',
      error: error.message
    });
  }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  try {
    const { 
      nomAgence, 
      email, 
      password, 
      typeActivite, 
      siret, 
      adresse, 
      ville, 
      codePostal, 
      pays, 
      telephone,
      modulesChoisis = []
    } = req.body;

    if (!nomAgence || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Informations manquantes'
      });
    }

    const userExists = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Create new agency
    const agence = await Agence.create({
      nom: nomAgence,
      email,
      telephone,
      adresse: `${adresse}, ${codePostal} ${ville}, ${pays}`,
      statut: 'en_attente',
      modulesActifs: [],
      modulesChoisis,
      typeActivite,
      siret
    });

    // Create new user
    const user = await User.create({
      email,
      password,
      nom: nomAgence,
      prenom: '',
      telephone: telephone || '',
      role: 'agence',
      statut: 'en_attente',
      agenceId: agence._id
    });

    if (user) {
      // Remove password from response
      const userWithoutPassword = {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        agenceId: user.agenceId,
        statut: user.statut
      };

      res.status(201).json({
        success: true,
        message: 'Inscription réussie, en attente d\'approbation',
        user: userWithoutPassword
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Données utilisateur invalides'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      error: error.message
    });
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  const user = await User.findById(req.user._id).select('-password');

  if (user) {
    res.status(200).json({
      success: true,
      data: user
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }
});

// @desc    Get user's agencies
// @route   GET /api/auth/agences
// @access  Private
const getUserAgences = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  try {
    // Si l'utilisateur est superadmin, renvoyer toutes les agences
    if (req.user.role === 'superadmin') {
      const agences = await Agence.find({});
      res.status(200).json({
        success: true,
        data: agences
      });
    } else if (req.user.role === 'agent') {
      // Si l'utilisateur est un agent, récupérer ses agences
      let agences = [];
      
      if (req.user.agences && req.user.agences.length > 0) {
        agences = await Agence.find({ _id: { $in: req.user.agences } });
      } else if (req.user.agenceId) {
        const agence = await Agence.findById(req.user.agenceId);
        if (agence) {
          agences = [agence];
        }
      }

      res.status(200).json({
        success: true,
        data: agences
      });
    } else if (req.user.role === 'agence' && req.user.agenceId) {
      // Si l'utilisateur est une agence, renvoyer son agence
      const agence = await Agence.findById(req.user.agenceId);
      
      if (agence) {
        res.status(200).json({
          success: true,
          data: [agence]
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Agence non trouvée'
        });
      }
    } else {
      res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des agences'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  try {
    // Toujours recharger l'utilisateur complet depuis la base
    const userInDb = await User.findById(req.user._id);
    if (!userInDb) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }
    const { nom, prenom, email, telephone } = req.body;
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== userInDb.email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: req.user._id }
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé par un autre utilisateur"
        });
      }
    }
    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { nom, prenom, email, telephone },
      { new: true, runValidators: true }
    ).select("-password");
    res.status(200).json({
      success: true,
      message: "Profil utilisateur mis à jour avec succès",
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour",
      error: error.message
    });
  }
});

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Vérifier le mot de passe actuel
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du changement de mot de passe',
      error: error.message
    });
  }
});

// @desc    Update superadmin profile
// @route   PUT /api/auth/profile
// @access  Private (superadmin)
const updateSuperadminProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }
    // Seuls ces champs sont modifiables
    const { nom, prenom, email, telephone } = req.body;
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (email) user.email = email;
    if (telephone) user.telephone = telephone;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Profil superadmin mis à jour avec succès",
      data: {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur lors de la mise à jour du profil", error: error.message });
  }
});

module.exports = {
  loginUser,
  registerUser,
  registerWizard,
  logoutUser,
  getUserProfile,
  getUserAgences,
  updateProfile,
  changePassword,
  updateSuperadminProfile
};