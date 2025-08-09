const express = require('express');
const router = express.Router();
const { 
  getParametres,
  updateParametre,
  getParametreCategories,
  resetParametres
} = require('../controllers/parametreController');
const { protect, agency } = require('../middlewares/authMiddleware');

// All routes require authentication and agency access
router.use(protect, agency);

// Get all parameters
router.get('/', getParametres);

// Get parameter categories
router.get('/categories', getParametreCategories);

// Reset parameters to default
router.post('/reset', resetParametres);

// Update specific parameter
router.put('/:id', updateParametre);

module.exports = router;