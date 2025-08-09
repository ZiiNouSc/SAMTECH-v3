const AutrePrestation = require('../models/autrePrestationModel');
const { validateObjectId } = require('../utils/validation');

// Récupérer toutes les autres prestations d'une agence
exports.getAllPrestations = async (req, res) => {
  try {
    const { agenceId } = req.user;
    
    const prestations = await AutrePrestation.find({ agenceId })
      .populate('clientId', 'nom prenom email telephone')
      .populate('agentId', 'nom prenom')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: prestations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des autres prestations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des autres prestations'
    });
  }
};

// Récupérer une prestation par ID
exports.getPrestationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de prestation invalide'
      });
    }

    const prestation = await AutrePrestation.findOne({ _id: id, agenceId })
      .populate('clientId', 'nom prenom email telephone')
      .populate('agentId', 'nom prenom');
    
    if (!prestation) {
      return res.status(404).json({
        success: false,
        message: 'Prestation non trouvée'
      });
    }

    res.json({
      success: true,
      data: prestation
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la prestation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la prestation'
    });
  }
};

// Créer une nouvelle prestation
exports.createPrestation = async (req, res) => {
  try {
    const { agenceId } = req.user;
    const {
      clientId,
      typePrestation,
      titre,
      description,
      destination,
      dateDebut,
      dateFin,
      nombrePersonnes,
      prix,
      devise,
      fournisseur,
      notes
    } = req.body;

    // Validation des champs obligatoires
    if (!clientId || !typePrestation || !titre || !description || !destination || !dateDebut || !prix) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Créer la prestation
    const newPrestation = new AutrePrestation({
      agenceId,
      clientId,
      typePrestation,
      titre,
      description,
      destination,
      dateDebut,
      dateFin,
      nombrePersonnes: nombrePersonnes || 1,
      prix,
      devise: devise || 'DA',
      fournisseur: fournisseur || '',
      notes: notes || '',
      agentId: req.user.id
    });

    await newPrestation.save();

    // Récupérer la prestation avec les données du client
    const prestationWithClient = await AutrePrestation.findById(newPrestation._id)
      .populate('clientId', 'nom prenom email telephone')
      .populate('agentId', 'nom prenom');

    res.status(201).json({
      success: true,
      message: 'Prestation créée avec succès',
      data: prestationWithClient
    });
  } catch (error) {
    console.error('Erreur lors de la création de la prestation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la prestation'
    });
  }
};

// Mettre à jour une prestation
exports.updatePrestation = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;
    const updateData = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de prestation invalide'
      });
    }

    // Vérifier si la prestation existe
    const prestation = await AutrePrestation.findOne({ _id: id, agenceId });
    
    if (!prestation) {
      return res.status(404).json({
        success: false,
        message: 'Prestation non trouvée'
      });
    }

    // Mettre à jour la prestation
    const updatedPrestation = await AutrePrestation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('clientId', 'nom prenom email telephone')
     .populate('agentId', 'nom prenom');

    res.json({
      success: true,
      message: 'Prestation mise à jour avec succès',
      data: updatedPrestation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la prestation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la prestation'
    });
  }
};

// Supprimer une prestation
exports.deletePrestation = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de prestation invalide'
      });
    }

    const prestation = await AutrePrestation.findOneAndDelete({ _id: id, agenceId });
    
    if (!prestation) {
      return res.status(404).json({
        success: false,
        message: 'Prestation non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Prestation supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la prestation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la prestation'
    });
  }
};

// Récupérer les statistiques des autres prestations
exports.getStats = async (req, res) => {
  try {
    const { agenceId } = req.user;

    const stats = await AutrePrestation.aggregate([
      { $match: { agenceId: agenceId } },
      {
        $group: {
          _id: null,
          totalPrestations: { $sum: 1 },
          prestationsEnAttente: { 
            $sum: { $cond: [{ $eq: ['$statut', 'en_attente'] }, 1, 0] } 
          },
          prestationsConfirmees: { 
            $sum: { $cond: [{ $eq: ['$statut', 'confirmee'] }, 1, 0] } 
          },
          prestationsAnnulees: { 
            $sum: { $cond: [{ $eq: ['$statut', 'annulee'] }, 1, 0] } 
          },
          prestationsTerminees: { 
            $sum: { $cond: [{ $eq: ['$statut', 'terminee'] }, 1, 0] } 
          },
          chiffreAffaires: { $sum: '$prix' }
        }
      }
    ]);

    const result = stats[0] || {
      totalPrestations: 0,
      prestationsEnAttente: 0,
      prestationsConfirmees: 0,
      prestationsAnnulees: 0,
      prestationsTerminees: 0,
      chiffreAffaires: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques autres prestations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques autres prestations'
    });
  }
}; 