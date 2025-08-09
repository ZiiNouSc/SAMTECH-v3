const express = require('express');
const router = express.Router();
const { protect, admin, hasPermission } = require('../middlewares/authMiddleware');
const { 
  getAgents, 
  getAgentById, 
  createAgent, 
  updateAgent, 
  deleteAgent,
  updateAgentPermissions,
  assignAgentAgencies
} = require('../controllers/agentController');

// Get all agents (admin can see all, agence can see their own)
router.get('/', protect, hasPermission('agents', 'lire'), getAgents);

// Get agent by ID (admin can see all, agence can see their own)
router.get('/:id', protect, hasPermission('agents', 'lire'), getAgentById);

// Create new agent (admin and agence can create)
router.post('/', protect, hasPermission('agents', 'creer'), createAgent);

// Update agent (admin and agence can update their own)
router.put('/:id', protect, hasPermission('agents', 'modifier'), updateAgent);

// Update agent permissions (admin only)
router.put('/:id/permissions', protect, admin, updateAgentPermissions);

// Assign agent to agencies (admin only)
router.put('/:id/agencies', protect, admin, assignAgentAgencies);

// Delete agent (admin and agence can delete their own)
router.delete('/:id', protect, hasPermission('agents', 'supprimer'), deleteAgent);

module.exports = router;