const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const caisseService = require('../services/caisseService');
const Operation = require('../models/operationModel');
const Facture = require('../models/factureModel');
const Client = require('../models/clientModel');
const Fournisseur = require('../models/fournisseurModel');
const AuditLog = require('../models/auditModel');
const CaisseService = require('../services/caisseService');

// Fonction utilitaire pour créer un log d'audit
const createAuditLog = async (userId, userName, userRole, action, details, req, affectedResource = null, oldValue = null, newValue = null) => {
  try {
    await AuditLog.createLog({
      userId,
      userName,
      userRole,
      action,
      module: 'caisse',
      details,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      affectedResource,
      oldValue,
      newValue
    });
  } catch (error) {
    console.error('Erreur lors de la création du log d\'audit:', error);
  }
};

// Fonction pour mapper les anciennes catégories vers les nouvelles
const mapCategorie = (categorie) => {
  const mapping = {
    'encaissement_facture_client': 'encaissement_facture_client',
    'encaissement_versement': 'encaissement_versement',
    'encaissement_avoir': 'encaissement_avoir',
    'encaissement_remboursement': 'encaissement_remboursement',
    'encaissement_autre': 'encaissement_autre',
    'remboursements': 'remboursement',
    'remboursement': 'remboursement',
    'avoir': 'avoir',
    'paiement_facture_fournisseur': 'paiement_fournisseur',
    'paiement_fournisseur': 'paiement_fournisseur',
    'avance_fournisseur': 'avance_fournisseur',
    'ajustement_solde_fournisseur': 'ajustement_solde_fournisseur',
    'versement': 'versement',
    'versement_facture': 'versement_facture',
    'versement_avoir': 'versement_avoir',
    'versement_remboursement': 'versement_remboursement',
    'versement_autre': 'versement_autre',
    'autre': 'autre',
    'libre': 'libre'
  };
  
  return mapping[categorie] || 'libre';
};

// @desc    Obtenir le solde de caisse
// @route   GET /api/caisse/solde
// @access  Private
const getSoldeCaisse = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  const { dateDebut, dateFin } = req.query;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    const solde = await caisseService.calculerSoldeCaisse(agenceId, dateDebut, dateFin);
  
  res.status(200).json({
    success: true,
      data: {
        total: solde.solde,
        entrees: solde.totalEntrees,
        sorties: solde.totalSorties
      }
    });
  } catch (error) {
    console.error('Erreur lors du calcul du solde:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du solde de caisse',
      error: error.message
    });
  }
});

// @desc    Obtenir le rapport de caisse
// @route   GET /api/caisse/rapport
// @access  Private
const getRapportCaisse = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  const { dateDebut, dateFin } = req.query;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    const rapport = await caisseService.rapportCaisse(agenceId, dateDebut, dateFin);

  res.status(200).json({
    success: true,
      data: rapport
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport de caisse',
      error: error.message
    });
  }
});

// @desc    Enregistrer une entrée en caisse
// @route   POST /api/caisse/entree
// @access  Private
const enregistrerEntree = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  const userId = req.user?.id;
  const userName = req.user?.nom;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  const data = {
    ...req.body,
    agenceId,
    userId
  };

  try {
    const result = await CaisseService.enregistrerEntree(data);
    // Si c'est une remise sur dette, le service renvoie un objet custom
    if (result && result.success && result.message === 'Remise sur dette enregistrée') {
      return res.status(200).json(result);
    }
    // Sinon, c'est une opération caisse normale
    return res.status(201).json({
      success: true,
      message: 'Entrée enregistrée avec succès',
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'entrée:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement de l\'entrée',
      error: error.message
    });
  }
});

// @desc    Enregistrer une sortie en caisse
// @route   POST /api/caisse/sortie
// @access  Private
const enregistrerSortie = asyncHandler(async (req, res) => {
  const { montant, description, categorie, modePaiement, fournisseurId, factureId } = req.body;
  const agenceId = req.user?.agenceId;
  const userId = req.user?.id;
  const userName = req.user?.nom;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  // Validation des données
  if (!montant || montant <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Le montant doit être supérieur à 0'
    });
  }

  if (!description || !categorie || !modePaiement) {
    return res.status(400).json({
      success: false,
      message: 'Tous les champs obligatoires doivent être remplis'
    });
  }
  
  // Validation spécifique pour les opérations fournisseurs
  if ((categorie === 'avance_fournisseur' || categorie === 'paiement_fournisseur') && !fournisseurId) {
    return res.status(400).json({
      success: false,
      message: 'Le fournisseur est obligatoire pour les opérations fournisseurs'
    });
  }

  try {
    // Utiliser le service qui gère la logique métier
    const operationSauvegardee = await CaisseService.enregistrerSortie({
      montant,
      description,
      categorie,
      modePaiement,
      agenceId,
      userId,
      fournisseurId,
      factureId
    });

    // Log d'audit
    await createAuditLog(
      userId,
      userName,
      req.user?.role,
      'caisse_sortie',
      `Sortie en caisse: ${montant} DA - ${categorie}`,
      req,
      'operation',
      null,
      operationSauvegardee
    );

    res.status(201).json({
      success: true,
      message: 'Sortie enregistrée avec succès',
      data: operationSauvegardee
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la sortie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement de la sortie',
      error: error.message
    });
  }
});

// @desc    Obtenir toutes les opérations de caisse
// @route   GET /api/caisse/operations
// @access  Private
const getOperations = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  const { 
    page = 1, 
    limit = 20, 
    type, 
    categorie, 
    dateDebut, 
    dateFin,
    moyenPaiement,
    clientId,
    fournisseurId,
    factureId
  } = req.query;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  try {
    // Construire le filtre
    const filter = { agenceId };
    
    if (type && ['entree', 'sortie'].includes(type)) {
      filter.type = type;
    }
    
    if (categorie && categorie !== 'toutes') {
      filter.categorie = categorie;
    }
    
    if (moyenPaiement && ['especes', 'virement', 'cheque'].includes(moyenPaiement)) {
      filter.modePaiement = moyenPaiement;
    }
    
    if (clientId) {
      filter.clientId = clientId;
    }
    
    if (fournisseurId) {
      filter.fournisseurId = fournisseurId;
    }
    
    if (factureId) {
      filter.factureId = factureId;
    }
    
    if (dateDebut || dateFin) {
      filter.date = {};
      if (dateDebut) filter.date.$gte = new Date(dateDebut);
      if (dateFin) filter.date.$lte = new Date(dateFin);
    }

    // Calculer la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Récupérer les opérations
    const operations = await Operation.aggregate([
      { $match: filter },
      {
        $addFields: {
          // Ajouter des valeurs par défaut pour les champs manquants
          modePaiement: { $ifNull: ['$modePaiement', 'especes'] },
          categorie: { $ifNull: ['$categorie', 'libre'] }
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'clientId'
        }
      },
      {
        $lookup: {
          from: 'fournisseurs',
          localField: 'fournisseurId',
          foreignField: '_id',
          as: 'fournisseurId'
        }
      },
      {
        $lookup: {
          from: 'factures',
          localField: 'factureId',
          foreignField: '_id',
          as: 'factureId'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      {
        $addFields: {
          clientId: { $arrayElemAt: ['$clientId', 0] },
          fournisseurId: { $arrayElemAt: ['$fournisseurId', 0] },
          factureId: { $arrayElemAt: ['$factureId', 0] },
          userId: { $arrayElemAt: ['$userId', 0] }
        }
      },
      { $sort: { date: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Compter le total
    const totalResult = await Operation.aggregate([
      { $match: filter },
      { $count: 'total' }
    ]);
    const total = totalResult[0]?.total || 0;

    // Calculer les statistiques
    const stats = await Operation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalEntrees: {
            $sum: {
              $cond: [{ $eq: ['$type', 'entree'] }, '$montant', 0]
            }
          },
          totalSorties: {
            $sum: {
              $cond: [{ $eq: ['$type', 'sortie'] }, '$montant', 0]
            }
          },
          nombreOperations: { $sum: 1 }
        }
      }
    ]);

    const statistiques = stats[0] || {
      totalEntrees: 0,
      totalSorties: 0,
      nombreOperations: 0
    };

    res.status(200).json({
    success: true,
      data: {
        operations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        statistiques: {
          ...statistiques,
          solde: statistiques.totalEntrees - statistiques.totalSorties
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des opérations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des opérations',
      error: error.message
    });
  }
});

// @desc    Obtenir une opération par ID
// @route   GET /api/caisse/operations/:id
// @access  Private
const getOperationById = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    const operation = await Operation.findOne({
      _id: req.params.id,
      agenceId
    })
    .populate('clientId', 'nom prenom entreprise email telephone')
    .populate('fournisseurId', 'nom entreprise email')
    .populate('factureId', 'numero montantTTC montantPaye statut');
  
  if (!operation) {
    return res.status(404).json({
      success: false,
      message: 'Opération non trouvée'
    });
  }

    res.status(200).json({
      success: true,
      data: operation
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'opération:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'opération',
      error: error.message
    });
  }
});

// @desc    Annuler une opération
// @route   PUT /api/caisse/operations/:id/annuler
// @access  Private
const annulerOperation = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    const result = await caisseService.annulerOperation(req.params.id, agenceId);
  
  res.status(200).json({
    success: true,
      message: 'Opération annulée avec succès',
      data: {
        operationAnnulee: result.operationAnnulee,
        operationAnnulation: result.operationAnnulation
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'opération:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Modifier une opération de caisse
// @route   PUT /api/caisse/operations/:id
// @access  Private
const modifierOperation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agenceId = req.user?.agenceId;
  const {
    montant,
    description,
    categorie,
    reference,
    moyenPaiement,
    date
  } = req.body;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'opération invalide'
    });
  }

  try {
    // Vérifier que l'opération existe et appartient à l'agence
    const operation = await Operation.findOne({ _id: id, agenceId });
  
  if (!operation) {
    return res.status(404).json({
      success: false,
      message: 'Opération non trouvée'
    });
  }

    // Vérifier que l'opération n'est pas liée à une facture (non modifiable)
    if (operation.factureId) {
      return res.status(400).json({
      success: false,
        message: 'Impossible de modifier une opération liée à une facture'
      });
    }

    // Sauvegarder les anciennes valeurs pour l'audit
    const oldValues = {
      montant: operation.montant,
      description: operation.description,
      categorie: operation.categorie,
      reference: operation.reference,
      moyenPaiement: operation.moyenPaiement,
      date: operation.date
    };

    // Mapper la catégorie si nécessaire
    const categorieMapped = categorie ? mapCategorie(categorie) : operation.categorie;

    // Mettre à jour l'opération
    const operationModifiee = await Operation.findByIdAndUpdate(
      id,
      {
        montant: montant || operation.montant,
        description: description || operation.description,
        categorie: categorieMapped,
        reference: reference !== undefined ? reference : operation.reference,
        moyenPaiement: moyenPaiement || operation.moyenPaiement,
        date: date || operation.date,
        modifiePar: req.user._id,
        dateModification: new Date()
      },
      { new: true, runValidators: true }
    ).populate('clientId', 'nom prenom entreprise')
     .populate('fournisseurId', 'nom entreprise')
     .populate('factureId', 'numero');

    // Créer un log d'audit
  await createAuditLog(
    req.user._id,
      `${req.user.prenom} ${req.user.nom}`,
    req.user.role,
      'modification_operation',
      `Modification de l'opération ${operationModifiee._id}`,
      req,
      `operation:${operationModifiee._id}`,
      oldValues,
      {
        montant: operationModifiee.montant,
        description: operationModifiee.description,
        categorie: operationModifiee.categorie,
        reference: operationModifiee.reference,
        moyenPaiement: operationModifiee.moyenPaiement,
        date: operationModifiee.date
      }
  );
  
  res.status(200).json({
    success: true,
      message: 'Opération modifiée avec succès',
      data: operationModifiee
    });
  } catch (error) {
    console.error('Erreur lors de la modification de l\'opération:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la modification de l\'opération'
    });
  }
});

// @desc    Obtenir les statistiques de caisse
// @route   GET /api/caisse/statistiques
// @access  Private
const getStatistiques = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  const { dateDebut, dateFin } = req.query;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    // Statistiques par catégorie
    const statsParCategorie = await Operation.aggregate([
      {
        $match: {
          agenceId: new mongoose.Types.ObjectId(agenceId),
          ...(dateDebut || dateFin ? {
            date: {
              ...(dateDebut && { $gte: new Date(dateDebut) }),
              ...(dateFin && { $lte: new Date(dateFin) })
            }
          } : {})
        }
      },
      {
        $addFields: {
          // Ajouter des valeurs par défaut pour les champs manquants
          modePaiement: { $ifNull: ['$modePaiement', 'especes'] },
          categorie: { $ifNull: ['$categorie', 'libre'] }
        }
      },
      {
        $group: {
          _id: '$categorie',
          totalEntrees: {
            $sum: {
              $cond: [{ $eq: ['$type', 'entree'] }, '$montant', 0]
            }
          },
          totalSorties: {
            $sum: {
              $cond: [{ $eq: ['$type', 'sortie'] }, '$montant', 0]
            }
          },
          nombreOperations: { $sum: 1 }
        }
      },
      {
        $project: {
          categorie: '$_id',
          totalEntrees: 1,
          totalSorties: 1,
          solde: { $subtract: ['$totalEntrees', '$totalSorties'] },
          nombreOperations: 1
        }
      },
      { $sort: { solde: -1 } }
    ]);

    // Statistiques par moyen de paiement
    const statsParMoyenPaiement = await Operation.aggregate([
      {
        $match: {
          agenceId: new mongoose.Types.ObjectId(agenceId),
          ...(dateDebut || dateFin ? {
            date: {
              ...(dateDebut && { $gte: new Date(dateDebut) }),
              ...(dateFin && { $lte: new Date(dateFin) })
            }
          } : {})
        }
      },
      {
        $addFields: {
          // Ajouter des valeurs par défaut pour les champs manquants
          modePaiement: { $ifNull: ['$modePaiement', 'especes'] },
          categorie: { $ifNull: ['$categorie', 'libre'] }
        }
      },
      {
        $group: {
          _id: '$modePaiement',
          totalEntrees: {
            $sum: {
              $cond: [{ $eq: ['$type', 'entree'] }, '$montant', 0]
            }
          },
          totalSorties: {
            $sum: {
              $cond: [{ $eq: ['$type', 'sortie'] }, '$montant', 0]
            }
          },
          nombreOperations: { $sum: 1 }
        }
      },
      {
        $project: {
          modePaiement: '$_id',
          totalEntrees: 1,
          totalSorties: 1,
          solde: { $subtract: ['$totalEntrees', '$totalSorties'] },
          nombreOperations: 1
        }
      },
      { $sort: { nombreOperations: -1 } }
    ]);

    // Statistiques par jour (7 derniers jours)
    const statsParJour = await Operation.aggregate([
      {
        $match: {
          agenceId: new mongoose.Types.ObjectId(agenceId),
          date: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          totalEntrees: {
            $sum: {
              $cond: [{ $eq: ['$type', 'entree'] }, '$montant', 0]
            }
          },
          totalSorties: {
            $sum: {
              $cond: [{ $eq: ['$type', 'sortie'] }, '$montant', 0]
            }
          },
          nombreOperations: { $sum: 1 }
        }
      },
      {
        $project: {
          date: '$_id',
          totalEntrees: 1,
          totalSorties: 1,
          solde: { $subtract: ['$totalEntrees', '$totalSorties'] },
          nombreOperations: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Statistiques globales (tous moyens, toutes catégories)
    const statsGlobales = await Operation.aggregate([
      {
        $match: {
          agenceId: new mongoose.Types.ObjectId(agenceId),
          ...(dateDebut || dateFin ? {
            date: {
              ...(dateDebut && { $gte: new Date(dateDebut) }),
              ...(dateFin && { $lte: new Date(dateFin) })
            }
          } : {})
        }
      },
      {
        $group: {
          _id: null,
          totalEntrees: {
            $sum: {
              $cond: [{ $eq: ['$type', 'entree'] }, '$montant', 0]
            }
          },
          totalSorties: {
            $sum: {
              $cond: [{ $eq: ['$type', 'sortie'] }, '$montant', 0]
            }
          }
        }
      }
    ]);
    const totalEntrees = statsGlobales[0]?.totalEntrees || 0;
    const totalSorties = statsGlobales[0]?.totalSorties || 0;

  res.status(200).json({
    success: true,
      data: {
        parCategorie: statsParCategorie,
        parMoyenPaiement: statsParMoyenPaiement,
        parJour: statsParJour,
        totalEntrees,
        totalSorties
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

module.exports = {
  getSoldeCaisse,
  getRapportCaisse,
  enregistrerEntree,
  enregistrerSortie,
  getOperations,
  getOperationById,
  annulerOperation,
  modifierOperation,
  getStatistiques,
  createAuditLog
};