const express = require('express');
const router = express.Router();
const { 
  loginUser, 
  registerUser, 
  registerWizard,
  logoutUser, 
  getUserProfile,
  getUserAgences,
  updateProfile,
  changePassword,
  updateSuperadminProfile
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Login route
router.post('/login', loginUser);

// Register route
router.post('/register', registerWizard);

// Logout route
router.post('/logout', logoutUser);

// Get current user route
router.get('/me', protect, getUserProfile);

// Get user's agencies
router.get('/agences', protect, getUserAgences);

// Update user profile
router.put('/profile', protect, updateSuperadminProfile);

// Change user password
router.put('/change-password', protect, changePassword);

module.exports = router;