const express = require('express');
const router = express.Router();
const { protect, agency } = require('../middlewares/authMiddleware');
const { getVitrineConfig, updateVitrineConfig, toggleVitrineActive, getVitrineConfigPublic, uploadBanner } = require('../controllers/vitrineController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration multer pour l'upload de bannière
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    let agenceId = req.user?.agenceId;
    const agence = await require('../models/agenceModel').findById(agenceId);
    // Utiliser le même dossier que les uploads d'agences
    const dossier = path.join(__dirname, '../uploads/agences/', agence ? (agence.nom?.replace(/\s+/g, '_') || agenceId) : agenceId);
    fs.mkdirSync(dossier, { recursive: true });
    cb(null, dossier);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, 'banner' + ext);
  }
});
const upload = multer({ storage });

// Get vitrine config
router.get('/', protect, agency, getVitrineConfig);

// Update vitrine config
router.put('/', protect, agency, updateVitrineConfig);

// Toggle vitrine active status
router.put('/toggle', protect, agency, toggleVitrineActive);

// Upload banner
router.post('/banner', protect, agency, upload.single('banner'), uploadBanner);

router.get('/public/:slug', getVitrineConfigPublic);

module.exports = router;