const asyncHandler = require('express-async-handler');
const PreFacture = require('../models/preFactureModel');
const Client = require('../models/clientModel');
const Facture = require('../models/factureModel');
const PDFService = require('../services/pdfService');
const Agence = require('../models/agenceModel');

// @desc    Get all devis
// @route   GET /api/pre-factures
// @access  Private
const getPreFactures = asyncHandler(async (req, res) => {
  let query = {};
  
  // Filtrer par agence si l'utilisateur n'est pas superadmin
  if (req.user.role !== 'superadmin') {
    query.agenceId = req.user.agenceId;
  }

  const preFactures = await PreFacture.find(query)
    .populate('clientId', 'nom prenom entreprise email telephone')
    .sort({ dateCreation: -1 });
  
  res.json({
    success: true,
    data: preFactures
  });
});

// @desc    Get devis by ID
// @route   GET /api/pre-factures/:id
// @access  Private
const getPreFactureById = asyncHandler(async (req, res) => {
  const preFacture = await PreFacture.findById(req.params.id)
    .populate('clientId', 'nom prenom entreprise email telephone');
  
  if (preFacture) {
    res.json({
      success: true,
      data: preFacture
    });
  } else {
    res.status(404);
    throw new Error('Devis non trouvé');
  }
});

// @desc    Create new devis
// @route   POST /api/pre-factures
// @access  Private
const createPreFacture = asyncHandler(async (req, res) => {
  const { 
    clientId, 
    dateCreation, 
    articles, 
    montantHT, 
    montantTTC, 
    tva, 
    statut, 
    notes 
  } = req.body;

  // Vérifier que l'utilisateur a une agenceId
  if (!req.user.agenceId) {
    res.status(400);
    throw new Error('Utilisateur non associé à une agence');
  }

  // Generate unique devis number for this agency
  const agenceId = req.user.agenceId;
  const currentYear = new Date().getFullYear();
  
  // Find the highest number for this specific agency and year
  const lastPreFacture = await PreFacture.findOne({
    agenceId: agenceId,
    numero: { $regex: `^BC-${currentYear}` }
  }).sort({ numero: -1 });
  
  let nextNumber = 1;
  if (lastPreFacture) {
    // Extract number from format BC-YYYYMMDD-XXX
    const parts = lastPreFacture.numero.split('-');
    if (parts.length >= 3) {
      const lastNumber = parseInt(parts[2]);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
  }
  
  // Generate numero in format BC-YYYYMMDD-XXX
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const numero = `BC-${year}${month}${day}-${String(nextNumber).padStart(3, '0')}`;

  const preFacture = await PreFacture.create({
    numero,
    clientId,
    dateCreation: dateCreation || new Date(),
    articles,
    montantHT,
    montantTTC,
    tva: tva || 0,
    statut: statut || 'brouillon',
    notes: notes || '',
    agenceId: req.user.agenceId
  });

  if (preFacture) {
    // Populate client information
    const preFactureWithClient = await PreFacture.findById(preFacture._id)
      .populate('clientId', 'nom prenom entreprise email telephone');
    
    res.status(201).json({
      success: true,
      data: preFactureWithClient
    });
  } else {
    res.status(400);
    throw new Error('Données invalides');
  }
});

// @desc    Update devis
// @route   PUT /api/pre-factures/:id
// @access  Private
const updatePreFacture = asyncHandler(async (req, res) => {
  const preFacture = await PreFacture.findById(req.params.id);

  if (preFacture) {
    preFacture.numero = req.body.numero || preFacture.numero;
    preFacture.clientId = req.body.clientId || preFacture.clientId;
    preFacture.articles = req.body.articles || preFacture.articles;
    preFacture.montantHT = req.body.montantHT || preFacture.montantHT;
    preFacture.montantTTC = req.body.montantTTC || preFacture.montantTTC;
    preFacture.tva = req.body.tva || preFacture.tva;
    preFacture.statut = req.body.statut || preFacture.statut;
    preFacture.notes = req.body.notes || preFacture.notes;

    const updatedPreFacture = await preFacture.save();
    res.json(updatedPreFacture);
  } else {
    res.status(404);
    throw new Error('Devis non trouvé');
  }
});

// @desc    Delete devis
// @route   DELETE /api/pre-factures/:id
// @access  Private
const deletePreFacture = asyncHandler(async (req, res) => {
  const preFacture = await PreFacture.findById(req.params.id);

  if (preFacture) {
    await preFacture.remove();
    res.json({ message: 'Devis supprimé' });
  } else {
    res.status(404);
    throw new Error('Devis non trouvé');
  }
});

// @desc    Convert devis to facture
// @route   POST /api/pre-factures/:id/convert
// @access  Private
const convertPreFactureToFacture = asyncHandler(async (req, res) => {
  const preFacture = await PreFacture.findById(req.params.id);
  
  if (preFacture) {
    if (preFacture.statut !== 'accepte') {
      return res.status(400).json({
        success: false,
        message: 'Le devis doit être accepté pour être converti en facture'
      });
    }
    
    // Update devis status
    preFacture.statut = 'facture';
    await preFacture.save();
    
    // Generate unique facture number for this agency
    const agenceId = preFacture.agenceId;
    const currentYear = new Date().getFullYear();
    
    // Find the highest number for this agency and year
    const lastFacture = await Facture.findOne({
      agenceId: agenceId,
      numero: { $regex: `^FAC-${currentYear}-` }
    }).sort({ numero: -1 });
    
    let nextNumber = 1;
    if (lastFacture) {
      const lastNumber = parseInt(lastFacture.numero.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    const factureNumero = `FAC-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
    
    // Set due date to 30 days from now
    const dateEmission = new Date();
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + 30);
    
    // Create new facture
    const facture = await Facture.create({
      numero: factureNumero,
      clientId: preFacture.clientId,
      dateEmission,
      dateEcheance,
      statut: 'envoyee',
      montantHT: preFacture.montantHT,
      montantTTC: preFacture.montantTTC,
      tva: preFacture.tva || 0,
      articles: preFacture.articles,
      agenceId: preFacture.agenceId,
      notes: preFacture.notes
    });
    
    const client = await Client.findById(preFacture.clientId);
    
    const factureWithClient = {
      id: facture._id,
      numero: facture.numero,
      clientId: client._id,
      dateEmission: facture.dateEmission,
      dateEcheance: facture.dateEcheance,
      statut: facture.statut,
      montantHT: facture.montantHT,
      montantTTC: facture.montantTTC,
      tva: facture.tva,
      articles: facture.articles,
      notes: facture.notes,
      client: {
        id: client._id,
        nom: client.nom,
        prenom: client.prenom,
        entreprise: client.entreprise,
        email: client.email
      }
    };
    
    res.status(201).json({
      success: true,
      message: 'Devis converti en facture avec succès',
      data: factureWithClient
    });
  } else {
    res.status(404);
    throw new Error('Devis non trouvé');
  }
});

// @desc    Send devis
// @route   PUT /api/pre-factures/:id/send
// @access  Private
const sendPreFacture = asyncHandler(async (req, res) => {
  const preFacture = await PreFacture.findById(req.params.id);
  
  if (preFacture) {
    preFacture.statut = 'envoye';
    const updatedPreFacture = await preFacture.save();
    
    res.json({
      success: true,
      message: 'Devis envoyé avec succès',
      data: updatedPreFacture
    });
  } else {
    res.status(404);
    throw new Error('Devis non trouvé');
  }
});

// @desc    Accept devis
// @route   PUT /api/pre-factures/:id/accept
// @access  Private
const acceptPreFacture = asyncHandler(async (req, res) => {
  const preFacture = await PreFacture.findById(req.params.id);
  
  if (preFacture) {
    preFacture.statut = 'accepte';
    const updatedPreFacture = await preFacture.save();
    
    res.json({
      success: true,
      message: 'Devis accepté avec succès',
      data: updatedPreFacture
    });
  } else {
    res.status(404);
    throw new Error('Devis non trouvé');
  }
});

// @desc    Reject devis
// @route   PUT /api/pre-factures/:id/reject
// @access  Private
const rejectPreFacture = asyncHandler(async (req, res) => {
  const preFacture = await PreFacture.findById(req.params.id);
  
  if (preFacture) {
    preFacture.statut = 'refuse';
    const updatedPreFacture = await preFacture.save();
    
    res.json({
      success: true,
      message: 'Devis refusé avec succès',
      data: updatedPreFacture
    });
  } else {
    res.status(404);
    throw new Error('Devis non trouvé');
  }
});

// Générer le PDF du devis (devis)
const generatePreFacturePDF = asyncHandler(async (req, res) => {
  const preFacture = await PreFacture.findById(req.params.id)
    .populate('clientId', 'nom prenom entreprise email telephone adresse')
    .lean();
  if (!preFacture) {
    return res.status(404).json({ success: false, message: 'Devis non trouvé' });
  }
  // Récupérer l'agence
  const agence = await Agence.findById(preFacture.agenceId).lean();
  if (!agence) {
    return res.status(404).json({ success: false, message: 'Agence non trouvée' });
  }
  // Mettre à jour le statut si brouillon
  if (preFacture.statut === 'brouillon') {
    await PreFacture.findByIdAndUpdate(preFacture._id, { statut: 'envoye' });
    preFacture.statut = 'envoye';
  }
  // Générer le PDF
  const pdfBuffer = await PDFService.generatePreFacturePDF(preFacture, preFacture.clientId, preFacture.agenceId);
  console.log('📤 Envoi du PDF au frontend, taille buffer:', pdfBuffer.length, 'bytes');
  
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Length': pdfBuffer.length,
    'Content-Disposition': `inline; filename="devis-${preFacture.numero || preFacture._id}.pdf"`,
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.send(pdfBuffer);
  console.log('✅ PDF envoyé avec succès');
});

module.exports = {
  getPreFactures,
  getPreFactureById,
  createPreFacture,
  updatePreFacture,
  deletePreFacture,
  convertPreFactureToFacture,
  sendPreFacture,
  acceptPreFacture,
  rejectPreFacture,
  generatePreFacturePDF
};