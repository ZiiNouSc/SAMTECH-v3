const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const { getAgences, getAgenceById, createAgence, approveAgence, rejectAgence, suspendAgence, updateAgenceModules, getAgenceUsers, approveAgenceUser, suspendAgenceUser, updateAgencyProfile, getAgencyProfile } = require('../controllers/agenceController');

// Get all agences
router.get('/', protect, admin, getAgences);

// Create new agence
router.post('/', protect, admin, createAgence);

// Get agency profile (for agency users)
router.get('/profile', protect, getAgencyProfile);

// Update agency profile (for agency users)
router.put('/profile', protect, updateAgencyProfile);

// Get agence by ID
router.get('/:id', protect, admin, getAgenceById);

// Approve agence
router.put('/:id/approve', protect, admin, approveAgence);

// Reject agence
router.put('/:id/reject', protect, admin, rejectAgence);

// Suspend agence
router.put('/:id/suspend', protect, admin, suspendAgence);

// Update agence modules
router.put('/:id/modules', protect, admin, updateAgenceModules);

// Get users of an agence
router.get('/:id/users', protect, admin, getAgenceUsers);

// Approve user of an agence
router.put('/:id/users/:userId/approve', protect, admin, approveAgenceUser);

// Suspend user of an agence
router.put('/:id/users/:userId/suspend', protect, admin, suspendAgenceUser);

module.exports = router;