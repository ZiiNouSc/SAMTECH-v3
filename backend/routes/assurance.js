const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const assuranceController = require('../controllers/assuranceController');
const { protect, agent, hasPermission } = require('../middlewares/authMiddleware');
const { analyserAssuranceIA, extractTextFromPDF } = require('../services/iaService');

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
    cb(null, `assurance-${Date.now()}-${file.originalname}`);
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

// Routes CRUD pour les assurances
router.get('/', protect, agent, assuranceController.getAllAssurances);
router.get('/non-factures', protect, agent, assuranceController.getNonFactures);
router.get('/:id', protect, agent, assuranceController.getAssuranceById);
router.post('/', protect, agent, assuranceController.createAssurance);
router.put('/:id', protect, agent, assuranceController.updateAssurance);
router.delete('/:id', protect, agent, assuranceController.deleteAssurance);

// Endpoint pour l'analyse IA d'une police d'assurance
router.post('/ia-analyse-assurance', protect, hasPermission('assurance', 'creer'), async (req, res) => {
  try {
    const { texte } = req.body;
    if (!texte) {
      return res.status(400).json({ message: 'Texte requis pour l\'analyse' });
    }

    const resultat = await analyserAssuranceIA(texte);
    if (!resultat || !resultat.informations) {
      return res.status(400).json({ message: 'Impossible d\'extraire les informations de l\'assurance' });
    }

    // Calcul automatique des taxes si prime HT et TTC sont fournies
    const prime_ht = Number(resultat.informations.prime_ht) || 0;
    const prime_ttc = Number(resultat.informations.prime_ttc) || 0;
    if (prime_ht > 0 && prime_ttc > 0) {
      resultat.informations.taxes = prime_ttc - prime_ht;
    } else {
      resultat.informations.taxes = 0;
    }

    // Calcul automatique de la durée de couverture si dates fournies
    if (resultat.informations.date_debut && resultat.informations.date_fin) {
      const dateDebut = new Date(resultat.informations.date_debut);
      const dateFin = new Date(resultat.informations.date_fin);
      const diffTime = Math.abs(dateFin - dateDebut);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      resultat.informations.duree_couverture = `${diffDays} jours`;
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
    console.error('Erreur analyse IA assurance:', error);
    res.status(500).json({ message: 'Erreur lors de l\'analyse IA' });
  }
});

// Endpoint pour extraire le texte d'un PDF d'assurance
router.post('/extract-pdf-text', protect, hasPermission('assurance', 'creer'), upload.single('pdf'), async (req, res) => {
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
    console.error('Erreur extraction PDF assurance:', error);
    res.status(500).json({ message: 'Erreur lors de l\'extraction du texte PDF', error: error.message });
  }
});

// Import d'une police d'assurance depuis un PDF (création automatique)
router.post('/import-pdf', protect, hasPermission('assurance', 'creer'), upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier PDF fourni' });
    }

    const pdfPath = req.file.path;
    const text = await extractTextFromPDF(pdfPath);
    
    // Supprimer le fichier temporaire
    fs.unlinkSync(pdfPath);

    // Analyse IA
    const resultat = await analyserAssuranceIA(text);
    if (!resultat || !resultat.informations) {
      return res.status(400).json({ message: 'Impossible d\'extraire les informations de l\'assurance' });
    }

    // Calculs automatiques
    const prime_ht = Number(resultat.informations.prime_ht) || 0;
    const prime_ttc = Number(resultat.informations.prime_ttc) || 0;
    if (prime_ht > 0 && prime_ttc > 0) {
      resultat.informations.taxes = prime_ttc - prime_ht;
    }

    // Calcul durée couverture
    if (resultat.informations.date_debut && resultat.informations.date_fin) {
      const dateDebut = new Date(resultat.informations.date_debut);
      const dateFin = new Date(resultat.informations.date_fin);
      const diffTime = Math.abs(dateFin - dateDebut);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      resultat.informations.duree_couverture = `${diffDays} jours`;
    }

    // Création de l'assurance
    const agenceId = req.user?.agenceId;
    if (!agenceId) {
      return res.status(400).json({ message: 'ID d\'agence manquant' });
    }

    const assuranceData = {
      agenceId: agenceId,
      clientId: null, // À définir par l'utilisateur
      numeroPolice: resultat.informations.numero_police || '',
      typeAssurance: resultat.informations.type_assurance || '',
      dateDebut: resultat.informations.date_debut || '',
      dateFin: resultat.informations.date_fin || '',
      prix: prime_ttc || 0,
      statut: resultat.informations.statut === 'active' ? 'validee' : 'inactive',
      lastImport: {
        source: 'pdf_import',
        filename: req.file.originalname,
        timestamp: new Date().toISOString(),
        userId: req.user.id,
        agenceId: req.user.agenceId,
        originalData: resultat.informations
      }
    };

    // Note: Vous devrez importer et utiliser votre modèle Assurance ici
    // const Assurance = require('../models/assuranceModel');
    // const assurance = await Assurance.create(assuranceData);

    res.status(201).json({
      success: true,
      message: 'Police d\'assurance importée avec succès',
      data: {
        ...resultat,
        assuranceData: assuranceData
      }
    });
  } catch (error) {
    console.error('Erreur import PDF assurance:', error);
    res.status(500).json({ message: 'Erreur lors de l\'import PDF', error: error.message });
  }
});

module.exports = router; 