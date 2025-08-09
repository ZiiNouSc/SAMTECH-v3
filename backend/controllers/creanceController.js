const asyncHandler = require('express-async-handler');
const Facture = require('../models/factureModel');
const Client = require('../models/clientModel');

// @desc    Get all creances (unpaid invoices, même partiellement payées)
// @route   GET /api/creances
// @access  Private
const getCreances = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: "ID d'agence manquant"
    });
  }

  // Récupérer toutes les factures de l'agence dont la date d'échéance est dépassée
  const factures = await Facture.find({
    agenceId,
    dateEcheance: { $lt: new Date() }
  })
    .populate('clientId');

  // Calculer le reste à payer pour chaque facture
  const creancesWithClients = factures
    .map(facture => {
      const totalRegle = (facture.reglements || []).reduce((sum, r) => sum + r.montant, 0);
      const resteAPayer = (facture.montantTTC || 0) - totalRegle;
      return { ...facture.toObject(), resteAPayer };
    })
    .filter(facture => facture.resteAPayer > 0)
    .map(facture => {
      const client = facture.clientId;
      return {
        id: facture._id,
        numero: facture.numero,
        clientId: client._id,
        dateEmission: facture.dateEmission,
        dateEcheance: facture.dateEcheance,
        statut: facture.statut,
        montantHT: facture.montantHT,
        montantTTC: facture.montantTTC,
        articles: facture.articles,
        reglements: facture.reglements,
        resteAPayer: facture.resteAPayer,
        client: {
          id: client._id,
          nom: client.nom,
          prenom: client.prenom,
          entreprise: client.entreprise,
          email: client.email,
          telephone: client.telephone
        }
      };
    });

  res.status(200).json({
    success: true,
    data: creancesWithClients
  });
});

// @desc    Send reminder for a creance
// @route   POST /api/creances/:id/reminder
// @access  Private
const sendReminder = asyncHandler(async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message de relance manquant'
    });
  }
  
  const facture = await Facture.findById(req.params.id);
  
  if (facture) {
    // In a real app, this would send an email or SMS
    // For now, we'll just update the facture to indicate a reminder was sent
    facture.lastReminder = Date.now();
    await facture.save();
    
    res.status(200).json({
      success: true,
      message: 'Relance envoyée avec succès'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Facture non trouvée'
    });
  }
});

// @desc    Get creance statistics
// @route   GET /api/creances/stats
// @access  Private
const getCreanceStats = asyncHandler(async (req, res) => {
  // In a real app, filter by agency ID from authenticated user
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const factures = await Facture.find({ 
    agenceId,
    $or: [
      { statut: 'en_retard' },
      { 
        statut: 'envoyee', 
        dateEcheance: { $lt: new Date() } 
      }
    ]
  });
  
  const totalCreances = factures.reduce((sum, f) => sum + f.montantTTC, 0);
  const totalFactures = factures.length;
  
  // Calculate average days late
  let totalDaysLate = 0;
  factures.forEach(facture => {
    const echeance = new Date(facture.dateEcheance);
    const today = new Date();
    const diffTime = today - echeance;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    totalDaysLate += diffDays > 0 ? diffDays : 0;
  });
  
  const avgDaysLate = totalFactures > 0 ? Math.round(totalDaysLate / totalFactures) : 0;
  
  res.status(200).json({
    success: true,
    data: {
      totalCreances,
      totalFactures,
      avgDaysLate
    }
  });
});

module.exports = {
  getCreances,
  sendReminder,
  getCreanceStats
};