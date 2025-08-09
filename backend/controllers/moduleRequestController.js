const asyncHandler = require('express-async-handler');
const ModuleRequest = require('../models/moduleRequestModel');
const Agence = require('../models/agenceModel');

// @desc    Get all module requests
// @route   GET /api/module-requests
// @access  Private/Admin
const getModuleRequests = asyncHandler(async (req, res) => {
  const moduleRequests = await ModuleRequest.find({}).populate('agenceId', 'nom email telephone');
  
  // Format data to match frontend expectations
  const formattedRequests = moduleRequests.map(request => ({
    id: request._id,
    agenceId: request.agenceId._id,
    modules: request.modules,
    message: request.message,
    statut: request.statut,
    dateCreation: request.dateCreation,
    dateTraitement: request.dateTraitement,
    commentaireAdmin: request.commentaireAdmin,
    agence: {
      nom: request.agenceId.nom,
      email: request.agenceId.email,
      telephone: request.agenceId.telephone
    }
  }));
  
  res.status(200).json({
    success: true,
    data: formattedRequests
  });
});

// @desc    Get module requests for an agency
// @route   GET /api/module-requests/agency
// @access  Private/Agency
const getAgencyModuleRequests = asyncHandler(async (req, res) => {
  // Get agenceId from authenticated user
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  // Vérifier que l'agence existe
  const agence = await Agence.findById(agenceId);
  if (!agence) {
    return res.status(404).json({
      success: false,
      message: 'Agence non trouvée'
    });
  }
  
  const moduleRequests = await ModuleRequest.find({ agenceId });
  
  res.status(200).json({
    success: true,
    data: moduleRequests
  });
});

// @desc    Create new module request
// @route   POST /api/module-requests
// @access  Private/Agency
const createModuleRequest = asyncHandler(async (req, res) => {
  const { modules, message } = req.body;
  
  if (!modules || !modules.length || !message) {
    return res.status(400).json({
      success: false,
      message: 'Informations manquantes'
    });
  }
  
  // Get agenceId from authenticated user
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  // Vérifier que l'agence existe
  const agence = await Agence.findById(agenceId);
  if (!agence) {
    return res.status(404).json({
      success: false,
      message: 'Agence non trouvée'
    });
  }
  
  // Mettre à jour les modules demandés par l'agence
  agence.modulesDemandes = [...new Set([...agence.modulesDemandes || [], ...modules])];
  await agence.save();
  
  const moduleRequest = await ModuleRequest.create({
    agenceId,
    modules,
    message,
    statut: 'en_attente'
  });
  
  res.status(201).json({
    success: true,
    message: 'Demande de modules envoyée avec succès',
    data: moduleRequest
  });
});

// @desc    Process module request (approve/reject)
// @route   PUT /api/module-requests/:id/process
// @access  Private/Admin
const processModuleRequest = asyncHandler(async (req, res) => {
  const { statut, commentaireAdmin } = req.body;
  
  if (!statut || !['approuve', 'rejete'].includes(statut)) {
    return res.status(400).json({
      success: false,
      message: 'Statut invalide'
    });
  }
  
  const moduleRequest = await ModuleRequest.findById(req.params.id);
  
  if (!moduleRequest) {
    return res.status(404).json({
      success: false,
      message: 'Demande non trouvée'
    });
  }
  
  moduleRequest.statut = statut;
  moduleRequest.commentaireAdmin = commentaireAdmin || '';
  moduleRequest.dateTraitement = Date.now();
  
  const updatedRequest = await moduleRequest.save();
  
  // If approved, update agency modules
  if (statut === 'approuve') {
    const agence = await Agence.findById(moduleRequest.agenceId);
    
    if (agence) {
      // Add requested modules to active modules
      const newModules = moduleRequest.modules.filter(
        module => !agence.modulesActifs.includes(module)
      );
      
      agence.modulesActifs = [...agence.modulesActifs, ...newModules];
      
      // Remove from modulesDemandes
      agence.modulesDemandes = agence.modulesDemandes.filter(
        module => !moduleRequest.modules.includes(module)
      );
      
      await agence.save();
    }
  }
  
  res.status(200).json({
    success: true,
    message: `Demande ${statut === 'approuve' ? 'approuvée' : 'rejetée'} avec succès`,
    data: updatedRequest
  });
});

// @desc    Get agencies with pending module requests
// @route   GET /api/module-requests/admin/pending
// @access  Private/Admin
const getAgenciesWithPendingRequests = asyncHandler(async (req, res) => {
  // Trouver toutes les agences avec des modules demandés
  const agences = await Agence.find({ 
    'modulesDemandes.0': { $exists: true } 
  });
  
  res.status(200).json({
    success: true,
    data: agences
  });
});

module.exports = {
  getModuleRequests,
  getAgencyModuleRequests,
  createModuleRequest,
  processModuleRequest,
  getAgenciesWithPendingRequests
};