const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  createPublicReservation,
  getReservations, 
  getReservationById, 
  updateReservationStatus, 
  deleteReservation,
  getReservationStats
} = require('../controllers/reservationController');

// Route publique pour créer une réservation
router.post('/public', createPublicReservation);

// Routes protégées pour l'administration
router.get('/', protect, getReservations);
router.get('/stats', protect, getReservationStats);
router.get('/:id', protect, getReservationById);
router.put('/:id/status', protect, updateReservationStatus);
router.delete('/:id', protect, deleteReservation);

module.exports = router;