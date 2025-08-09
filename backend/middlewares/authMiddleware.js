const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Agence = require('../models/agenceModel');

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
  // SUPPRESSION DU MODE MOCK : on utilise toujours le vrai JWT et la vraie base
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // On récupère le user complet
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Utilisateur non trouvé');
      }

      // On s'assure que agenceId est bien présent
      if (!req.user.agenceId && req.user.agences && req.user.agences.length > 0) {
        req.user.agenceId = req.user.agences[0]._id;
      }

      next();
    } catch (error) {
      console.error('Erreur d\'authentification:', error.message);
      res.status(401);
      throw new Error('Non autorisé, token invalide');
    }
  } else {
    res.status(401);
    throw new Error('Non autorisé, token manquant');
  }
});

// Admin middleware
const admin = async (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  if (req.user && req.user.role === 'agence') {
    const agence = await Agence.findById(req.user.agenceId);
    if (agence && agence.modulesActifs && agence.modulesActifs.includes('agents')) {
      return next();
    }
  }
  res.status(401);
  throw new Error('Non autorisé en tant qu\'administrateur');
};

// Agency middleware
const agency = (req, res, next) => {
  if (req.user && (req.user.role === 'agence' || req.user.role === 'superadmin')) {
    next();
  } else {
    res.status(401);
    throw new Error('Non autorisé en tant qu\'agence');
  }
};

// Agent middleware
const agent = (req, res, next) => {
  if (req.user && (req.user.role === 'agent' || req.user.role === 'agence' || req.user.role === 'superadmin')) {
    next();
  } else {
    res.status(401);
    throw new Error('Non autorisé en tant qu\'agent');
  }
};

// Check if user has permission for a module
const hasPermission = (module, action) => {
  return asyncHandler(async (req, res, next) => {
    // Superadmin a toutes les permissions
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Agency admin has all permissions on their active modules
    if (req.user.role === 'agence') {
      try {
        const agence = await Agence.findById(req.user.agenceId);
        if (!agence) {
          res.status(404);
          throw new Error('Agence non trouvée');
        }
        
        const modulesParDefaut = ['profile', 'parametres', 'demande-module', 'agents', 'todos'];
        
        // Logs pour debug
        console.log('🔐 [PERMISSIONS] Vérification des permissions:');
        console.log('  - Module demandé:', module);
        console.log('  - Action demandée:', action);
        console.log('  - Rôle utilisateur:', req.user.role);
        console.log('  - ID Agence:', req.user.agenceId);
        console.log('  - Modules actifs de l\'agence:', agence.modulesActifs);
        
        // Si l'agence a le module fournisseurs, elle peut accéder à tout ce qui concerne les fournisseurs
        const modulesFournisseurs = [
          'fournisseurs',
          'factures-fournisseurs', 
          'historique-fournisseurs',
          'paiements-fournisseurs'
        ];
        
        // Vérifier si le module est directement actif
        const moduleDirectementActif = agence.modulesActifs.includes(module);
        
        // Vérifier si le module est lié aux fournisseurs et que l'agence a le module fournisseurs
        const moduleLieAuxFournisseurs = modulesFournisseurs.includes(module);
        const agenceAFournisseurs = agence.modulesActifs.includes('fournisseurs');
        
        console.log('Module directement actif ?', moduleDirectementActif);
        console.log('Module lié aux fournisseurs ?', moduleLieAuxFournisseurs);
        console.log('Agence a fournisseurs ?', agenceAFournisseurs);
        
        if (modulesParDefaut.includes(module) || moduleDirectementActif || (moduleLieAuxFournisseurs && agenceAFournisseurs)) {
          console.log('✅ [PERMISSIONS] Accès autorisé');
          return next();
        } else {
          console.log('❌ [PERMISSIONS] Accès refusé - Module non actif');
          res.status(403);
          throw new Error(`Non autorisé, module '${module}' non actif pour cette agence`);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification des modules:', err);
        res.status(500);
        throw new Error('Erreur lors de la vérification des modules de l\'agence');
      }
    }

    // For agents, check specific permissions
    if (req.user.role === 'agent' && req.user.permissions) {
      const modulePermission = req.user.permissions.find(p => p.module === module);
      if (modulePermission && modulePermission.actions.includes(action)) {
        return next();
      }
    }

    res.status(403);
    throw new Error('Non autorisé, permissions insuffisantes');
  });
};

module.exports = { protect, admin, agency, agent, hasPermission };