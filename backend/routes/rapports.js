const express = require('express');
const router = express.Router();
const { protect, agency } = require('../middlewares/authMiddleware');
const { getRapports, getRapportById, createRapport, updateRapport, deleteRapport, getReservationsReport, getActivityReport } = require('../controllers/rapportController');

router.use(protect, agency);

router.get('/', getRapports);
router.get('/:id', getRapportById);
router.post('/', createRapport);
router.put('/:id', updateRapport);
router.delete('/:id', deleteRapport);
router.get('/reservations', getReservationsReport);
router.get('/activity', getActivityReport);

module.exports = router;