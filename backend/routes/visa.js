const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const visaController = require('../controllers/visaController');
const { protect, agent, hasPermission } = require('../middlewares/authMiddleware');
const { analyserVisaIA, extractTextFromPDF } = require('../services/iaService');

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
    cb(null, `visa-${Date.now()}-${file.originalname}`);
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

// Routes pour les visas
router.get('/', protect, agent, visaController.getAllVisas);
router.get('/non-factures', protect, agent, visaController.getNonFactures);
router.get('/:id', protect, agent, visaController.getVisaById);
router.post('/', protect, agent, visaController.createVisa);
router.put('/:id', protect, agent, visaController.updateVisa);
router.delete('/:id', protect, agent, visaController.deleteVisa);

// Endpoint pour l'analyse IA d'une demande de visa
router.post('/ia-analyse-visa', protect, hasPermission('visa', 'creer'), async (req, res) => {
  try {
    const { texte } = req.body;
    if (!texte) {
      return res.status(400).json({ message: 'Texte requis pour l\'analyse' });
    }

    const resultat = await analyserVisaIA(texte);
    if (!resultat || !resultat.informations) {
      return res.status(400).json({ message: 'Impossible d\'extraire les informations de la demande de visa' });
    }

    // Calcul automatique du prix total
    const frais_consulaires = Number(resultat.informations.frais_consulaires) || 0;
    const frais_service = Number(resultat.informations.frais_service) || 0;
    if (frais_consulaires > 0 || frais_service > 0) {
      resultat.informations.prix_total = frais_consulaires + frais_service;
    }

    // Calcul automatique de la durée de séjour si dates fournies
    if (resultat.informations.date_voyage_prevue && resultat.informations.date_retour_prevue) {
      const dateVoyage = new Date(resultat.informations.date_voyage_prevue);
      const dateRetour = new Date(resultat.informations.date_retour_prevue);
      const diffTime = Math.abs(dateRetour - dateVoyage);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      resultat.informations.duree_sejour = `${diffDays} jours`;
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
    console.error('Erreur analyse IA visa:', error);
    res.status(500).json({ message: 'Erreur lors de l\'analyse IA' });
  }
});

// Endpoint pour extraire le texte d'un PDF de demande de visa
router.post('/extract-pdf-text', protect, hasPermission('visa', 'creer'), upload.single('pdf'), async (req, res) => {
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
    console.error('Erreur extraction PDF visa:', error);
    res.status(500).json({ message: 'Erreur lors de l\'extraction du texte PDF', error: error.message });
  }
});

// Import d'une demande de visa depuis un PDF (création automatique)
router.post('/import-pdf', protect, hasPermission('visa', 'creer'), upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier PDF fourni' });
    }

    const pdfPath = req.file.path;
    const text = await extractTextFromPDF(pdfPath);
    
    // Supprimer le fichier temporaire
    fs.unlinkSync(pdfPath);

    // Analyse IA
    const resultat = await analyserVisaIA(text);
    if (!resultat || !resultat.informations) {
      return res.status(400).json({ message: 'Impossible d\'extraire les informations de la demande de visa' });
    }

    // Calculs automatiques
    const frais_consulaires = Number(resultat.informations.frais_consulaires) || 0;
    const frais_service = Number(resultat.informations.frais_service) || 0;
    resultat.informations.prix_total = frais_consulaires + frais_service;

    // Calcul durée séjour
    if (resultat.informations.date_voyage_prevue && resultat.informations.date_retour_prevue) {
      const dateVoyage = new Date(resultat.informations.date_voyage_prevue);
      const dateRetour = new Date(resultat.informations.date_retour_prevue);
      const diffTime = Math.abs(dateRetour - dateVoyage);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      resultat.informations.duree_sejour = `${diffDays} jours`;
    }

    // Création de la demande de visa
    const agenceId = req.user?.agenceId;
    if (!agenceId) {
      return res.status(400).json({ message: 'ID d\'agence manquant' });
    }

    const visaData = {
      agenceId: agenceId,
      clientId: null, // À définir par l'utilisateur
      numeroVisa: resultat.informations.numero_visa || '',
      numeroDossier: resultat.informations.numero_dossier || '',
      typeVisa: resultat.informations.type_visa || '',
      paysDestination: resultat.informations.pays_destination || '',
      dateDepot: resultat.informations.date_depot || '',
      prix: resultat.informations.prix_total || 0,
      statut: resultat.informations.statut === 'en_cours' ? 'en_cours' : 'en_attente',
      lastImport: {
        source: 'pdf_import',
        filename: req.file.originalname,
        timestamp: new Date().toISOString(),
        userId: req.user.id,
        agenceId: req.user.agenceId,
        originalData: resultat.informations
      }
    };

    // Note: Vous devrez importer et utiliser votre modèle Visa ici
    // const Visa = require('../models/visaModel');
    // const visa = await Visa.create(visaData);

    res.status(201).json({
      success: true,
      message: 'Demande de visa importée avec succès',
      data: {
        ...resultat,
        visaData: visaData
      }
    });
  } catch (error) {
    console.error('Erreur import PDF visa:', error);
    res.status(500).json({ message: 'Erreur lors de l\'import PDF', error: error.message });
  }
});

module.exports = router; 