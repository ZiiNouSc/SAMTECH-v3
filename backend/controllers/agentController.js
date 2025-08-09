const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Agence = require('../models/agenceModel');

// @desc    Get all agents
// @route   GET /api/agents
// @access  Private/Admin
const getAgents = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const agents = await User.find({ 
    role: 'agent',
    agenceId 
  }).select('-password').populate('agenceId', 'nom');
  
  res.status(200).json({
    success: true,
    data: agents
  });
});

// @desc    Get agent by ID
// @route   GET /api/agents/:id
// @access  Private/Admin
const getAgentById = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const agent = await User.findOne({
    _id: req.params.id,
    role: 'agent',
    agenceId
  }).select('-password').populate('agenceId', 'nom');
  
  if (agent) {
    res.status(200).json({
      success: true,
      data: agent
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Agent non trouvé'
    });
  }
});

// @desc    Create new agent
// @route   POST /api/agents
// @access  Private/Admin
const createAgent = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { nom, prenom, email, telephone, password, permissions } = req.body;

  // Validation des champs requis
  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nom, prénom, email et mot de passe sont requis'
    });
  }

  // Vérifier si l'utilisateur existe déjà
  const userExists = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'Un utilisateur avec cet email existe déjà'
    });
  }

  // Créer l'agent (utilisateur avec rôle 'agent')
  const agent = await User.create({
    nom,
    prenom,
    email,
    password, // Le modèle va automatiquement hasher ce mot de passe
    telephone,
    role: 'agent',
    agenceId,
    permissions: permissions || [],
    statut: 'actif'
  });

  if (agent) {
    const agentResponse = {
      _id: agent._id,
      nom: agent.nom,
      prenom: agent.prenom,
      email: agent.email,
      telephone: agent.telephone,
      role: agent.role,
      agenceId: agent.agenceId,
      permissions: agent.permissions,
      statut: agent.statut,
      dateInscription: agent.dateInscription
    };

    res.status(201).json({
      success: true,
      data: agentResponse
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Données agent invalides'
    });
  }
});

// @desc    Update agent
// @route   PUT /api/agents/:id
// @access  Private/Admin
const updateAgent = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const agent = await User.findOne({
    _id: req.params.id,
    role: 'agent',
    agenceId
  });

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent non trouvé'
    });
  }

  const { nom, prenom, email, telephone, password, permissions, statut } = req.body;

  // Mettre à jour les champs
  if (nom !== undefined) agent.nom = nom;
  if (prenom !== undefined) agent.prenom = prenom;
  if (email !== undefined) agent.email = email;
  if (telephone !== undefined) agent.telephone = telephone;
  if (permissions !== undefined) agent.permissions = permissions;
  if (statut !== undefined) agent.statut = statut;
  
  // Mettre à jour le mot de passe si fourni (le modèle va automatiquement hasher)
  if (password) {
    agent.password = password;
  }

  await agent.save();

  const agentResponse = {
    _id: agent._id,
    nom: agent.nom,
    prenom: agent.prenom,
    email: agent.email,
    telephone: agent.telephone,
    role: agent.role,
    agenceId: agent.agenceId,
    permissions: agent.permissions,
    statut: agent.statut,
    dateInscription: agent.dateInscription
  };

  res.status(200).json({
    success: true,
    data: agentResponse
  });
});

// @desc    Delete agent
// @route   DELETE /api/agents/:id
// @access  Private/Admin
const deleteAgent = asyncHandler(async (req, res) => {
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
  
  const agent = await User.findOneAndDelete({
    _id: req.params.id,
    role: 'agent',
    agenceId
  });

  if (agent) {
    res.status(200).json({
      success: true,
      message: 'Agent supprimé avec succès'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Agent non trouvé'
    });
  }
});

// @desc    Update agent permissions
// @route   PUT /api/agents/:id/permissions
// @access  Private/Admin
const updateAgentPermissions = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { permissions } = req.body;
  
  if (!permissions || !Array.isArray(permissions)) {
    return res.status(400).json({
      success: false,
      message: 'Permissions invalides'
    });
  }
  
  const agent = await User.findOne({
    _id: req.params.id,
    role: 'agent',
    agenceId
  });

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent non trouvé'
    });
  }

  // Mettre à jour les permissions
  agent.permissions = permissions;
  await agent.save();

  const agentResponse = {
    _id: agent._id,
    nom: agent.nom,
    prenom: agent.prenom,
    email: agent.email,
    telephone: agent.telephone,
    role: agent.role,
    agenceId: agent.agenceId,
    permissions: agent.permissions,
    statut: agent.statut,
    dateInscription: agent.dateInscription
  };

  res.status(200).json({
    success: true,
    data: agentResponse
  });
});

// @desc    Assign agent to agencies
// @route   PUT /api/agents/:id/agencies
// @access  Private/Admin
const assignAgentAgencies = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { agences } = req.body;
  
  if (!agences || !Array.isArray(agences)) {
    return res.status(400).json({
      success: false,
      message: 'Liste d\'agences invalide'
    });
  }
  
  const agent = await User.findOne({
    _id: req.params.id,
    role: 'agent',
    agenceId
  });

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent non trouvé'
    });
  }

  // Mettre à jour les agences assignées
  agent.agences = agences;
  await agent.save();

  const agentResponse = {
    _id: agent._id,
    nom: agent.nom,
    prenom: agent.prenom,
    email: agent.email,
    telephone: agent.telephone,
    role: agent.role,
    agenceId: agent.agenceId,
    agences: agent.agences,
    permissions: agent.permissions,
    statut: agent.statut,
    dateInscription: agent.dateInscription
  };

  res.status(200).json({
    success: true,
    data: agentResponse
  });
});

module.exports = {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  updateAgentPermissions,
  assignAgentAgencies
};