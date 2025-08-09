const asyncHandler = require('express-async-handler');
const Agence = require('../models/agenceModel');
const Client = require('../models/clientModel');
const Facture = require('../models/factureModel');
const PreFacture = require('../models/preFactureModel');
const Operation = require('../models/operationModel');
const Reservation = require('../models/reservationModel');

// @desc    Get financial report
// @route   GET /api/rapports/financier
// @access  Private/Agency
const getFinancialReport = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate) : new Date();
  
  // Get factures
  const factures = await Facture.find({
    agenceId,
    dateEmission: { $gte: start, $lte: end }
  });
  
  // Get operations
  const operations = await Operation.find({
    agenceId,
    date: { $gte: start, $lte: end }
  });
  
  // Calculate totals
  const chiffreAffaire = factures.reduce((sum, f) => sum + f.montantTTC, 0);
  const facturesImpayees = factures.filter(f => f.statut === 'en_retard').length;
  const montantImpaye = factures
    .filter(f => f.statut === 'en_retard')
    .reduce((sum, f) => sum + f.montantTTC, 0);
  
  const entrees = operations
    .filter(op => op.type === 'entree')
    .reduce((sum, op) => sum + op.montant, 0);
  
  const sorties = operations
    .filter(op => op.type === 'sortie')
    .reduce((sum, op) => sum + op.montant, 0);
  
  const soldeCaisse = entrees - sorties;
  
  // Monthly breakdown
  const monthlyData = [];
  for (let i = 0; i < 12; i++) {
    const monthStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);
    
    const monthFactures = factures.filter(f => 
      f.dateEmission >= monthStart && f.dateEmission <= monthEnd
    );
    
    const monthCA = monthFactures.reduce((sum, f) => sum + f.montantTTC, 0);
    
    monthlyData.push({
      month: monthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      chiffreAffaire: monthCA,
      facturesCount: monthFactures.length
    });
  }
  
  res.status(200).json({
    success: true,
    data: {
      periode: {
        debut: start,
        fin: end
      },
      chiffreAffaire,
      facturesImpayees,
      montantImpaye,
      entrees,
      sorties,
      soldeCaisse,
      monthlyData
    }
  });
});

// @desc    Get clients report
// @route   GET /api/rapports/clients
// @access  Private/Agency
const getClientsReport = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const clients = await Client.find({ agenceId });
  const factures = await Facture.find({ agenceId }).populate('clientId');
  
  // Top clients by revenue
  const clientRevenue = {};
  factures.forEach(facture => {
    const clientId = facture.clientId._id.toString();
    if (!clientRevenue[clientId]) {
      clientRevenue[clientId] = {
        client: facture.clientId,
        totalRevenue: 0,
        facturesCount: 0
      };
    }
    clientRevenue[clientId].totalRevenue += facture.montantTTC;
    clientRevenue[clientId].facturesCount += 1;
  });
  
  const topClients = Object.values(clientRevenue)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);
  
  // Client statistics
  const totalClients = clients.length;
  const clientsWithFactures = Object.keys(clientRevenue).length;
  const averageRevenue = totalClients > 0 ? 
    Object.values(clientRevenue).reduce((sum, c) => sum + c.totalRevenue, 0) / totalClients : 0;
  
  res.status(200).json({
    success: true,
    data: {
      totalClients,
      clientsWithFactures,
      averageRevenue,
      topClients
    }
  });
});

// @desc    Get reservations report
// @route   GET /api/rapports/reservations
// @access  Private/Agency
const getReservationsReport = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate) : new Date();
  
  const reservations = await Reservation.find({
    agenceId,
    dateCreation: { $gte: start, $lte: end }
  });
  
  // Statistics by type
  const byType = {};
  reservations.forEach(reservation => {
    if (!byType[reservation.type]) {
      byType[reservation.type] = {
        count: 0,
        totalAmount: 0
      };
    }
    byType[reservation.type].count += 1;
    byType[reservation.type].totalAmount += reservation.montant;
  });
  
  // Statistics by status
  const byStatus = {};
  reservations.forEach(reservation => {
    if (!byStatus[reservation.statut]) {
      byStatus[reservation.statut] = {
        count: 0,
        totalAmount: 0
      };
    }
    byStatus[reservation.statut].count += 1;
    byStatus[reservation.statut].totalAmount += reservation.montant;
  });
  
  const totalReservations = reservations.length;
  const totalAmount = reservations.reduce((sum, r) => sum + r.montant, 0);
  const averageAmount = totalReservations > 0 ? totalAmount / totalReservations : 0;
  
  res.status(200).json({
    success: true,
    data: {
      periode: {
        debut: start,
        fin: end
      },
      totalReservations,
      totalAmount,
      averageAmount,
      byType,
      byStatus
    }
  });
});

// @desc    Get activity report
// @route   GET /api/rapports/activite
// @access  Private/Agency
const getActivityReport = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Get recent activities
  const factures = await Facture.find({
    agenceId,
    dateEmission: { $gte: startDate }
  }).sort({ dateEmission: -1 });
  
  const bonsCommande = await PreFacture.find({
    agenceId,
    dateCreation: { $gte: startDate }
  }).sort({ dateCreation: -1 });
  
  const reservations = await Reservation.find({
    agenceId,
    dateCreation: { $gte: startDate }
  }).sort({ dateCreation: -1 });
  
  // Combine and sort activities
  const activities = [
    ...factures.map(f => ({
      type: 'facture',
      id: f._id,
      description: `Facture #${f.numero}`,
      date: f.dateEmission,
      montant: f.montantTTC,
      statut: f.statut
    })),
    ...bonsCommande.map(bc => ({
      type: 'bon_commande',
      id: bc._id,
      description: `Bon de commande #${bc.numero}`,
      date: bc.dateCreation,
      montant: bc.montantTTC,
      statut: bc.statut
    })),
    ...reservations.map(r => ({
      type: 'reservation',
      id: r._id,
      description: `Réservation #${r.numero}`,
      date: r.dateCreation,
      montant: r.montant,
      statut: r.statut
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.status(200).json({
    success: true,
    data: {
      periode: {
        debut: startDate,
        fin: new Date()
      },
      activities,
      summary: {
        factures: factures.length,
        bonsCommande: bonsCommande.length,
        reservations: reservations.length,
        total: activities.length
      }
    }
  });
});

module.exports = {
  getFinancialReport,
  getClientsReport,
  getReservationsReport,
  getActivityReport
}; 