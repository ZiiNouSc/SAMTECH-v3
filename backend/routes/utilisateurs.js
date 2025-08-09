const express = require('express');
const router = express.Router();
const {
  getUtilisateurs,
  getUtilisateurById,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
  changePassword,
  getProfile,
  updateProfile,
  getUtilisateurStats
} = require('../controllers/utilisateursController');

const { protect, agency } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(protect, agency);

// Profile routes (for current user)
router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

// Agency routes (require agency access)
router.route('/')
  .get(getUtilisateurs)
  .post(createUtilisateur);

router.route('/stats')
  .get(getUtilisateurStats);

router.route('/:id')
  .get(getUtilisateurById)
  .put(updateUtilisateur)
  .delete(deleteUtilisateur);

router.route('/:id/password')
  .put(changePassword);

module.exports = router; 