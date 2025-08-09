const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const hotelController = require('../controllers/hotelController');
const { protect, agent, hasPermission } = require('../middlewares/authMiddleware');
const { analyserHotelIA, extractTextFromPDF } = require('../services/iaService');

// Configuration multer pour l'upload de fichiers PDF
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/temp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `hotel-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
    }
  }
});

// Routes pour les réservations hôtel
router.get('/', protect, agent, hotelController.getAllReservations);
router.get('/non-factures', protect, agent, hotelController.getNonFactures);
router.get('/:id', protect, agent, hotelController.getReservationById);
router.post('/', protect, agent, hotelController.createReservation);
router.put('/:id', protect, agent, hotelController.updateReservation);
router.delete('/:id', protect, agent, hotelController.deleteReservation);

// Endpoint pour l'analyse IA d'un voucher hôtel
router.post('/ia-analyse-hotel', protect, hasPermission('hotel', 'creer'), async (req, res) => {
  try {
    const { texte } = req.body;
    if (!texte) {
      return res.status(400).json({ message: 'Texte requis pour l\'analyse' });
    }

    const resultat = await analyserHotelIA(texte);
    if (!resultat || !resultat.informations) {
      return res.status(400).json({ message: 'Impossible d\'extraire les informations du voucher hôtel' });
    }

    // Calcul automatique des taxes si HT et TTC sont fournis
    const prix_ht = Number(resultat.informations.prix_ht) || 0;
    const prix_ttc = Number(resultat.informations.prix_ttc) || 0;
    if (prix_ht > 0 && prix_ttc > 0) {
      resultat.informations.taxes = prix_ttc - prix_ht;
    } else {
      resultat.informations.taxes = 0;
    }

    // Calcul du prix par nuit si possible
    const nombre_nuits = Number(resultat.informations.nombre_nuits) || 1;
    if (prix_ttc > 0 && nombre_nuits > 0) {
      resultat.informations.prix_par_nuit = Math.round(prix_ttc / nombre_nuits);
    }

    // Ajouter métadonnées d'import
    resultat.lastImport = {
      source: 'text_analysis',
      timestamp: new Date().toISOString(),
      userId: req.user.id,
      agenceId: req.user.agenceId
    };

    res.json(resultat);
  } catch (error) {
    console.error('Erreur analyse IA hôtel:', error);
    res.status(500).json({ message: 'Erreur lors de l\'analyse IA' });
  }
});

// Endpoint pour extraire le texte d'un PDF de voucher hôtel
router.post('/extract-pdf-text', protect, hasPermission('hotel', 'creer'), upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier PDF fourni' });
    }

    const pdfPath = req.file.path;
    const text = await extractTextFromPDF(pdfPath);
    
    // Supprimer le fichier temporaire
    fs.unlinkSync(pdfPath);

    res.json({ 
      success: true, 
      text: text,
      filename: req.file.originalname
    });
  } catch (error) {
    console.error('Erreur extraction PDF hôtel:', error);
    res.status(500).json({ message: 'Erreur lors de l\'extraction du texte PDF', error: error.message });
  }
});

// Import d'un voucher hôtel depuis un PDF (création automatique)
router.post('/import-pdf', protect, hasPermission('hotel', 'creer'), upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier PDF fourni' });
    }

    const pdfPath = req.file.path;
    const text = await extractTextFromPDF(pdfPath);
    
    // Supprimer le fichier temporaire
    fs.unlinkSync(pdfPath);

    // Analyse IA
    const resultat = await analyserHotelIA(text);
    if (!resultat || !resultat.informations) {
      return res.status(400).json({ message: 'Impossible d\'extraire les informations du voucher hôtel' });
    }

    // Calculs automatiques
    const prix_ht = Number(resultat.informations.prix_ht) || 0;
    const prix_ttc = Number(resultat.informations.prix_ttc) || 0;
    if (prix_ht > 0 && prix_ttc > 0) {
      resultat.informations.taxes = prix_ttc - prix_ht;
    }

    const nombre_nuits = Number(resultat.informations.nombre_nuits) || 1;
    if (prix_ttc > 0 && nombre_nuits > 0) {
      resultat.informations.prix_par_nuit = Math.round(prix_ttc / nombre_nuits);
    }

    // Création de la réservation hôtel
    const agenceId = req.user?.agenceId;
    if (!agenceId) {
      return res.status(400).json({ message: 'ID d\'agence manquant' });
    }

    const hotelData = {
      agenceId: agenceId,
      clientId: null, // À définir par l'utilisateur
      nomHotel: resultat.informations.nom_hotel || '',
      ville: resultat.informations.ville || '',
      dateEntree: resultat.informations.date_entree || '',
      dateSortie: resultat.informations.date_sortie || '',
      numeroVoucher: resultat.informations.numero_voucher || '',
      prix: prix_ttc || 0,
      statut: 'reserve',
      lastImport: {
        source: 'pdf_import',
        filename: req.file.originalname,
        timestamp: new Date().toISOString(),
        userId: req.user.id,
        agenceId: req.user.agenceId,
        originalData: resultat.informations
      }
    };

    // Note: Vous devrez importer et utiliser votre modèle Hotel ici
    // const Hotel = require('../models/hotelModel');
    // const hotel = await Hotel.create(hotelData);

    res.status(201).json({
      success: true,
      message: 'Voucher hôtel importé avec succès',
      data: {
        ...resultat,
        hotelData: hotelData
      }
    });
  } catch (error) {
    console.error('Erreur import PDF hôtel:', error);
    res.status(500).json({ message: 'Erreur lors de l\'import PDF', error: error.message });
  }
});

module.exports = router; 