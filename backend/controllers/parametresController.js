const asyncHandler = require('express-async-handler');
const Parametre = require('../models/parametreModel');

// @desc    Get all parameters
// @route   GET /api/parametres
// @access  Private/Agency
const getParametres = asyncHandler(async (req, res) => {
  if (req.user.role === 'superadmin') {
    // Le superadmin voit tous les paramètres, groupés par agence et catégorie
    const parametres = await Parametre.find({});
    
    // Grouper par agence et catégorie
    const grouped = parametres.reduce((acc, param) => {
      const agence = param.agenceId || 'global';
      if (!acc[agence]) acc[agence] = {};
      if (!acc[agence][param.categorie]) acc[agence][param.categorie] = [];
      acc[agence][param.categorie].push(param);
      return acc;
    }, {});
    
    return res.status(200).json({
      success: true,
      data: grouped
    });
  }

  // Cas agence classique
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const parametres = await Parametre.find({ agenceId });
  
  // Group by category
  const grouped = parametres.reduce((acc, param) => {
    if (!acc[param.categorie]) {
      acc[param.categorie] = [];
    }
    acc[param.categorie].push(param);
    return acc;
  }, {});
  
  res.status(200).json({
    success: true,
    data: grouped
  });
});

// @desc    Get parameter by ID
// @route   GET /api/parametres/:id
// @access  Private/Agency
const getParametreById = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const parametre = await Parametre.findOne({
    _id: req.params.id,
    agenceId
  });
  
  if (parametre) {
    res.status(200).json({
      success: true,
      data: parametre
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Paramètre non trouvé'
    });
  }
});

// @desc    Create new parameter
// @route   POST /api/parametres
// @access  Private/Agency
const createParametre = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { 
    nom, 
    valeur, 
    categorie, 
    description, 
    type = 'texte',
    obligatoire = false,
    ordre = 0
  } = req.body;
  
  if (!nom || !valeur || !categorie) {
    return res.status(400).json({
      success: false,
      message: 'Nom, valeur et catégorie sont requis'
    });
  }
  
  // Check if parameter already exists
  const existingParam = await Parametre.findOne({
    agenceId,
    nom,
    categorie
  });
  
  if (existingParam) {
    return res.status(400).json({
      success: false,
      message: 'Un paramètre avec ce nom existe déjà dans cette catégorie'
    });
  }
  
  const parametre = await Parametre.create({
    nom,
    valeur,
    categorie,
    description,
    type,
    obligatoire,
    ordre,
    agenceId,
    dateCreation: new Date()
  });
  
  res.status(201).json({
    success: true,
    message: 'Paramètre créé avec succès',
    data: parametre
  });
});

// @desc    Update parameter
// @route   PUT /api/parametres/:id
// @access  Private/Agency
const updateParametre = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { 
    nom, 
    valeur, 
    categorie, 
    description, 
    type,
    obligatoire,
    ordre
  } = req.body;
  
  const updateData = {};
  if (nom !== undefined) updateData.nom = nom;
  if (valeur !== undefined) updateData.valeur = valeur;
  if (categorie !== undefined) updateData.categorie = categorie;
  if (description !== undefined) updateData.description = description;
  if (type !== undefined) updateData.type = type;
  if (obligatoire !== undefined) updateData.obligatoire = obligatoire;
  if (ordre !== undefined) updateData.ordre = ordre;
  
  updateData.dateModification = new Date();
  
  const parametre = await Parametre.findOneAndUpdate(
    { _id: req.params.id, agenceId },
    updateData,
    { new: true }
  );
  
  if (parametre) {
    res.status(200).json({
      success: true,
      message: 'Paramètre mis à jour avec succès',
      data: parametre
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Paramètre non trouvé'
    });
  }
});

// @desc    Delete parameter
// @route   DELETE /api/parametres/:id
// @access  Private/Agency
const deleteParametre = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const parametre = await Parametre.findOneAndDelete({
    _id: req.params.id,
    agenceId
  });
  
  if (parametre) {
    res.status(200).json({
      success: true,
      message: 'Paramètre supprimé avec succès'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Paramètre non trouvé'
    });
  }
});

// @desc    Get parameters by category
// @route   GET /api/parametres/categorie/:categorie
// @access  Private/Agency
const getParametresByCategory = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const parametres = await Parametre.find({
    agenceId,
    categorie: req.params.categorie
  }).sort({ ordre: 1 });
  
  res.status(200).json({
    success: true,
    data: parametres
  });
});

// @desc    Update multiple parameters
// @route   PUT /api/parametres/bulk
// @access  Private/Agency
const updateMultipleParametres = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { parametres } = req.body;
  
  if (!Array.isArray(parametres)) {
    return res.status(400).json({
      success: false,
      message: 'Le paramètre "parametres" doit être un tableau'
    });
  }
  
  const updatePromises = parametres.map(async (param) => {
    if (!param.id || param.valeur === undefined) {
      throw new Error('ID et valeur sont requis pour chaque paramètre');
    }
    
    return Parametre.findOneAndUpdate(
      { _id: param.id, agenceId },
      { 
        valeur: param.valeur,
        dateModification: new Date()
      },
      { new: true }
    );
  });
  
  const updatedParametres = await Promise.all(updatePromises);
  
  res.status(200).json({
    success: true,
    message: `${updatedParametres.length} paramètres mis à jour avec succès`,
    data: updatedParametres
  });
});

// @desc    Get parameter categories
// @route   GET /api/parametres/categories
// @access  Private/Agency
const getParametreCategories = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const categories = await Parametre.distinct('categorie', { agenceId });
  
  res.status(200).json({
    success: true,
    data: categories
  });
});

// @desc    Reset parameters to default
// @route   POST /api/parametres/reset
// @access  Private/Agency
const resetParametres = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { categorie } = req.body;
  
  // Default parameters
  const defaultParametres = {
    general: [
      { nom: 'nom_agence', valeur: 'Mon Agence', description: 'Nom de l\'agence' },
      { nom: 'devise', valeur: 'EUR', description: 'Devise par défaut' },
      { nom: 'langue', valeur: 'fr', description: 'Langue par défaut' },
      { nom: 'fuseau_horaire', valeur: 'Europe/Paris', description: 'Fuseau horaire' }
    ],
    facturation: [
      { nom: 'tva_defaut', valeur: '20', description: 'Taux de TVA par défaut (%)' },
      { nom: 'delai_paiement', valeur: '30', description: 'Délai de paiement (jours)' },
      { nom: 'penalites_retard', valeur: '5', description: 'Pénalités de retard (%)' },
      { nom: 'conditions_paiement', valeur: 'Paiement à 30 jours', description: 'Conditions de paiement' }
    ],
    notifications: [
      { nom: 'notif_email', valeur: 'true', description: 'Activer les notifications email' },
      { nom: 'notif_sms', valeur: 'false', description: 'Activer les notifications SMS' },
      { nom: 'notif_push', valeur: 'true', description: 'Activer les notifications push' }
    ]
  };
  
  if (categorie && defaultParametres[categorie]) {
    // Reset specific category
    await Parametre.deleteMany({ agenceId, categorie });
    
    const parametresToCreate = defaultParametres[categorie].map(param => ({
      ...param,
      agenceId,
      categorie,
      type: 'texte',
      obligatoire: false,
      ordre: 0,
      dateCreation: new Date()
    }));
    
    await Parametre.insertMany(parametresToCreate);
    
    res.status(200).json({
      success: true,
      message: `Paramètres de la catégorie "${categorie}" réinitialisés avec succès`
    });
  } else {
    // Reset all categories
    await Parametre.deleteMany({ agenceId });
    
    const allParametres = [];
    Object.entries(defaultParametres).forEach(([cat, params]) => {
      params.forEach(param => {
        allParametres.push({
          ...param,
          agenceId,
          categorie: cat,
          type: 'texte',
          obligatoire: false,
          ordre: 0,
          dateCreation: new Date()
        });
      });
    });
    
    await Parametre.insertMany(allParametres);
    
    res.status(200).json({
      success: true,
      message: 'Tous les paramètres ont été réinitialisés avec succès'
    });
  }
});

module.exports = {
  getParametres,
  getParametreById,
  createParametre,
  updateParametre,
  deleteParametre,
  getParametresByCategory,
  updateMultipleParametres,
  getParametreCategories,
  resetParametres
};