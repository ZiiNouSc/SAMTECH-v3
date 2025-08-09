const asyncHandler = require('express-async-handler');
const Fournisseur = require('../models/fournisseurModel');
const FournisseurService = require('../services/fournisseurService');

// @desc    Récupérer tous les fournisseurs avec leurs soldes calculés dynamiquement
// @route   GET /api/fournisseurs
// @access  Private
const getFournisseurs = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    // Utiliser le service pour calculer dynamiquement les soldes
    const fournisseurs = await FournisseurService.getSyntheseFournisseurs(agenceId);

    // Trier par date de création (plus récent en premier)
    fournisseurs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: fournisseurs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des fournisseurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des fournisseurs',
      error: error.message
    });
  }
});

// @desc    Récupérer un fournisseur par ID avec ses soldes calculés
// @route   GET /api/fournisseurs/:id
// @access  Private
const getFournisseurById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agenceId = req.user?.agenceId;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    // Récupérer directement le fournisseur depuis la base de données
    const fournisseur = await Fournisseur.findOne({ _id: id, agenceId });

    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: fournisseur
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du fournisseur',
      error: error.message
    });
  }
});

// @desc    Créer un nouveau fournisseur
// @route   POST /api/fournisseurs
// @access  Private
const createFournisseur = asyncHandler(async (req, res) => {
  const { 
    nom, 
    entreprise, 
    email, 
    telephone, 
    adresse, 
    codePostal, 
    ville, 
    pays, 
    nif,
    nis,
    art,
    siret, 
    tva, 
    notes,
    detteFournisseur, 
    soldeCrediteur
  } = req.body;
  
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  if (!entreprise) {
    return res.status(400).json({
      success: false,
      message: 'Le nom de l\'entreprise est obligatoire'
    });
  }

  try {
    // Vérifier si l'email existe déjà (si email fourni)
    if (email) {
      const existingFournisseur = await Fournisseur.findOne({ 
        email: { $regex: new RegExp(`^${email}$`, 'i') }, 
        agenceId 
      });
      if (existingFournisseur) {
        return res.status(400).json({
          success: false,
          message: 'Un fournisseur avec cet email existe déjà'
        });
      }
    }

    const fournisseur = await Fournisseur.create({
      nom: nom || '',
      entreprise,
      email: email || '',
      telephone: telephone || '',
      adresse: adresse || '',
      codePostal: codePostal || '',
      ville: ville || '',
      pays: pays || 'Algérie',
      nif: nif || '',
      nis: nis || '',
      art: art || '',
      siret: siret || '',
      tva: tva || '',
      notes: notes || '',
      agenceId,
      detteFournisseur: detteFournisseur || 0,
      soldeCrediteur: soldeCrediteur || 0,
      services: req.body.services || [],
      autresService: req.body.autresService || '',
      commissionRules: req.body.commissionRules || [],
      rtsRules: req.body.rtsRules || []
    });

    res.status(201).json({
      success: true,
      message: 'Fournisseur créé avec succès',
      data: fournisseur
    });
  } catch (error) {
    console.error('Erreur lors de la création du fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du fournisseur',
      error: error.message
    });
  }
});

// @desc    Mettre à jour un fournisseur
// @route   PUT /api/fournisseurs/:id
// @access  Private
const updateFournisseur = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agenceId = req.user?.agenceId;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    const fournisseur = await Fournisseur.findOne({ _id: id, agenceId });

    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }

    // Mettre à jour les champs
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        fournisseur[key] = req.body[key];
      }
    });

    const updatedFournisseur = await fournisseur.save();

    res.status(200).json({
      success: true,
      message: 'Fournisseur mis à jour avec succès',
      data: updatedFournisseur
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du fournisseur',
      error: error.message
    });
  }
});

// @desc    Supprimer un fournisseur
// @route   DELETE /api/fournisseurs/:id
// @access  Private
const deleteFournisseur = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agenceId = req.user?.agenceId;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    const fournisseur = await Fournisseur.findOne({ _id: id, agenceId });

    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }

    await Fournisseur.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Fournisseur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du fournisseur',
      error: error.message
    });
  }
});

// @desc    Exporter les fournisseurs en Excel
// @route   GET /api/fournisseurs/export-excel
// @access  Private
const exportFournisseursToExcel = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    // Utiliser le service pour obtenir les données avec les soldes calculés
    const fournisseurs = await FournisseurService.getSyntheseFournisseurs(agenceId);

    // Pour l'instant, retourner les données en JSON
    // L'export Excel peut être implémenté plus tard
    res.status(200).json({
      success: true,
      data: fournisseurs
    });
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export',
      error: error.message
    });
  }
});

// @desc    Récupérer l'historique d'un fournisseur
// @route   GET /api/fournisseurs/:id/history
// @access  Private
const getFournisseurHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agenceId = req.user?.agenceId;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    const fournisseur = await Fournisseur.findOne({ _id: id, agenceId });

    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }

    // Pour l'instant, retourner les données du fournisseur
    // L'historique peut être implémenté plus tard
    res.status(200).json({
      success: true,
      data: fournisseur
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
});

// @desc    Récupérer les statistiques d'un fournisseur
// @route   GET /api/fournisseurs/:id/stats
// @access  Private
const getFournisseurStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agenceId = req.user?.agenceId;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    // Utiliser le service pour obtenir les données avec les soldes calculés
    const fournisseur = await FournisseurService.getSyntheseFournisseur(id, agenceId);

    res.status(200).json({
      success: true,
      data: {
        fournisseur: {
          id: fournisseur._id,
          nom: fournisseur.nom,
          entreprise: fournisseur.entreprise,
          email: fournisseur.email
        },
        soldes: {
          detteCalculee: fournisseur.detteCalculee,
          soldeCalcule: fournisseur.soldeCalcule,
          detteInitiale: fournisseur.detteFournisseur,
          soldeInitial: fournisseur.soldeCrediteur
        },
        debug: fournisseur._debug
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

// Fonction utilitaire pour normaliser les champs (trim, lowercase) et ALL universel
function normalizeAll(val) {
  const v = (val || '').toString().trim().toLowerCase();
  if (["all", "tous", "toutes", "toute", "tout", ""].includes(v)) return "all";
  return v;
}

// Ajout d'une règle de commission sans écraser les autres
const addCommissionRule = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByIdAndUpdate(
      req.params.id,
      { $push: { commissionRules: req.body } },
      { new: true }
    );
    res.json({ success: true, data: fournisseur });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFournisseurs,
  getFournisseurById,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
  exportFournisseursToExcel,
  getFournisseurHistory,
  getFournisseurStats,
  addCommissionRule
}; 