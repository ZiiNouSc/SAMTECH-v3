const asyncHandler = require('express-async-handler');
const Client = require('../models/clientModel');
const Facture = require('../models/factureModel');
const PreFacture = require('../models/preFactureModel');
const Historique = require('../models/historiqueModel');
const mongoose = require('mongoose');
const XLSX = require('xlsx');

// Helper function to calculate dynamic balance
const calculateClientBalance = async (clientId) => {
  try {
    // Récupérer uniquement les factures client (pas les factures fournisseur)
    const factures = await Facture.find({ 
      clientId,
      // Exclure les factures fournisseur
      fournisseurId: { $exists: false }
    });
    
    // Filtrer uniquement les factures en cours selon la nouvelle logique
    const facturesEnCours = factures.filter(f => 
      ['envoyee', 'partiellement_payee', 'en_retard'].includes(f.statut)
    );
    
    // Calculer le solde : somme des montants restants à payer
    const soldeCalcule = facturesEnCours.reduce((total, facture) => {
      const montantTotal = facture.montantTTC || 0;
      const montantPaye = facture.montantPaye || 0;
      const montantRestant = montantTotal - montantPaye;
      return total + montantRestant;
    }, 0);
    
    return Math.max(0, soldeCalcule); // Le solde ne peut jamais être négatif
  } catch (error) {
    console.error('Erreur calcul solde client:', error);
    return 0;
  }
};

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
const getClients = asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est authentifié
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié'
    });
  }
  
  // Filter by agency ID from authenticated user or query parameter
  const userRole = req.user?.role;
  const userAgences = req.user?.agences || [];
  const userAgenceId = req.user?.agenceId;
  
  let query = {};
  
  // TOUJOURS filtrer par agenceId sauf pour le superadmin
  if (userRole === 'superadmin') {
    // Pas de filtre d'agence pour les superadmins
  } else if (userRole === 'agence' || userRole === 'agent') {
    // Pour les agences et agents, filtrer par leurs agences
    if (userAgences && userAgences.length > 0) {
      const agenceIds = userAgences.map(agence => 
        typeof agence === 'object' ? agence._id || agence.id : agence
      );
      query.agenceId = { $in: agenceIds };
    } else if (userAgenceId) {
      // Fallback pour l'ancienne structure
      query.agenceId = userAgenceId;
    } else {
      // Si aucune agence n'est associée, on ne retourne rien
      query.agenceId = null;
    }
  } else {
    query.agenceId = null;
  }
  
  const clients = await Client.find(query);
  
  // Calculer le solde dynamique pour chaque client
  const formattedClients = await Promise.all(
    clients.map(async (client) => {
      const soldeCalcule = await calculateClientBalance(client._id);
      return {
        _id: client._id, // Correction ici
        nom: client.nom,
        prenom: client.prenom,
        entreprise: client.entreprise,
        typeClient: client.typeClient,
        email: client.email,
        telephone: client.telephone,
        adresse: client.adresse,
        codePostal: client.codePostal,
        ville: client.ville,
        pays: client.pays,
        solde: soldeCalcule,
        statut: client.statut,
        notes: client.notes,
        dateCreation: client.dateCreation
      };
    })
  );
  
  res.status(200).json({
    success: true,
    data: formattedClients,
    count: formattedClients.length
  });
});

// @desc    Get client by ID with complete info
// @route   GET /api/clients/:id
// @access  Private
const getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  
  if (client) {
    const soldeCalcule = await calculateClientBalance(client._id);
    
    // Format response to match frontend expectations
    const formattedClient = {
      id: client._id,
      nom: client.nom,
      prenom: client.prenom,
      entreprise: client.entreprise,
      typeClient: client.typeClient,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse,
      codePostal: client.codePostal,
      ville: client.ville,
      pays: client.pays,
      solde: soldeCalcule,
      statut: client.statut,
      notes: client.notes,
      dateCreation: client.dateCreation
    };
    
    res.status(200).json({
      success: true,
      data: formattedClient
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Client non trouvé'
    });
  }
});

// @desc    Get client history (factures, paiements, créances)
// @route   GET /api/clients/:id/history
// @access  Private
const getClientHistory = asyncHandler(async (req, res) => {
  const clientId = req.params.id;
  const agenceId = req.user?.agenceId;
  
  if (!mongoose.isValidObjectId(clientId)) {
    return res.status(400).json({
      success: false,
      message: 'ID client invalide'
    });
  }

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    // Récupérer les factures actives du client
    const factures = await Facture.find({ clientId, agenceId })
      .populate('clientId', 'nom prenom entreprise')
      .sort({ dateEmission: -1 });

    // Récupérer les devis actifs du client
    const preFactures = await PreFacture.find({ clientId, agenceId })
      .populate('clientId', 'nom prenom entreprise')
      .sort({ dateCreation: -1 });

    // Récupérer l'historique complet des événements
    const historique = await Historique.getHistoriqueClient(clientId, agenceId, { limit: 200 });

    // Calculer les statistiques
    const stats = {
      totalFactures: factures.length,
      montantTotal: factures.reduce((sum, f) => sum + (f.montantTTC || 0), 0),
      montantPaye: factures.reduce((sum, f) => sum + (f.montantPaye || 0), 0),
      facturesPayees: factures.filter(f => f.statut === 'payee').length,
      facturesEnAttente: factures.filter(f => ['brouillon', 'envoyee'].includes(f.statut)).length,
      facturesEnRetard: factures.filter(f => f.statut === 'en_retard').length,
      totalPreFactures: preFactures.length,
      preFacturesAcceptees: preFactures.filter(p => p.statut === 'accepte').length,
      totalEvenements: historique.length
    };

    res.status(200).json({
      success: true,
      data: {
        factures: factures.map(f => ({
          id: f._id,
          numero: f.numero,
          dateEmission: f.dateEmission,
          dateEcheance: f.dateEcheance,
          statut: f.statut,
          montantTTC: f.montantTTC,
          montantPaye: f.montantPaye,
          versements: f.versements || []
        })),
        preFactures: preFactures.map(p => ({
          id: p._id,
          numero: p.numero,
          dateCreation: p.dateCreation,
          statut: p.statut,
          montantTTC: p.montantTTC,
          articles: p.articles || []
        })),
        historique: historique.map(h => ({
          id: h._id,
          type: h.type,
          description: h.description,
          dateEvenement: h.dateEvenement,
          userName: h.userName,
          factureData: h.factureData,
          preFactureData: h.preFactureData,
          operationData: h.operationData,
          metadata: h.metadata
        })),
        stats
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
});

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
const createClient = asyncHandler(async (req, res) => {
  const { 
    nom, prenom, entreprise, typeClient, email, telephone, 
    adresse, codePostal, ville, pays, notes, agenceId: requestAgenceId 
  } = req.body;
  
  if (!nom || !email || !telephone || !adresse) {
    return res.status(400).json({
      success: false,
      message: 'Informations manquantes (nom, email, téléphone, adresse requis)'
    });
  }
  
  // Get agenceId from authenticated user or from request body
  const userRole = req.user?.role;
  const userAgences = req.user?.agences || [];
  const userAgenceId = req.user?.agenceId;
  
  let finalAgenceId;
  
  // Si l'utilisateur est superadmin, il peut spécifier une agence ou utiliser la première disponible
  if (userRole === 'superadmin') {
    finalAgenceId = requestAgenceId || (userAgences.length > 0 ? userAgences[0]._id || userAgences[0].id : userAgenceId);
  } else if (userRole === 'agence' || userRole === 'agent') {
    // Pour les agences et agents, utiliser l'agence spécifiée ou la première de leur liste
    if (requestAgenceId) {
      // Vérifier que l'utilisateur a accès à cette agence
      const hasAccess = userAgences.some(agence => 
        (agence._id || agence.id) === requestAgenceId
      );
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas accès à cette agence'
        });
      }
      finalAgenceId = requestAgenceId;
    } else if (userAgences.length > 0) {
      finalAgenceId = userAgences[0]._id || userAgences[0].id;
    } else if (userAgenceId) {
      finalAgenceId = userAgenceId;
    }
  }
  
  if (!finalAgenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const client = await Client.create({
    nom,
    prenom: prenom || '',
    entreprise: entreprise || '',
    typeClient: typeClient || 'particulier',
    email,
    telephone,
    adresse,
    codePostal: codePostal || '',
    ville: ville || '',
    pays: pays || 'Algérie',
    notes: notes || '',
    agenceId: finalAgenceId
  });
  
  // Format response to match frontend expectations
  const formattedClient = {
    id: client._id,
    nom: client.nom,
    prenom: client.prenom,
    entreprise: client.entreprise,
    typeClient: client.typeClient,
    email: client.email,
    telephone: client.telephone,
    adresse: client.adresse,
    codePostal: client.codePostal,
    ville: client.ville,
    pays: client.pays,
    solde: 0, // Nouveau client, solde = 0
    statut: client.statut,
    notes: client.notes,
    dateCreation: client.dateCreation
  };
  
  res.status(201).json({
    success: true,
    message: 'Client créé avec succès',
    data: formattedClient
  });
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
  const { 
    nom, prenom, entreprise, typeClient, email, telephone, 
    adresse, codePostal, ville, pays, statut, notes 
  } = req.body;
  
  if (!nom || !email || !telephone || !adresse) {
    return res.status(400).json({
      success: false,
      message: 'Informations manquantes (nom, email, téléphone, adresse requis)'
    });
  }
  
  const client = await Client.findById(req.params.id);
  
  if (client) {
    client.nom = nom;
    client.prenom = prenom || '';
    client.entreprise = entreprise || '';
    client.typeClient = typeClient || 'particulier';
    client.email = email;
    client.telephone = telephone;
    client.adresse = adresse;
    client.codePostal = codePostal || '';
    client.ville = ville || '';
    client.pays = pays || 'Algérie';
    client.statut = statut || 'actif';
    client.notes = notes || '';
    
    const updatedClient = await client.save();
    const soldeCalcule = await calculateClientBalance(updatedClient._id);
    
    // Format response to match frontend expectations
    const formattedClient = {
      id: updatedClient._id,
      nom: updatedClient.nom,
      prenom: updatedClient.prenom,
      entreprise: updatedClient.entreprise,
      typeClient: updatedClient.typeClient,
      email: updatedClient.email,
      telephone: updatedClient.telephone,
      adresse: updatedClient.adresse,
      codePostal: updatedClient.codePostal,
      ville: updatedClient.ville,
      pays: updatedClient.pays,
      solde: soldeCalcule,
      statut: updatedClient.statut,
      notes: updatedClient.notes,
      dateCreation: updatedClient.dateCreation
    };
    
    res.status(200).json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: formattedClient
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Client non trouvé'
    });
  }
});

// @desc    Export clients to Excel
// @route   GET /api/clients/export/excel
// @access  Private
const exportClientsExcel = asyncHandler(async (req, res) => {
  // Récupérer tous les clients (en utilisant la même logique que getClients)
  const userRole = req.user?.role;
  const userAgences = req.user?.agences || [];
  const userAgenceId = req.user?.agenceId;
  
  let query = {};
  
  if (userRole === 'superadmin') {
    // Pas de filtre d'agence pour les superadmins
  } else if (userRole === 'agence' || userRole === 'agent') {
    if (userAgences && userAgences.length > 0) {
      const agenceIds = userAgences.map(agence => 
        typeof agence === 'object' ? agence._id || agence.id : agence
      );
      query.agenceId = { $in: agenceIds };
    } else if (userAgenceId) {
      query.agenceId = userAgenceId;
    } else {
      query.agenceId = null;
    }
  } else {
    query.agenceId = null;
  }
  
  const clients = await Client.find(query);
  
  // Préparer les données pour l'export
  const exportData = await Promise.all(
    clients.map(async (client) => {
      const soldeCalcule = await calculateClientBalance(client._id);
      
      return {
        'Nom': client.nom,
        'Prénom': client.prenom,
        'Entreprise': client.entreprise,
        'Type Client': client.typeClient,
        'Email': client.email,
        'Téléphone': client.telephone,
        'Adresse': client.adresse,
        'Code Postal': client.codePostal,
        'Ville': client.ville,
        'Pays': client.pays,
        'Solde (DA)': soldeCalcule,
        'Statut': client.statut,
        'Notes': client.notes,
        'Date Création': client.dateCreation ? client.dateCreation.toISOString().split('T')[0] : ''
      };
    })
  );
  
  // Créer le workbook Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  
  // Ajuster la largeur des colonnes
  const cols = [
    { wch: 15 }, // Nom
    { wch: 15 }, // Prénom
    { wch: 20 }, // Entreprise
    { wch: 12 }, // Type Client
    { wch: 25 }, // Email
    { wch: 15 }, // Téléphone
    { wch: 30 }, // Adresse
    { wch: 12 }, // Code Postal
    { wch: 15 }, // Ville
    { wch: 12 }, // Pays
    { wch: 12 }, // Solde
    { wch: 10 }, // Statut
    { wch: 30 }, // Notes
    { wch: 12 }  // Date Création
  ];
  ws['!cols'] = cols;
  
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');
  
  // Générer le buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  // Configurer les headers de réponse
  const filename = `clients_export_${new Date().toISOString().split('T')[0]}.xlsx`;
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length
  });
  
  res.send(buffer);
});

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  
  if (client) {
    await Client.deleteOne({ _id: client._id });
    
    res.status(200).json({
      success: true,
      message: 'Client supprimé avec succès'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Client non trouvé'
    });
  }
});

module.exports = {
  getClients,
  getClientById,
  getClientHistory,
  createClient,
  updateClient,
  deleteClient,
  exportClientsExcel
};