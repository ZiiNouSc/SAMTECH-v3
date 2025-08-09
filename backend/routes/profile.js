const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middlewares/authMiddleware');

// Routes de profil classiques
router.get('/', protect, profileController.getProfile);
router.put('/', protect, profileController.updateProfile);
router.post('/logo', protect, profileController.upload.single('logo'), profileController.updateLogo);
router.put('/user', protect, profileController.updateUserData);
router.put('/password', protect, profileController.updatePassword);

// Routes Gmail
router.get('/gmail/auth-url', protect, profileController.getGmailAuthUrl);
router.get('/gmail/callback', profileController.handleGmailCallback);
router.delete('/gmail/disconnect', protect, profileController.disconnectGmail);
router.post('/gmail/send', protect, profileController.sendEmailViaGmail);

module.exports = router;