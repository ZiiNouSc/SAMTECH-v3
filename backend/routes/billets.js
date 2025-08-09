const express = require('express');
const router = express.Router();
const { 
  getBillets, 
  getBilletById, 
  createBillet, 
  updateBillet, 
  deleteBillet,
  importBilletsFromGmail,
  iaAnalyseBillet,
  findIataInfoController,
  getBilletsNonFactures
} = require('../controllers/billetController');
const { protect, hasPermission } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware'); // Added for PDF upload
const { extractTextFromPDF, analyserBilletIA } = require('../services/iaService'); // Added for PDF extraction and IA analysis
const fs = require('fs'); // Added for file deletion
const BilletAvion = require('../models/billetModel');
const Agence = require('../models/agenceModel');

// Importer la fonction utilitaire findIataInfo
const { findIataInfo } = require('../controllers/billetController');

// Charger la liste IATA une seule fois
const path = require('path');
const IATA_PATH = path.join(__dirname, '../services/iata_compagnies.json');
let IATA_LIST = [];
try {
  IATA_LIST = JSON.parse(fs.readFileSync(IATA_PATH, 'utf-8'));
} catch (e) {
  IATA_LIST = [];
}

// Get all billets
router.get('/', protect, getBillets);

// Get billets non facturés
router.get('/non-factures', protect, getBilletsNonFactures);

// Get billet by ID
router.get('/:id', protect, getBilletById);

// Create new billet
router.post('/', protect, createBillet);

// Update billet
router.put('/:id', protect, updateBillet);

// Delete billet
router.delete('/:id', protect, deleteBillet);

// Import billets from Gmail
router.post('/import-gmail', protect, hasPermission('billets', 'creer'), importBilletsFromGmail);

// Analyse IA d'un document de voyage
router.post('/ia-analyse', protect, hasPermission('billets', 'creer'), iaAnalyseBillet);

// Endpoint pour trouver les informations IATA d'une compagnie
router.post('/find-iata-info', protect, findIataInfoController);

// Endpoint pour la recherche de compagnie avec autocomplétion (basé sur iata_compagnies.json)
router.post('/search-company', protect, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.length < 2) {
      return res.json({ companies: [] });
    }
    // Filtrer sur le nom ou le code IATA (insensible à la casse)
    const filtered = IATA_LIST.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.id.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 15); // Limiter à 15 résultats

    // Adapter le format pour le frontend
    const companies = filtered.map(item => ({
      name: item.name,
      code: item.id,
      logo: item.logo
    }));

    res.json({ companies });
  } catch (error) {
    console.error('Erreur recherche compagnie:', error);
    res.status(500).json({ message: 'Erreur lors de la recherche de compagnie' });
  }
});

// Endpoint pour extraire le texte d'un PDF
router.post('/extract-pdf-text', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier PDF fourni' });
    }

    const pdfPath = req.file.path;
    const text = await extractTextFromPDF(pdfPath);
    
    // Supprimer le fichier temporaire
    fs.unlinkSync(pdfPath);
    
    res.json({ text });
  } catch (error) {
    console.error('Erreur extraction PDF:', error);
    res.status(500).json({ message: 'Erreur lors de l\'extraction du texte PDF' });
  }
});

// Endpoint pour l'analyse IA d'un billet (pré-remplissage avec mapping IATA et calcul taxes)
router.post('/ia-analyse-billet', protect, async (req, res) => {
  try {
    const { texte } = req.body;
    if (!texte) {
      return res.status(400).json({ message: 'Texte requis pour l\'analyse' });
    }
    const resultat = await analyserBilletIA(texte);
    if (!resultat || !resultat.informations) {
      return res.status(400).json({ message: 'Impossible d\'extraire les informations du billet' });
    }
    // Mapping IATA
    let compagnieIA = resultat.informations.compagnie_aerienne || '';
    let iataInfo = findIataInfo(compagnieIA, '');
    if (iataInfo) {
      resultat.informations.compagnie_aerienne = iataInfo.name;
      resultat.informations.code_compagnie = iataInfo.id;
      resultat.logo_compagnie = iataInfo.logo;
    }
    // Calcul automatique des taxes
    const prix_ht = Number(resultat.informations.prix_ht) || 0;
    const prix_ttc = Number(resultat.informations.prix_ttc) || 0;
    if (prix_ht > 0 && prix_ttc > 0) {
      resultat.informations.taxes = prix_ttc - prix_ht;
    } else {
      resultat.informations.taxes = 0;
    }
    res.json(resultat);
  } catch (error) {
    console.error('Erreur analyse IA:', error);
    res.status(500).json({ message: 'Erreur lors de l\'analyse IA' });
  }
});

// Import d'un billet depuis un PDF (création automatique)
router.post('/import-pdf', protect, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier PDF fourni' });
    }
    const pdfPath = req.file.path;
    const text = await extractTextFromPDF(pdfPath);
    // Supprimer le fichier temporaire
    fs.unlinkSync(pdfPath);
    // Analyse IA
    const resultat = await analyserBilletIA(text);
    if (!resultat || !resultat.informations) {
      return res.status(400).json({ message: 'Impossible d\'extraire les informations du billet' });
    }
    // Mapping IATA
    let compagnieIA = resultat.informations.compagnie_aerienne || '';
    let iataInfo = findIataInfo(compagnieIA, '');
    if (iataInfo) {
      resultat.informations.compagnie_aerienne = iataInfo.name;
      resultat.informations.code_compagnie = iataInfo.id;
      resultat.logo_compagnie = iataInfo.logo;
    }
    // Calcul automatique des taxes
    const prix_ht = Number(resultat.informations.prix_ht) || 0;
    const prix_ttc = Number(resultat.informations.prix_ttc) || 0;
    if (prix_ht > 0 && prix_ttc > 0) {
      resultat.informations.taxes = prix_ttc - prix_ht;
    } else {
      resultat.informations.taxes = 0;
    }
    // Création du billet
    const agenceId = req.user?.agenceId;
    if (!agenceId) {
      return res.status(400).json({ message: 'ID d\'agence manquant' });
    }
    const billet = await BilletAvion.create({
      logo_compagnie: resultat.logo_compagnie || '',
      agenceId: agenceId,
      fournisseurId: null,
      informations: resultat.informations,
      sourceFile: null
    });
    res.status(201).json({
      success: true,
      message: 'Billet importé et créé avec succès',
      data: billet
    });
  } catch (error) {
    console.error('Erreur import PDF:', error);
    res.status(500).json({ message: 'Erreur lors de l\'import PDF', error: error.message });
  }
});

module.exports = router;