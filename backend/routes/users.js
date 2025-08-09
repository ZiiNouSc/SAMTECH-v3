const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const { 
  getAllUsers, 
  getUtilisateurById, 
  createUtilisateur, 
  updateUtilisateur, 
  deleteUtilisateur,
  assignToAgency,
  removeFromAgency
} = require('../controllers/utilisateursController');

// Routes pour le superadmin
router.get('/', protect, admin, getAllUsers);
router.get('/:id', protect, admin, getUtilisateurById);
router.post('/', protect, admin, createUtilisateur);
router.put('/:id', protect, admin, updateUtilisateur);
router.delete('/:id', protect, admin, deleteUtilisateur);
router.put('/:userId/assign-agency', protect, admin, assignToAgency);
router.put('/:userId/remove-agency', protect, admin, removeFromAgency);

module.exports = router; 