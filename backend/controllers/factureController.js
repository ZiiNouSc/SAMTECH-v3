const asyncHandler = require('express-async-handler');
const Facture = require('../models/factureModel');
const BilletAvion = require('../models/billetModel');
const Client = require('../models/clientModel');
const Fournisseur = require('../models/fournisseurModel');
const Operation = require('../models/operationModel');
const FournisseurService = require('../services/fournisseurService');
const CaisseService = require('../services/caisseService');
const Historique = require('../models/historiqueModel');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');
const mongoose = require('mongoose');
const Agence = require('../models/agenceModel');
const { createAuditLog } = require('./caisseController');
const FactureService = require('../services/factureService');

// @desc    Get all factures
// @route   GET /api/factures
// @access  Private
const getFactures = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  if (req.user.role !== 'superadmin') {
    if (!agenceId) return res.status(400).json({ success: false, message: "ID d'agence manquant" });
  }
  // Ajout du filtre fournisseurId
  const filter = req.user.role === 'superadmin' ? {} : { agenceId };
  if (req.query.fournisseurId) {
    filter.fournisseurId = req.query.fournisseurId;
  }
  // Pagination
  const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
  const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
  const skip = (page - 1) * limit;

  const total = await Facture.countDocuments(filter);
  const factures = await Facture.find(filter)
    .populate('clientId')
    .populate('fournisseurId')
    .sort({ dateEmission: -1 })
    .skip(skip)
    .limit(limit);
  
  // Format data to match frontend expectations
  const facturesWithClients = factures.map(facture => {
    const client = facture.clientId;
    const fournisseur = facture.fournisseurId;
    return {
      id: facture._id,
      numero: facture.numero,
      clientId: client?._id,
      fournisseurId: fournisseur?._id,
      dateEmission: facture.dateEmission,
      dateEcheance: facture.dateEcheance,
      statut: facture.statut,
      montantHT: facture.montantHT,
      montantTTC: facture.montantTTC,
      montantPaye: facture.montantPaye || 0,
      versements: facture.versements || [],
      articles: facture.articles,
      client: client ? {
        id: client._id,
        nom: client.nom,
        prenom: client.prenom,
        entreprise: client.entreprise,
        email: client.email
      } : null,
      fournisseur: fournisseur ? {
        id: fournisseur._id,
        nom: fournisseur.nom,
        entreprise: fournisseur.entreprise,
        email: fournisseur.email
      } : null
    };
  });
  
  res.status(200).json({
    success: true,
    data: facturesWithClients,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

// @desc    Get facture by ID
// @route   GET /api/factures/:id
// @access  Private
const getFactureById = asyncHandler(async (req, res) => {
  const facture = await Facture.findById(req.params.id).populate('clientId').populate('fournisseurId');
  
  if (facture) {
    const client = facture.clientId;
    const fournisseur = facture.fournisseurId;
    
    const factureWithClient = {
      id: facture._id,
      numero: facture.numero,
      clientId: client?._id,
      fournisseurId: fournisseur?._id,
      dateEmission: facture.dateEmission,
      dateEcheance: facture.dateEcheance,
      statut: facture.statut,
      montantHT: facture.montantHT,
      montantTTC: facture.montantTTC,
      montantPaye: facture.montantPaye || 0,
      versements: facture.versements || [],
      articles: facture.articles,
      client: client ? {
        id: client._id,
        nom: client.nom,
        prenom: client.prenom,
        entreprise: client.entreprise,
        email: client.email
      } : null,
      fournisseur: fournisseur ? {
        id: fournisseur._id,
        nom: fournisseur.nom,
        entreprise: fournisseur.entreprise,
        email: fournisseur.email
      } : null
    };
    
    res.status(200).json({
      success: true,
      data: factureWithClient
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Facture non trouvée'
    });
  }
});

// @desc    Create new facture
// @route   POST /api/factures
// @access  Private
const createFacture = asyncHandler(async (req, res) => {
  const { clientId, dateEmission, dateEcheance, articles, statut = 'brouillon', fournisseurId, tva, montantHT, montantTTC } = req.body;
  
  // Vérifier les données de base
  if (!dateEmission || !dateEcheance || !articles || !articles.length) {
    return res.status(400).json({
      success: false,
      message: 'Informations manquantes'
    });
  }

  // Vérifier qu'on a soit un clientId soit un fournisseurId
  if (!clientId && !fournisseurId) {
    return res.status(400).json({
      success: false,
      message: 'Client ou fournisseur requis'
    });
  }

  let client = null;
  let fournisseur = null;

  // Si c'est une facture client
  if (clientId) {
    client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
  }

  // Si c'est une facture fournisseur
  if (fournisseurId) {
    fournisseur = await Fournisseur.findById(fournisseurId);
    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }
  }
  
  // Utiliser les montants calculés par le frontend
  const finalMontantHT = montantHT || articles.reduce((sum, article) => sum + article.montant, 0);
  const finalMontantTTC = montantTTC || finalMontantHT;
  const finalTVA = tva || 0;
  
  // In a real app, get agenceId from authenticated user
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  // Generate unique facture number for this agency
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
  
  const numero = `FAC-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
  
  const facture = await Facture.create({
    numero,
    clientId: clientId || undefined,
    fournisseurId: fournisseurId || undefined,
    dateEmission,
    dateEcheance,
    statut,
    montantHT: finalMontantHT,
    montantTTC: finalMontantTTC,
    tva: finalTVA,
    articles,
    agenceId
  });
  
  // Logique de gestion des factures fournisseur - appelée pour TOUS les statuts
  if (fournisseurId) {
    try {
      const resultat = await FournisseurService.handleCreationFacture({
        fournisseurId,
        montantTTC: finalMontantTTC,
        agenceId,
        userId: req.user._id,
        numero,
        dateEmission,
        dateEcheance,
        articles,
        statut,
        montantHT: finalMontantHT,
        tva: finalTVA
      });
      
      console.log(`✅ [FACTURE CONTROLLER] ${resultat.message}`);
      console.log(`   - Dette ajoutée: ${resultat.details.detteAjoutee.toLocaleString('fr-FR')} DA`);
    } catch (error) {
      console.error('❌ Erreur lors du traitement de la facture fournisseur:', error);
      // Ne pas faire échouer la création de la facture si le traitement échoue
    }
  }
  
  // Lier les billets à la facture si des billets sont présents dans les articles
  if (clientId) {
    try {
      const billetsIds = articles
        .filter(article => article.billetId)
        .map(article => article.billetId);
      
      if (billetsIds.length > 0) {
        await BilletAvion.updateMany(
          { _id: { $in: billetsIds } },
          { factureClientId: facture._id }
        );
        console.log(`✅ ${billetsIds.length} billet(s) lié(s) à la facture ${numero}`);
      }

      // Lier les hôtels à la facture
      const hotelsIds = articles
        .filter(article => article.hotelId)
        .map(article => article.hotelId);
      
      if (hotelsIds.length > 0) {
        const HotelReservation = require('../models/hotelModel');
        await HotelReservation.updateMany(
          { _id: { $in: hotelsIds } },
          { factureClientId: facture._id }
        );
        console.log(`✅ ${hotelsIds.length} hôtel(s) lié(s) à la facture ${numero}`);
      }

      // Lier les visas à la facture
      const visasIds = articles
        .filter(article => article.visaId)
        .map(article => article.visaId);
      
      if (visasIds.length > 0) {
        const Visa = require('../models/visaModel');
        await Visa.updateMany(
          { _id: { $in: visasIds } },
          { factureClientId: facture._id }
        );
        console.log(`✅ ${visasIds.length} visa(s) lié(s) à la facture ${numero}`);
      }

      // Lier les assurances à la facture
      const assurancesIds = articles
        .filter(article => article.assuranceId)
        .map(article => article.assuranceId);
      
      if (assurancesIds.length > 0) {
        const Assurance = require('../models/assuranceModel');
        await Assurance.updateMany(
          { _id: { $in: assurancesIds } },
          { factureClientId: facture._id }
        );
        console.log(`✅ ${assurancesIds.length} assurance(s) liée(s) à la facture ${numero}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la liaison des prestations à la facture:', error);
      // Ne pas faire échouer la création de la facture
    }
  }
  
  // Créer un événement d'historique pour la création de facture
  if (clientId) {
    try {
      await Historique.creerEvenement({
        clientId: clientId,
        agenceId: agenceId,
        type: 'creation_facture',
        description: `Facture ${numero} créée`,
        factureData: {
          numero: numero,
          montantTTC: finalMontantTTC,
          montantPaye: 0,
          statut: statut,
          dateEmission: dateEmission,
          dateEcheance: dateEcheance,
          articles: articles
        },
        userId: req.user._id,
        userName: `${req.user.prenom} ${req.user.nom}`,
        metadata: {
          montantHT: finalMontantHT,
          tva: finalTVA
        }
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement historique:', error);
    }
  }
  
  // Note: Le solde du client n'est mis à jour que quand la facture est envoyée
  // (pas lors de la création en brouillon)
  
  const factureWithClient = {
    id: facture._id,
    numero: facture.numero,
    clientId: client ? client._id : undefined,
    fournisseurId: fournisseur ? fournisseur._id : undefined,
    dateEmission: facture.dateEmission,
    dateEcheance: facture.dateEcheance,
    statut: facture.statut,
    montantHT: facture.montantHT,
    montantTTC: facture.montantTTC,
    montantPaye: facture.montantPaye || 0,
    versements: facture.versements || [],
    articles: facture.articles,
    client: client ? {
      id: client._id,
      nom: client.nom,
      prenom: client.prenom,
      entreprise: client.entreprise,
      email: client.email
    } : null,
    fournisseur: fournisseur ? {
      id: fournisseur._id,
      nom: fournisseur.nom,
      entreprise: fournisseur.entreprise,
      email: fournisseur.email
    } : null
  };
  
  res.status(201).json({
    success: true,
    message: 'Facture créée avec succès',
    data: factureWithClient
  });
});

// @desc    Update facture
// @route   PUT /api/factures/:id
// @access  Private
const updateFacture = asyncHandler(async (req, res) => {
  const { clientId, dateEmission, dateEcheance, articles, statut, fournisseurId, tva } = req.body;
  const montantHT = articles.reduce((sum, article) => sum + article.montant, 0);
  const tauxTVA = typeof tva === 'number' ? tva : 0;
  const montantTTC = montantHT * (1 + tauxTVA / 100);
  let differenceMontant = 0;
  const facture = await Facture.findById(req.params.id);
  
  // Vérifier les données de base
  if (!dateEmission || !dateEcheance || !articles || !articles.length) {
    return res.status(400).json({
      success: false,
      message: 'Informations manquantes'
    });
  }

  // Vérifier qu'on a soit un clientId soit un fournisseurId
  if (!clientId && !fournisseurId) {
    return res.status(400).json({
      success: false,
      message: 'Client ou fournisseur requis'
    });
  }
  
  if (facture) {
    let client = null;
    let fournisseur = null;

    // Si c'est une facture client
    if (clientId) {
      client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }
      const ancienMontantTTC = facture.montantTTC;
      const nouveauMontantTTC = montantTTC;
      differenceMontant = nouveauMontantTTC - ancienMontantTTC;
      
      // Récupérer l'ancien client si différent
      const ancienClient = facture.clientId && facture.clientId.toString() !== clientId ? await Client.findById(facture.clientId) : null;
      
      // Si la facture était envoyée, retirer l'ancien montant du solde et remettre en brouillon
      if (facture.statut === 'envoyee') {
        // Retirer l'ancien montant du solde du client
        client.solde = Math.max(0, (client.solde || 0) - ancienMontantTTC);
        await client.save();
        
        console.log(`Facture modifiée - Ancien montant retiré du solde: ${ancienMontantTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
        
        // Remettre la facture en brouillon
        facture.statut = 'brouillon';
        facture.montantPaye = 0;
        facture.versements = [];
      }
      
      // Si la facture était payée, ajuster le solde du client
      if (facture.statut === 'payee' && differenceMontant !== 0) {
        // Si le nouveau montant est plus élevé, augmenter le solde (client doit plus)
        // Si le nouveau montant est plus faible, diminuer le solde (client doit moins)
        client.solde = Math.max(0, (client.solde || 0) + differenceMontant);
        await client.save();
        
        // Mettre à jour le montant payé pour refléter le nouveau montant total
        facture.montantPaye = nouveauMontantTTC;
        
        console.log(`Facture payée modifiée - Solde ajusté de ${differenceMontant > 0 ? '+' : ''}${differenceMontant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
      }
      
      // Si on change de client, ajuster les soldes
      if (ancienClient && facture.clientId && facture.clientId.toString() !== clientId) {
        // Retirer le montant de l'ancien client
        ancienClient.solde = Math.max(0, (ancienClient.solde || 0) - ancienMontantTTC);
        await ancienClient.save();
        
        // Ajouter le montant au nouveau client
        client.solde = (client.solde || 0) + nouveauMontantTTC;
        await client.save();
        
        console.log(`Changement de client: Ancien client solde ajusté de -${ancienMontantTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}, Nouveau client solde ajusté de +${nouveauMontantTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
      }
    }
    
    // Si c'est une facture fournisseur
    if (fournisseurId) {
      fournisseur = await Fournisseur.findById(fournisseurId);
      if (!fournisseur) {
        return res.status(404).json({
          success: false,
          message: 'Fournisseur non trouvé'
        });
      }
      
      const ancienMontantTTC = facture.montantTTC;
      const nouveauMontantTTC = montantTTC;
      differenceMontant = nouveauMontantTTC - ancienMontantTTC;
      
      // Récupérer l'ancien fournisseur si différent
      const ancienFournisseur = facture.fournisseurId && facture.fournisseurId.toString() !== fournisseurId ? await Fournisseur.findById(facture.fournisseurId) : null;
      
      // Si la facture était payée partiellement ou complètement, ajuster le solde créditeur
      if ((facture.statut === 'payee' || facture.statut === 'partiellement_payee') && facture.montantPaye > 0) {
        // Remettre le montant payé dans le solde créditeur du fournisseur
        if (ancienFournisseur) {
          ancienFournisseur.soldeCrediteur = (ancienFournisseur.soldeCrediteur || 0) + facture.montantPaye;
          await ancienFournisseur.save();
        } else {
          fournisseur.soldeCrediteur = (fournisseur.soldeCrediteur || 0) + facture.montantPaye;
          await fournisseur.save();
        }
        
        // Remettre la facture en brouillon
        facture.statut = 'brouillon';
        facture.montantPaye = 0;
        facture.versements = [];
        
        console.log(`Facture fournisseur modifiée - Montant payé remis dans le solde créditeur: ${facture.montantPaye.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
      }
      
      // Si on change de fournisseur, ajuster les soldes
      if (ancienFournisseur && facture.fournisseurId && facture.fournisseurId.toString() !== fournisseurId) {
        // Si la facture était payée, remettre le montant dans l'ancien fournisseur
        if (facture.montantPaye > 0) {
          ancienFournisseur.soldeCrediteur = (ancienFournisseur.soldeCrediteur || 0) + facture.montantPaye;
          await ancienFournisseur.save();
        }
        
        console.log(`Changement de fournisseur: Ancien fournisseur solde créditeur ajusté de +${facture.montantPaye.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
      }
    }
    
    // Mettre à jour la facture
    facture.clientId = clientId || undefined;
    facture.fournisseurId = fournisseurId || undefined;
    facture.dateEmission = dateEmission;
    facture.dateEcheance = dateEcheance;
    facture.montantHT = montantHT;
    facture.montantTTC = montantTTC;
    facture.articles = articles;
    
    const updatedFacture = await facture.save();
    
    // Créer un événement d'historique pour la modification de facture
    if (clientId) {
      try {
        await Historique.creerEvenement({
          clientId: clientId,
          agenceId: facture.agenceId,
          type: 'modification_facture',
          description: `Facture ${facture.numero} modifiée`,
          factureData: {
            numero: facture.numero,
            montantTTC: montantTTC,
            montantPaye: updatedFacture.montantPaye || 0,
            statut: updatedFacture.statut,
            dateEmission: dateEmission,
            dateEcheance: dateEcheance,
            articles: articles
          },
          userId: req.user._id,
          userName: `${req.user.prenom} ${req.user.nom}`,
          metadata: {
            ancienMontant: facture.montantTTC,
            nouveauMontant: montantTTC,
            difference: differenceMontant,
            changementClient: ancienClient ? true : false
          }
        });
      } catch (error) {
        console.error('Erreur lors de la création de l\'événement historique:', error);
      }
    }
    
    const factureWithClient = {
      id: updatedFacture._id,
      numero: updatedFacture.numero,
      clientId: client ? client._id : undefined,
      fournisseurId: fournisseur ? fournisseur._id : undefined,
      dateEmission: updatedFacture.dateEmission,
      dateEcheance: updatedFacture.dateEcheance,
      statut: updatedFacture.statut,
      montantHT: updatedFacture.montantHT,
      montantTTC: updatedFacture.montantTTC,
      montantPaye: updatedFacture.montantPaye || 0,
      versements: updatedFacture.versements || [],
      articles: updatedFacture.articles,
      client: client ? {
        id: client._id,
        nom: client.nom,
        prenom: client.prenom,
        entreprise: client.entreprise,
        email: client.email
      } : null,
      fournisseur: fournisseur ? {
        id: fournisseur._id,
        nom: fournisseur.nom,
        entreprise: fournisseur.entreprise,
        email: fournisseur.email
      } : null
    };
    
    let message = 'Facture mise à jour avec succès';
    if (client && facture.statut === 'envoyee') {
      message += '. La facture a été remise en brouillon et le solde du client ajusté.';
    } else if (client && differenceMontant !== 0 && facture.statut === 'payee') {
      message += `. Solde du client ajusté de ${differenceMontant > 0 ? '+' : ''}${differenceMontant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`;
    }
    
    res.status(200).json({
      success: true,
      message: message,
      data: factureWithClient
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Facture non trouvée'
    });
  }
});

// @desc    Mark facture as paid
// @route   PUT /api/factures/:id/pay
// @access  Private
const markFactureAsPaid = asyncHandler(async (req, res) => {
  const { moyenPaiement } = req.body;
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  if (!moyenPaiement || !['especes', 'virement', 'cheque'].includes(moyenPaiement)) {
    return res.status(400).json({
      success: false,
      message: 'Le moyen de paiement est obligatoire (espèces, virement, chèque)'
    });
  }

  try {
    // Utiliser le service Caisse pour le paiement complet
    const result = await CaisseService.paiementFactureComplete(req.params.id, moyenPaiement, agenceId, req.user._id);
    
    const { facture, operation, montantPaye } = result;
    const client = await Client.findById(facture.clientId);
    const fournisseur = await Fournisseur.findById(facture.fournisseurId);
    
    const factureWithClient = {
      id: facture._id,
      numero: facture.numero,
      clientId: client ? client._id : undefined,
      fournisseurId: fournisseur ? fournisseur._id : undefined,
      dateEmission: facture.dateEmission,
      dateEcheance: facture.dateEcheance,
      statut: facture.statut,
      montantHT: facture.montantHT,
      montantTTC: facture.montantTTC,
      montantPaye: facture.montantPaye,
      versements: facture.versements || [],
      articles: facture.articles,
      client: client ? {
        id: client._id,
        nom: client.nom,
        prenom: client.prenom,
        entreprise: client.entreprise,
        email: client.email
      } : null,
      fournisseur: fournisseur ? {
        id: fournisseur._id,
        nom: fournisseur.nom,
        entreprise: fournisseur.entreprise,
        email: fournisseur.email
      } : null
    };

    res.status(200).json({
      success: true,
      message: `Facture marquée comme payée. Montant de ${montantPaye.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} enregistré dans la caisse.`,
      data: factureWithClient
    });
  } catch (error) {
    console.error('Erreur lors du paiement de la facture:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Make payment on facture
// @route   POST /api/factures/:id/payment
// @access  Private
const makePayment = asyncHandler(async (req, res) => {
  const { amount, moyenPaiement } = req.body;
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Montant invalide'
    });
  }
  
  if (!moyenPaiement || !['especes', 'virement', 'cheque'].includes(moyenPaiement)) {
    return res.status(400).json({
      success: false,
      message: 'Le moyen de paiement est obligatoire (espèces, virement, chèque)'
    });
  }

  try {
    // Utiliser le service Caisse pour le versement
    const result = await CaisseService.versementFacture(req.params.id, amount, moyenPaiement, agenceId, req.user._id);
    
    const { facture, operation, montantPaye, montantRestant } = result;
    const client = await Client.findById(facture.clientId);
    const fournisseur = await Fournisseur.findById(facture.fournisseurId);
    
    const factureWithClient = {
      id: facture._id,
      numero: facture.numero,
      clientId: client ? client._id : undefined,
      fournisseurId: fournisseur ? fournisseur._id : undefined,
      dateEmission: facture.dateEmission,
      dateEcheance: facture.dateEcheance,
      statut: facture.statut,
      montantHT: facture.montantHT,
      montantTTC: facture.montantTTC,
      montantPaye: facture.montantPaye,
      versements: facture.versements || [],
      articles: facture.articles,
      client: client ? {
        id: client._id,
        nom: client.nom,
        prenom: client.prenom,
        entreprise: client.entreprise,
        email: client.email
      } : null,
      fournisseur: fournisseur ? {
        id: fournisseur._id,
        nom: fournisseur.nom,
        entreprise: fournisseur.entreprise,
        email: fournisseur.email
      } : null
    };

    res.status(200).json({
      success: true,
      message: `Versement de ${amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} enregistré avec succès. Montant restant: ${montantRestant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
      data: factureWithClient
    });
  } catch (error) {
    console.error('Erreur lors du versement:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete facture
// @route   DELETE /api/factures/:id
// @access  Private
const deleteFacture = asyncHandler(async (req, res) => {
  const facture = await Facture.findById(req.params.id);
  
  if (facture) {
    // Créer un événement d'historique avant la suppression
    if (facture.clientId) {
      try {
        await Historique.creerEvenement({
          clientId: facture.clientId,
          agenceId: facture.agenceId,
          type: 'suppression_facture',
          description: `Facture ${facture.numero} supprimée`,
          factureData: {
            numero: facture.numero,
            montantTTC: facture.montantTTC,
            montantPaye: facture.montantPaye || 0,
            statut: facture.statut,
            dateEmission: facture.dateEmission,
            dateEcheance: facture.dateEcheance,
            articles: facture.articles || []
          },
          userId: req.user._id,
          userName: `${req.user.prenom} ${req.user.nom}`,
          metadata: {
            raison: 'Suppression manuelle',
            montantRestant: facture.montantTTC - (facture.montantPaye || 0)
          }
        });
      } catch (error) {
        console.error('Erreur lors de la création de l\'événement historique:', error);
        // Ne pas bloquer la suppression si l'historique échoue
      }
    }
    
    // Ajuster le solde du client si la facture n'était pas payée
    if (facture.statut !== 'payee') {
      const client = await Client.findById(facture.clientId);
      if (client) {
        const ancienSolde = client.solde || 0;
        const nouveauSolde = Math.max(0, ancienSolde - facture.montantTTC);
        client.solde = nouveauSolde;
        await client.save();
        
        console.log(`Solde client mis à jour (suppression facture): ${ancienSolde.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} → ${nouveauSolde.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
      }
    }
    
    // Supprimer toutes les opérations de caisse liées à cette facture
    await Operation.deleteMany({ factureId: facture._id });
    await Facture.deleteOne({ _id: facture._id });
    
    res.status(200).json({
      success: true,
      message: 'Facture supprimée avec succès'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Facture non trouvée'
    });
  }
});

// @desc    Generate PDF for facture
// @route   GET /api/factures/:id/pdf
// @access  Private
const generateFacturePDF = asyncHandler(async (req, res) => {
  try {
    const factureId = req.params.id;
    
    // Récupérer la facture avec le client
    const facture = await Facture.findById(factureId).populate('clientId').populate('fournisseurId');
    
    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    // Récupérer l'agence
    const agence = await Agence.findById(facture.agenceId);
    
    if (!agence) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      });
    }
    
    // Version temporaire : renvoyer un PDF simple ou une réponse JSON
    // TODO: Réactiver pdfService une fois le problème Playwright résolu
    
    // Pour l'instant, on renvoie les données de la facture en JSON
    res.json({
      success: true,
      message: 'Génération PDF temporairement désactivée - données de la facture',
      data: {
        facture: {
          numero: facture.numero,
          client: facture.clientId?.entreprise || `${facture.clientId?.prenom} ${facture.clientId?.nom}`,
          montantTTC: facture.montantTTC,
          statut: facture.statut
        }
      }
    });
    
    console.log('✅ Données facture renvoyées (PDF désactivé temporairement)');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
      error: error.message
    });
  }
});

// @desc    Send facture via email
// @route   POST /api/factures/:id/send-email
// @access  Private
const sendFactureEmail = asyncHandler(async (req, res) => {
  const { emailTo, subject, message, markAsSent = false } = req.body;
  
  if (!emailTo) {
    return res.status(400).json({
      success: false,
      message: 'Adresse email du destinataire requise'
    });
  }

  const facture = await Facture.findById(req.params.id)
    .populate('clientId', 'nom prenom entreprise email telephone')
    .populate('fournisseurId', 'nom entreprise email');
  
  if (!facture) {
    return res.status(404).json({
      success: false,
      message: 'Facture non trouvée'
    });
  }

  // Vérifier les permissions d'agence
  if (req.user.role !== 'superadmin' && facture.agenceId.toString() !== req.user.agenceId?.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé à cette facture'
    });
  }

  try {
    const agenceId = req.user.agenceId;

    // Préparer les données d'email
    const emailData = {
      to: emailTo,
      subject: subject || `Facture N° ${facture.numero} - ${facture.clientId.entreprise || facture.clientId.prenom + ' ' + facture.clientId.nom}`,
      message: message || `
        <p>Bonjour,</p>
        <p>Veuillez trouver ci-joint votre facture N° <strong>${facture.numero}</strong> d'un montant de <strong>${(facture.montantTTC || 0).toLocaleString('fr-FR')} DA</strong>.</p>
        <p>Date d'échéance : <strong>${new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}</strong></p>
        <p>Nous vous remercions pour votre confiance.</p>
        <p>Cordialement,</p>
      `
    };

    // Envoyer l'email via Gmail
    const result = await emailService.sendFactureEmail(facture._id, agenceId, emailData);

    // Si l'envoi a réussi et que markAsSent est true, changer le statut
    if (result.success && markAsSent && facture.statut === 'brouillon') {
      facture.statut = 'envoyee';
      await facture.save();

      // Mettre à jour le solde du client
      const client = await Client.findById(facture.clientId);
      if (client) {
        const ancienSolde = client.solde || 0;
        const nouveauSolde = ancienSolde + facture.montantTTC;
        client.solde = nouveauSolde;
        await client.save();
      }
    }

    // Log d'audit
    await createAuditLog(
      req.user._id,
      req.user.nom + ' ' + req.user.prenom,
      req.user.role,
      'SEND_EMAIL',
      `Envoi facture N° ${facture.numero} par email à ${emailTo}`,
      req,
      `facture:${facture._id}`
    );

    res.status(200).json({
      success: true,
      message: 'Facture envoyée par email avec succès',
      data: {
        factureId: facture._id,
        numero: facture.numero,
        sentTo: emailTo,
        messageId: result.messageId,
        markedAsSent: markAsSent && facture.statut === 'envoyee'
      }
    });

  } catch (error) {
    console.error('Erreur envoi email facture:', error);
    
    // Log d'audit pour l'erreur
    await createAuditLog(
      req.user._id,
      req.user.nom + ' ' + req.user.prenom,
      req.user.role,
      'ERROR',
      `Échec envoi email facture N° ${facture.numero}: ${error.message}`,
      req
    );

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'envoi de l\'email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Recalculate client balances
// @route   POST /api/factures/recalculate-balances
// @access  Private
const recalculateClientBalances = asyncHandler(async (req, res) => {
  try {
    const clients = await Client.find({});
    const results = [];
    
    for (const client of clients) {
      // Récupérer uniquement les factures client en cours selon la nouvelle logique
      const facturesEnCours = await Facture.find({
        clientId: client._id,
        // Exclure les factures fournisseur
        fournisseurId: { $exists: false },
        // Filtrer uniquement les statuts en cours
        statut: { $in: ['envoyee', 'partiellement_payee', 'en_retard'] }
      });
      
      // Calculer le solde réel basé sur les montants restants à payer
      let soldeCalcule = 0;
      
      for (const facture of facturesEnCours) {
        const montantFacture = facture.montantTTC || 0;
        const montantPaye = facture.montantPaye || 0;
        const montantRestant = montantFacture - montantPaye;
        
        // Ajouter seulement le montant restant au solde
        soldeCalcule += montantRestant;
      }
      
      // Mettre à jour le solde du client
      const ancienSolde = client.solde || 0;
      client.solde = Math.max(0, soldeCalcule);
      await client.save();
      
      results.push({
        clientId: client._id,
        nom: client.nom,
        prenom: client.prenom,
        entreprise: client.entreprise,
        ancienSolde: ancienSolde,
        nouveauSolde: client.solde,
        facturesEnCours: facturesEnCours.length,
        facturesEnvoyees: facturesEnCours.filter(f => f.statut === 'envoyee').length,
        facturesPartiellementPayees: facturesEnCours.filter(f => f.statut === 'partiellement_payee').length,
        facturesEnRetard: facturesEnCours.filter(f => f.statut === 'en_retard').length
      });
      
      console.log(`Solde recalculé pour ${client.entreprise || `${client.prenom} ${client.nom}`}: ${ancienSolde.toLocaleString('fr-FR')} DA → ${client.solde.toLocaleString('fr-FR')} DA`);
    }
    
    res.status(200).json({
      success: true,
      message: `Soldes recalculés pour ${results.length} clients`,
      data: results
    });
  } catch (error) {
    console.error('Erreur lors du recalcul des soldes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du recalcul des soldes',
      error: error.message
    });
  }
});

// @desc    Créer un avoir sur une facture
// @route   POST /api/factures/:id/avoir
// @access  Private
const createAvoir = asyncHandler(async (req, res) => {
  const { montant, moyenPaiement } = req.body;
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  if (!montant || montant <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Montant d\'avoir invalide' 
    });
  }
  
  if (!moyenPaiement || !['especes', 'virement', 'cheque'].includes(moyenPaiement)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Le moyen de paiement est obligatoire (espèces, virement, chèque)' 
    });
  }

  try {
    // Utiliser le service Caisse pour créer l'avoir
    const result = await CaisseService.creerAvoir(req.params.id, montant, moyenPaiement, agenceId, req.user._id);
    
    const { facture, operation, montantAvoir } = result;
    const client = await Client.findById(facture.clientId);
    const fournisseur = await Fournisseur.findById(facture.fournisseurId);
    
    const factureWithClient = {
      id: facture._id,
      numero: facture.numero,
      clientId: client ? client._id : undefined,
      fournisseurId: fournisseur ? fournisseur._id : undefined,
      dateEmission: facture.dateEmission,
      dateEcheance: facture.dateEcheance,
      statut: facture.statut,
      montantHT: facture.montantHT,
      montantTTC: facture.montantTTC,
      montantPaye: facture.montantPaye,
      versements: facture.versements || [],
      articles: facture.articles,
      client: client ? {
        id: client._id,
        nom: client.nom,
        prenom: client.prenom,
        entreprise: client.entreprise,
        email: client.email
      } : null,
      fournisseur: fournisseur ? {
        id: fournisseur._id,
        nom: fournisseur.nom,
        entreprise: fournisseur.entreprise,
        email: fournisseur.email
      } : null
    };

    res.status(200).json({ 
      success: true, 
      message: `Avoir de ${montantAvoir.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} créé et sortie en caisse enregistrée`,
      data: factureWithClient 
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'avoir:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Annuler une facture
// @route   PUT /api/factures/:id/cancel
// @access  Private
const cancelFacture = asyncHandler(async (req, res) => {
  const facture = await Facture.findById(req.params.id);
  if (!facture) {
    return res.status(404).json({ success: false, message: 'Facture non trouvée' });
  }
  // Supprimer les opérations de caisse liées à la facture
  await Operation.deleteMany({ factureId: facture._id });
  facture.statut = 'annulee';
  await facture.save();
  res.status(200).json({ success: true, message: 'Facture annulée et verrouillée', data: facture });
});

// @desc    Rembourser une facture
// @route   POST /api/factures/:id/refund
// @access  Private
const refundFacture = asyncHandler(async (req, res) => {
  const { montant, moyenPaiement } = req.body;
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  if (!montant || montant <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Montant de remboursement invalide' 
    });
  }
  
  if (!moyenPaiement || !['especes', 'virement', 'cheque'].includes(moyenPaiement)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Le moyen de paiement est obligatoire (espèces, virement, chèque)' 
    });
  }

  try {
    // Utiliser le service Caisse pour le remboursement
    const result = await CaisseService.rembourserFacture(req.params.id, montant, moyenPaiement, agenceId, req.user._id);
    
    const { facture, operation, montantRembourse } = result;
    const client = await Client.findById(facture.clientId);
    const fournisseur = await Fournisseur.findById(facture.fournisseurId);
    
    const factureWithClient = {
      id: facture._id,
      numero: facture.numero,
      clientId: client ? client._id : undefined,
      fournisseurId: fournisseur ? fournisseur._id : undefined,
      dateEmission: facture.dateEmission,
      dateEcheance: facture.dateEcheance,
      statut: facture.statut,
      montantHT: facture.montantHT,
      montantTTC: facture.montantTTC,
      montantPaye: facture.montantPaye,
      versements: facture.versements || [],
      articles: facture.articles,
      client: client ? {
        id: client._id,
        nom: client.nom,
        prenom: client.prenom,
        entreprise: client.entreprise,
        email: client.email
      } : null,
      fournisseur: fournisseur ? {
        id: fournisseur._id,
        nom: fournisseur.nom,
        entreprise: fournisseur.entreprise,
        email: fournisseur.email
      } : null
    };

    res.status(200).json({ 
      success: true, 
      message: `Remboursement de ${montantRembourse.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} enregistré et sortie en caisse créée`,
      data: factureWithClient 
    });
  } catch (error) {
    console.error('Erreur lors du remboursement:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Export factures to Excel
// @route   GET /api/factures/export/excel
// @access  Private
const exportFacturesToExcel = asyncHandler(async (req, res) => {
  try {
    const agenceId = req.user?.agenceId;
    const { dateDebut, dateFin, statut, clientId } = req.query;
    
    // Construire le filtre
    let filter = {};
    if (req.user.role !== 'superadmin' && agenceId) {
      filter.agenceId = agenceId;
    }
    
    if (dateDebut) {
      filter.dateEmission = { ...filter.dateEmission, $gte: new Date(dateDebut) };
    }
    if (dateFin) {
      filter.dateEmission = { ...filter.dateEmission, $lte: new Date(dateFin) };
    }
    if (statut && statut !== 'tous') {
      filter.statut = statut;
    }
    if (clientId) {
      filter.clientId = clientId;
    }
    
    // Récupérer les factures
    const factures = await Facture.find(filter)
      .populate('clientId', 'nom prenom entreprise email telephone')
      .sort({ dateEmission: -1 });
    
    // Préparer les données pour Excel
    const facturesData = factures.map(facture => ({
      'N° Facture': facture.numero,
      'Client': facture.clientId.entreprise || `${facture.clientId.prenom} ${facture.clientId.nom}`,
      'Email Client': facture.clientId.email,
      'Téléphone Client': facture.clientId.telephone,
      'Date Émission': new Date(facture.dateEmission).toLocaleDateString('fr-FR'),
      'Date Échéance': new Date(facture.dateEcheance).toLocaleDateString('fr-FR'),
      'Statut': facture.statut.charAt(0).toUpperCase() + facture.statut.slice(1).replace(/_/g, ' '),
      'Montant HT (DA)': facture.montantHT.toFixed(2),
      'Montant TTC (DA)': facture.montantTTC.toFixed(2),
      'Montant Payé (DA)': (facture.montantPaye || 0).toFixed(2),
      'Montant Restant (DA)': (facture.montantTTC - (facture.montantPaye || 0)).toFixed(2),
      'Nombre de Versements': facture.versements?.length || 0,
      'Dernière Relance': facture.lastReminder ? new Date(facture.lastReminder).toLocaleDateString('fr-FR') : 'Jamais',
      'Créé le': new Date(facture.createdAt).toLocaleDateString('fr-FR'),
      'Modifié le': new Date(facture.updatedAt).toLocaleDateString('fr-FR')
    }));
    
    // Créer le fichier Excel en mémoire
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();
    
    // Ajouter la feuille des factures
    const worksheet = XLSX.utils.json_to_sheet(facturesData);
    
    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 15 }, // N° Facture
      { wch: 25 }, // Client
      { wch: 25 }, // Email Client
      { wch: 15 }, // Téléphone Client
      { wch: 12 }, // Date Émission
      { wch: 12 }, // Date Échéance
      { wch: 15 }, // Statut
      { wch: 15 }, // Montant HT
      { wch: 15 }, // Montant TTC
      { wch: 15 }, // Montant Payé
      { wch: 15 }, // Montant Restant
      { wch: 12 }, // Nombre de Versements
      { wch: 15 }, // Dernière Relance
      { wch: 12 }, // Créé le
      { wch: 12 }  // Modifié le
    ];
    worksheet['!cols'] = columnWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Factures');
    
    // Générer le buffer Excel
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    // Configurer les headers pour le téléchargement
    const fileName = `factures_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Envoyer le fichier Excel
    res.send(buffer);
    
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export Excel',
      error: error.message
    });
  }
});

// @desc    Changer le statut de la facture à envoyée
// @route   PUT /api/factures/:id/send
// @access  Private
const sendFacture = asyncHandler(async (req, res) => {
  const facture = await Facture.findById(req.params.id);
  if (!facture) {
    return res.status(404).json({ success: false, message: 'Facture non trouvée' });
  }
  
  // Vérifier les permissions d'agence
  if (req.user.role !== 'superadmin' && facture.agenceId.toString() !== req.user.agenceId?.toString()) {
    return res.status(403).json({ success: false, message: 'Accès non autorisé à cette facture' });
  }
  
  // Si la facture était en brouillon
  if (facture.statut === 'brouillon') {
    // Si c'est une facture client
    if (facture.clientId) {
      const client = await Client.findById(facture.clientId);
      if (client) {
        const ancienSolde = client.solde || 0;
        const nouveauSolde = ancienSolde + facture.montantTTC;
        client.solde = nouveauSolde;
        await client.save();
      }
    }
    
    // Si c'est une facture fournisseur, gérer le règlement automatique
    if (facture.fournisseurId) {
      const fournisseur = await Fournisseur.findById(facture.fournisseurId);
      if (fournisseur) {
        const soldeDisponible = fournisseur.soldeCrediteur || 0;
        const montantARegler = Math.min(soldeDisponible, facture.montantTTC);
        
        if (montantARegler > 0) {
          // Mettre à jour la facture avec le montant réglé
          facture.montantPaye = montantARegler;
          facture.statut = montantARegler >= facture.montantTTC ? 'payee' : 'partiellement_payee';
          
          // Réduire le solde créditeur du fournisseur
          fournisseur.soldeCrediteur = soldeDisponible - montantARegler;
          await fournisseur.save();
          
          // Créer l'opération de règlement automatique
          const operation = new Operation({
            type: 'sortie',
            montant: montantARegler,
            description: `Règlement automatique facture ${facture.numero} - ${fournisseur.entreprise}`,
            categorie: 'paiement_fournisseur',
            date: new Date(),
            moyenPaiement: 'solde_crediteur',
            agenceId: facture.agenceId,
            fournisseurId: fournisseur._id,
            factureId: facture._id,
            userId: req.user._id,
            type_operation: 'reglement_automatique_facture'
          });
          
          await operation.save();
          
          console.log(`💰 Règlement automatique facture fournisseur: ${montantARegler.toLocaleString('fr-FR')} DA sur ${facture.montantTTC.toLocaleString('fr-FR')} DA`);
        } else {
          // Pas de solde disponible, facture en dette
          facture.statut = 'envoyee';
        }
      }
    } else {
      // Facture client normale
      facture.statut = 'envoyee';
    }
  } else {
    // Si la facture n'était pas en brouillon, juste la marquer comme envoyée
    facture.statut = 'envoyee';
  }
  
  await facture.save();
  
  // Créer un événement d'historique pour l'envoi de facture
  if (facture.clientId) {
    try {
      await Historique.creerEvenement({
        clientId: facture.clientId,
        agenceId: facture.agenceId,
        type: 'envoi_facture',
        description: `Facture ${facture.numero} envoyée au client`,
        factureData: {
          numero: facture.numero,
          montantTTC: facture.montantTTC,
          montantPaye: facture.montantPaye || 0,
          statut: facture.statut,
          dateEmission: facture.dateEmission,
          dateEcheance: facture.dateEcheance,
          articles: facture.articles || []
        },
        userId: req.user._id,
        userName: `${req.user.prenom} ${req.user.nom}`,
        metadata: {
          ancienStatut: 'brouillon',
          nouveauStatut: facture.statut
        }
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement historique:', error);
    }
  }
  
  // Log d'audit
  await createAuditLog(
    req.user._id,
    req.user.nom + ' ' + req.user.prenom,
    req.user.role,
    'SEND_FACTURE',
    `Facture N° ${facture.numero} marquée comme envoyée`,
    req,
    `facture:${facture._id}`
  );
  
  res.status(200).json({ 
    success: true, 
    message: 'Facture marquée comme envoyée', 
    data: facture 
  });
});

// @desc    Remettre une facture en brouillon si aucun versement n'a été fait
// @route   PUT /api/factures/:id/draft
// @access  Private
const setFactureToDraft = asyncHandler(async (req, res) => {
  const facture = await Facture.findById(req.params.id);
  if (!facture) {
    return res.status(404).json({ success: false, message: 'Facture non trouvée' });
  }
  
  // Vérifier les permissions d'agence
  if (req.user.role !== 'superadmin' && facture.agenceId.toString() !== req.user.agenceId?.toString()) {
    return res.status(403).json({ success: false, message: 'Accès non autorisé à cette facture' });
  }
  
  // Vérifier qu'aucun versement n'a été fait
  if (facture.versements && facture.versements.length > 0 && (facture.montantPaye || 0) > 0) {
    return res.status(400).json({ success: false, message: 'Impossible de remettre en brouillon : des versements ont déjà été enregistrés.' });
  }
  
  // Si c'est une facture client et qu'elle était envoyée, retirer le montant du solde
  if (facture.clientId && facture.statut === 'envoyee') {
    const client = await Client.findById(facture.clientId);
    if (client) {
      client.solde = Math.max(0, (client.solde || 0) - facture.montantTTC);
      await client.save();
      console.log(`Facture client remise en brouillon - Montant retiré du solde: ${facture.montantTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
    }
  }
  
  // Si c'est une facture fournisseur et qu'elle était payée partiellement ou complètement, remettre le montant dans le solde créditeur
  if (facture.fournisseurId && (facture.statut === 'payee' || facture.statut === 'partiellement_payee') && (facture.montantPaye || 0) > 0) {
    const fournisseur = await Fournisseur.findById(facture.fournisseurId);
    if (fournisseur) {
      fournisseur.soldeCrediteur = (fournisseur.soldeCrediteur || 0) + facture.montantPaye;
      await fournisseur.save();
      console.log(`Facture fournisseur remise en brouillon - Montant remis dans le solde créditeur: ${facture.montantPaye.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
    }
  }
  
  facture.statut = 'brouillon';
  facture.montantPaye = 0;
  facture.versements = [];
  await facture.save();
  
  await createAuditLog(
    req.user._id,
    req.user.nom + ' ' + req.user.prenom,
    req.user.role,
    'SET_DRAFT',
    `Facture N° ${facture.numero} remise en brouillon`,
    req,
    `facture:${facture._id}`
  );
  
  res.status(200).json({ success: true, message: 'Facture remise en brouillon', data: facture });
});

// @desc    Payer une facture fournisseur avec choix du mode de paiement
// @route   POST /api/factures/:id/payer-fournisseur
// @access  Private
const payerFactureFournisseur = asyncHandler(async (req, res) => {
  const { factureId } = req.params;
  const { 
    montantAPayer, 
    modePaiement, 
    moyenPaiement = 'especes' 
  } = req.body;
  
  const agenceId = req.user?.agenceId;
  const userId = req.user?._id;
  
  if (!agenceId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Informations utilisateur manquantes'
    });
  }
  
  if (!montantAPayer || !modePaiement) {
    return res.status(400).json({
      success: false,
      message: 'Montant et mode de paiement requis'
    });
  }
  
  try {
    // Récupérer la facture
    const facture = await Facture.findById(factureId);
    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    if (!facture.fournisseurId) {
      return res.status(400).json({
        success: false,
        message: 'Cette facture n\'est pas une facture fournisseur'
      });
    }
    
    // Effectuer le paiement
    const resultat = await FactureService.payerFactureFournisseur({
      factureId,
      fournisseurId: facture.fournisseurId,
      montantAPayer,
      modePaiement,
      moyenPaiement,
      agenceId,
      userId
    });
    
    res.status(200).json({
      success: true,
      message: 'Paiement effectué avec succès',
      data: resultat
    });
    
  } catch (error) {
    console.error('Erreur lors du paiement:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors du paiement'
    });
  }
});

// @desc    Vérifier la capacité de paiement d'un fournisseur
// @route   GET /api/factures/verifier-paiement/:fournisseurId
// @access  Private
const verifierCapacitePaiement = asyncHandler(async (req, res) => {
  const { fournisseurId } = req.params;
  const { montantFacture } = req.query;
  
  if (!fournisseurId || !montantFacture) {
    return res.status(400).json({
      success: false,
      message: 'ID fournisseur et montant facture requis'
    });
  }
  
  try {
    const capacite = await FactureService.verifierCapacitePaiement(
      fournisseurId, 
      parseFloat(montantFacture)
    );
    
    res.status(200).json({
      success: true,
      data: capacite
    });
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la vérification'
    });
  }
});

module.exports = {
  getFactures,
  getFactureById,
  createFacture,
  updateFacture,
  markFactureAsPaid,
  makePayment,
  deleteFacture,
  generateFacturePDF,
  sendFactureEmail,
  recalculateClientBalances,
  createAvoir,
  cancelFacture,
  refundFacture,
  exportFacturesToExcel,
  sendFacture,
  setFactureToDraft,
  payerFactureFournisseur,
  verifierCapacitePaiement
};