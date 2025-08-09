const asyncHandler = require('express-async-handler');
const Agence = require('../models/agenceModel');
const Client = require('../models/clientModel');
const Facture = require('../models/factureModel');
const Operation = require('../models/operationModel');
const PreFacture = require('../models/preFactureModel');
const Ticket = require('../models/ticketModel');
const Reservation = require('../models/reservationModel');
const Utilisateur = require('../models/userModel');
// const Notification = require('../models/notificationModel');

// @desc    Get general dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = asyncHandler(async (req, res) => {
  // In a real app, filter by agency ID from authenticated user
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const clients = await Client.find({ agenceId });
  const factures = await Facture.find({ agenceId });
  const operations = await Operation.find({ agenceId });
  const bonsCommande = await PreFacture.find({ agenceId });
  
  // Calculate stats
  const totalClients = clients.length;
  
  const facturesEnAttente = factures.filter(f => 
    f.statut === 'envoyee' || f.statut === 'en_retard'
  ).length;
  
  const now = new Date();
  const chiffreAffaireMois = factures
    .filter(f => {
      const factureDate = new Date(f.dateEmission);
      return factureDate.getMonth() === now.getMonth() && 
             factureDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, f) => sum + f.montantTTC, 0);
  
  const entrees = operations
    .filter(op => op.type === 'entree')
    .reduce((sum, op) => sum + op.montant, 0);
  
  const sorties = operations
    .filter(op => op.type === 'sortie')
    .reduce((sum, op) => sum + op.montant, 0);
  
  const soldeCaisse = entrees - sorties;
  
  const facturesImpayees = factures.filter(f => f.statut === 'en_retard').length;
  
  const bonCommandeEnCours = bonsCommande.filter(b => 
    b.statut !== 'facture' && b.statut !== 'refuse'
  ).length;
  
  // Recent activities
  const recentActivities = [
    ...factures.map(f => ({
      id: `facture-${f._id}`,
      type: 'facture',
      description: `Facture #${f.numero} créée`,
      montant: f.montantTTC,
      date: f.dateEmission
    })),
    ...operations.map(op => ({
      id: `operation-${op._id}`,
      type: op.type === 'entree' ? 'paiement' : 'depense',
      description: op.description,
      montant: op.montant,
      date: op.date
    })),
    ...bonsCommande.map(bc => ({
      id: `commande-${bc._id}`,
      type: 'commande',
      description: `Devis #${bc.numero} ${bc.statut}`,
      montant: bc.montantTTC,
      date: bc.dateCreation
    }))
  ]
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 10);
  
  res.status(200).json({
    success: true,
    data: {
      totalClients,
      facturesEnAttente,
      chiffreAffaireMois,
      soldeCaisse,
      facturesImpayees,
      bonCommandeEnCours,
      recentActivities
    }
  });
});

// @desc    Get superadmin dashboard stats
// @route   GET /api/dashboard/superadmin/stats
// @access  Private/Admin
const getSuperadminStats = asyncHandler(async (req, res) => {
  const agences = await Agence.find({});
  const tickets = await Ticket.find({}).populate('agenceId', 'nom email');
  
  // Calculate stats
  const totalAgences = agences.length;
  const agencesApprouvees = agences.filter(a => a.statut === 'approuve').length;
  const agencesEnAttente = agences.filter(a => a.statut === 'en_attente').length;
  const ticketsOuverts = tickets.filter(t => t.statut === 'ouvert').length;
  
  // Recent agencies
  const recentAgencies = agences
    .sort((a, b) => new Date(b.dateInscription) - new Date(a.dateInscription))
    .slice(0, 5);
  
  // Recent tickets with agency data attached
  const recentTickets = tickets
    .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
    .slice(0, 5)
    .map(ticket => {
      return {
        id: ticket._id,
        agenceId: ticket.agenceId._id,
        sujet: ticket.sujet,
        description: ticket.description,
        statut: ticket.statut,
        priorite: ticket.priorite,
        dateCreation: ticket.dateCreation,
        dateMAJ: ticket.dateMAJ,
        agence: {
          nom: ticket.agenceId.nom,
          email: ticket.agenceId.email
        }
      };
    });
  
  res.status(200).json({
    success: true,
    data: {
      totalAgences,
      agencesApprouvees,
      agencesEnAttente,
      ticketsOuverts,
      recentAgencies,
      recentTickets
    }
  });
});

// @desc    Get agence dashboard stats
// @route   GET /api/dashboard/agence/stats
// @access  Private/Agency
const getAgenceStats = asyncHandler(async (req, res) => {
  // In a real app, get agenceId from authenticated user
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const clients = await Client.find({ agenceId });
  const factures = await Facture.find({ agenceId });
  const operations = await Operation.find({ agenceId });
  const bonsCommande = await PreFacture.find({ agenceId });
  
  // Calculate stats
  const totalClients = clients.length;
  
  const facturesEnAttente = factures.filter(f => 
    f.statut === 'envoyee' || f.statut === 'en_retard'
  ).length;
  
  const now = new Date();
  const chiffreAffaireMois = factures
    .filter(f => {
      const factureDate = new Date(f.dateEmission);
      return factureDate.getMonth() === now.getMonth() && 
             factureDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, f) => sum + f.montantTTC, 0);
  
  const entrees = operations
    .filter(op => op.type === 'entree')
    .reduce((sum, op) => sum + op.montant, 0);
  
  const sorties = operations
    .filter(op => op.type === 'sortie')
    .reduce((sum, op) => sum + op.montant, 0);
  
  const soldeCaisse = entrees - sorties;
  
  // Recent activities
  const recentActivities = [
    ...factures.map(f => ({
      id: `facture-${f._id}`,
      type: 'facture',
      description: `Facture #${f.numero} créée`,
      montant: f.montantTTC,
      date: f.dateEmission
    })),
    ...operations.map(op => ({
      id: `operation-${op._id}`,
      type: op.type === 'entree' ? 'paiement' : 'depense',
      description: op.description,
      montant: op.montant,
      date: op.date
    })),
    ...bonsCommande.map(bc => ({
      id: `commande-${bc._id}`,
      type: 'commande',
      description: `Devis #${bc.numero} ${bc.statut}`,
      montant: bc.montantTTC,
      date: bc.dateCreation
    }))
  ]
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 10);
  
  res.status(200).json({
    success: true,
    data: {
      totalClients,
      facturesEnAttente,
      chiffreAffaireMois,
      soldeCaisse,
      recentActivities
    }
  });
});

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private/Agency
const getDashboardOverview = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { period = 'month' } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  // Get data for the period
  const factures = await Facture.find({
    agenceId,
    dateEmission: { $gte: startDate, $lte: now }
  });
  
  const bonsCommande = await PreFacture.find({
    agenceId,
    dateCreation: { $gte: startDate, $lte: now }
  });
  
  const reservations = await Reservation.find({
    agenceId,
    dateCreation: { $gte: startDate, $lte: now }
  });
  
  const operations = await Operation.find({
    agenceId,
    date: { $gte: startDate, $lte: now }
  });
  
  // Calculate metrics
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
  
  // Get counts
  const totalClients = await Client.countDocuments({ agenceId });
  const totalUtilisateurs = await Utilisateur.countDocuments({ agenceId });
  // const notificationsNonLues = await Notification.countDocuments({ 
  //   agenceId, 
  //   statut: 'en_attente' 
  // });
  
  res.status(200).json({
    success: true,
    data: {
      periode: {
        debut: startDate,
        fin: now,
        type: period
      },
      chiffreAffaire,
      facturesImpayees,
      montantImpaye,
      entrees,
      sorties,
      soldeCaisse,
      totalClients,
      totalUtilisateurs,
      // notificationsNonLues,
      factures: factures.length,
      bonsCommande: bonsCommande.length,
      reservations: reservations.length
    }
  });
});

// @desc    Get recent activities
// @route   GET /api/dashboard/activities
// @access  Private/Agency
const getRecentActivities = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { limit = 10 } = req.query;
  
  // Get recent factures
  const factures = await Facture.find({ agenceId })
    .populate('clientId', 'nom prenom')
    .sort({ dateEmission: -1 })
    .limit(limit);
  
  // Get recent bons de commande
  const bonsCommande = await PreFacture.find({ agenceId })
    .populate('clientId', 'nom prenom')
    .sort({ dateCreation: -1 })
    .limit(limit);
  
  // Get recent reservations
  const reservations = await Reservation.find({ agenceId })
    .populate('clientId', 'nom prenom')
    .sort({ dateCreation: -1 })
    .limit(limit);
  
  // Combine and sort activities
  const activities = [
    ...factures.map(f => ({
      type: 'facture',
      id: f._id,
      numero: f.numero,
      client: f.clientId,
      montant: f.montantTTC,
      date: f.dateEmission,
      statut: f.statut
    })),
    ...bonsCommande.map(bc => ({
      type: 'bon_commande',
      id: bc._id,
      numero: bc.numero,
      client: bc.clientId,
      montant: bc.montantTTC,
      date: bc.dateCreation,
      statut: bc.statut
    })),
    ...reservations.map(r => ({
      type: 'reservation',
      id: r._id,
      numero: r.numero,
      client: r.clientId,
      montant: r.montant,
      date: r.dateCreation,
      statut: r.statut
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date))
   .slice(0, limit);
  
  res.status(200).json({
    success: true,
    data: activities
  });
});

// @desc    Get financial summary
// @route   GET /api/dashboard/financial
// @access  Private/Agency
const getFinancialSummary = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { months = 6 } = req.query;
  
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
  
  // Get factures for the period
  const factures = await Facture.find({
    agenceId,
    dateEmission: { $gte: startDate, $lte: now }
  });
  
  // Monthly breakdown
  const monthlyData = [];
  for (let i = 0; i < months; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - months + i + 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - months + i + 2, 0);
    
    const monthFactures = factures.filter(f => 
      f.dateEmission >= monthStart && f.dateEmission <= monthEnd
    );
    
    const monthCA = monthFactures.reduce((sum, f) => sum + f.montantTTC, 0);
    const monthImpayees = monthFactures.filter(f => f.statut === 'en_retard').length;
    
    monthlyData.push({
      month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      chiffreAffaire: monthCA,
      facturesCount: monthFactures.length,
      facturesImpayees: monthImpayees
    });
  }
  
  // Calculate totals
  const totalCA = factures.reduce((sum, f) => sum + f.montantTTC, 0);
  const totalImpayees = factures.filter(f => f.statut === 'en_retard').length;
  const montantImpaye = factures
    .filter(f => f.statut === 'en_retard')
    .reduce((sum, f) => sum + f.montantTTC, 0);
  
  res.status(200).json({
    success: true,
    data: {
      periode: {
        debut: startDate,
        fin: now,
        mois: months
      },
      totalCA,
      totalImpayees,
      montantImpaye,
      monthlyData
    }
  });
});

// @desc    Get top clients
// @route   GET /api/dashboard/top-clients
// @access  Private/Agency
const getTopClients = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const { limit = 5 } = req.query;
  
  // Get factures with client data
  const factures = await Facture.find({ agenceId })
    .populate('clientId', 'nom prenom email telephone')
    .sort({ dateEmission: -1 });
  
  // Calculate client revenue
  const clientRevenue = {};
  factures.forEach(facture => {
    const clientId = facture.clientId._id.toString();
    if (!clientRevenue[clientId]) {
      clientRevenue[clientId] = {
        client: facture.clientId,
        totalRevenue: 0,
        facturesCount: 0,
        lastFacture: facture.dateEmission
      };
    }
    clientRevenue[clientId].totalRevenue += facture.montantTTC;
    clientRevenue[clientId].facturesCount += 1;
    if (facture.dateEmission > clientRevenue[clientId].lastFacture) {
      clientRevenue[clientId].lastFacture = facture.dateEmission;
    }
  });
  
  // Sort by revenue and get top clients
  const topClients = Object.values(clientRevenue)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);
  
  res.status(200).json({
    success: true,
    data: topClients
  });
});

// @desc    Get alerts and notifications
// @route   GET /api/dashboard/alerts
// @access  Private/Agency
const getDashboardAlerts = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const alerts = [];
  
  // Check for overdue invoices
  const facturesEnRetard = await Facture.find({
    agenceId,
    statut: 'en_retard'
  }).populate('clientId', 'nom prenom');
  
  if (facturesEnRetard.length > 0) {
    alerts.push({
      type: 'warning',
      title: 'Factures en retard',
      message: `${facturesEnRetard.length} facture(s) en retard`,
      count: facturesEnRetard.length,
      data: facturesEnRetard.slice(0, 3)
    });
  }
  
  // Check for low cash balance
  const operations = await Operation.find({ agenceId });
  const entrees = operations
    .filter(op => op.type === 'entree')
    .reduce((sum, op) => sum + op.montant, 0);
  const sorties = operations
    .filter(op => op.type === 'sortie')
    .reduce((sum, op) => sum + op.montant, 0);
  const solde = entrees - sorties;
  
  if (solde < 1000) {
    alerts.push({
      type: 'danger',
      title: 'Solde faible',
      message: `Solde de caisse faible: ${solde.toFixed(2)} DA`,
      solde: solde
    });
  }
  
  // Check for unread notifications
  // const notificationsNonLues = await Notification.countDocuments({
  //   agenceId,
  //   statut: 'en_attente'
  // });
  
  // if (notificationsNonLues > 0) {
  //   alerts.push({
  //     type: 'info',
  //     title: 'Notifications',
  //     message: `${notificationsNonLues} notification(s) non lue(s)`,
  //     count: notificationsNonLues
  //   });
  // }
  
  res.status(200).json({
    success: true,
    data: alerts
  });
});

// @desc    Get agent dashboard stats
// @route   GET /api/dashboard/agent/stats
// @access  Private/Agent
const getAgentStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'Utilisateur non authentifié'
    });
  }
  
  // Récupérer l'agent avec ses permissions
  const agent = await Utilisateur.findById(userId);
  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }
  
  if (agent.role !== 'agent') {
    return res.status(403).json({
      success: false,
      message: `Accès non autorisé. Rôle: ${agent.role}, attendu: agent`
    });
  }
  
  // Récupérer les agences de l'agent
  const userAgences = agent.agences || [];
  const userAgenceId = agent.agenceId;
  
  let agenceIds = [];
  if (userAgences && userAgences.length > 0) {
    agenceIds = userAgences
      .filter(a => !!a)
      .map(agence => typeof agence === 'object' ? agence._id || agence.id : agence);
  }
  if (agenceIds.length === 0 && userAgenceId) {
    agenceIds = [userAgenceId];
  }
  
  if (agenceIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Aucune agence associée à cet agent'
    });
  }
  
  // Initialiser les statistiques
  let stats = {
    clientsTraites: 0,
    facturesCreees: 0,
    operationsSemaine: 0,
    recentTasks: []
  };
  
  // Calculer les statistiques selon les permissions
  const permissions = agent.permissions || [];
  
  // Si l'agent a accès aux clients
  if (permissions.some(p => p.module === 'clients' && p.actions.includes('lire'))) {
    const clients = await Client.find({ agenceId: { $in: agenceIds } });
    stats.clientsTraites = clients.length;
  }
  
  // Si l'agent a accès aux factures
  if (permissions.some(p => p.module === 'factures' && p.actions.includes('lire'))) {
    const factures = await Facture.find({ agenceId: { $in: agenceIds } });
    stats.facturesCreees = factures.length;
  }
  
  // Si l'agent a accès à la caisse
  if (permissions.some(p => p.module === 'caisse' && p.actions.includes('lire'))) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const operations = await Operation.find({
      agenceId: { $in: agenceIds },
      date: { $gte: oneWeekAgo }
    });
    
    stats.operationsSemaine = operations.length;
  }
  
  // Tâches récentes (basées sur les permissions)
  const recentActivities = [];
  
  if (permissions.some(p => p.module === 'clients' && p.actions.includes('lire'))) {
    const recentClients = await Client.find({ agenceId: { $in: agenceIds } })
      .sort({ dateCreation: -1 })
      .limit(3);
    
    recentClients.forEach(client => {
      recentActivities.push({
        id: `client-${client._id}`,
        type: 'client',
        description: `Client ${client.entreprise || `${client.prenom} ${client.nom}`} ajouté`,
        date: client.dateCreation
      });
    });
  }
  
  if (permissions.some(p => p.module === 'factures' && p.actions.includes('lire'))) {
    const recentFactures = await Facture.find({ agenceId: { $in: agenceIds } })
      .sort({ dateEmission: -1 })
      .limit(3);
    
    recentFactures.forEach(facture => {
      recentActivities.push({
        id: `facture-${facture._id}`,
        type: 'facture',
        description: `Facture #${facture.numero} créée`,
        montant: facture.montantTTC,
        date: facture.dateEmission
      });
    });
  }
  
  // Trier par date et limiter
  stats.recentTasks = recentActivities
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  getStats,
  getSuperadminStats,
  getAgenceStats,
  getDashboardOverview,
  getRecentActivities,
  getFinancialSummary,
  getTopClients,
  getDashboardAlerts,
  getAgentStats
};