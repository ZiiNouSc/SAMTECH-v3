const Assurance = require('../models/assuranceModel');
const { validateObjectId } = require('../utils/validation');

// Récupérer toutes les assurances d'une agence
exports.getAllAssurances = async (req, res) => {
  try {
    const { agenceId } = req.user;
    
    const assurances = await Assurance.find({ agenceId })
      .populate('clientId', 'nom prenom email telephone')
      .populate('agentId', 'nom prenom')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: assurances
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des assurances:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des assurances'
    });
  }
};

// Récupérer toutes les assurances non facturées
exports.getNonFactures = async (req, res) => {
  try {
    const { agenceId } = req.user;
    
    const assurances = await Assurance.find({ 
      agenceId,
      factureClientId: { $exists: false },
      statut: { $in: ['active', 'confirmée', 'confirme', 'confirmed'] }
    })
      .populate('clientId', 'nom prenom email telephone')
      .sort({ createdAt: -1 });

    const assurancesFormatees = assurances.map(assurance => ({
      id: assurance._id,
      _id: assurance._id,
      typeAssurance: assurance.typeAssurance,
      compagnieAssurance: assurance.compagnieAssurance,
      numeroPolice: assurance.numeroPolice,
      dateDebut: assurance.dateDebut,
      dateFin: assurance.dateFin,
      montantCouverture: assurance.montantCouverture,
      prime: assurance.prime,
      statut: assurance.statut,
      clientNom: assurance.clientId ? `${assurance.clientId.prenom} ${assurance.clientId.nom}` : '',
      informations: assurance.informations
    }));

    res.json({
      success: true,
      count: assurancesFormatees.length,
      data: assurancesFormatees
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des assurances non facturées:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des assurances non facturées'
    });
  }
};

// Récupérer une assurance par ID
exports.getAssuranceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'assurance invalide'
      });
    }

    const assurance = await Assurance.findOne({ _id: id, agenceId })
      .populate('clientId', 'nom prenom email telephone')
      .populate('agentId', 'nom prenom');
    
    if (!assurance) {
      return res.status(404).json({
        success: false,
        message: 'Assurance non trouvée'
      });
    }

    res.json({
      success: true,
      data: assurance
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'assurance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'assurance'
    });
  }
};

// Créer une nouvelle assurance
exports.createAssurance = async (req, res) => {
  try {
    const { agenceId } = req.user;
    const {
      clientId,
      compagnieAssurance,
      typeAssurance,
      paysDestination,
      dateDepart,
      dateRetour,
      nombrePersonnes,
      montantAssure,
      prime,
      devise,
      conditions,
      exclusions,
      notes
    } = req.body;

    // Validation des champs obligatoires
    if (!clientId || !compagnieAssurance || !typeAssurance || !paysDestination || 
        !dateDepart || !dateRetour || !montantAssure || !prime) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Créer l'assurance
    const newAssurance = new Assurance({
      agenceId,
      clientId,
      compagnieAssurance,
      typeAssurance,
      paysDestination,
      dateDepart,
      dateRetour,
      nombrePersonnes: nombrePersonnes || 1,
      montantAssure,
      prime,
      devise: devise || 'DA',
      conditions: conditions || '',
      exclusions: exclusions || '',
      notes: notes || '',
      agentId: req.user.id
    });

    await newAssurance.save();

    // Récupérer l'assurance avec les données du client
    const assuranceWithClient = await Assurance.findById(newAssurance._id)
      .populate('clientId', 'nom prenom email telephone')
      .populate('agentId', 'nom prenom');

    res.status(201).json({
      success: true,
      message: 'Assurance créée avec succès',
      data: assuranceWithClient
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'assurance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'assurance'
    });
  }
};

// Mettre à jour une assurance
exports.updateAssurance = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;
    const updateData = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'assurance invalide'
      });
    }

    // Vérifier si l'assurance existe
    const assurance = await Assurance.findOne({ _id: id, agenceId });
    
    if (!assurance) {
      return res.status(404).json({
        success: false,
        message: 'Assurance non trouvée'
      });
    }

    // Mettre à jour l'assurance
    const updatedAssurance = await Assurance.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('clientId', 'nom prenom email telephone')
     .populate('agentId', 'nom prenom');

    res.json({
      success: true,
      message: 'Assurance mise à jour avec succès',
      data: updatedAssurance
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'assurance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'assurance'
    });
  }
};

// Supprimer une assurance
exports.deleteAssurance = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'assurance invalide'
      });
    }

    const assurance = await Assurance.findOneAndDelete({ _id: id, agenceId });
    
    if (!assurance) {
      return res.status(404).json({
        success: false,
        message: 'Assurance non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Assurance supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'assurance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'assurance'
    });
  }
};

// Récupérer les statistiques des assurances
exports.getStats = async (req, res) => {
  try {
    const { agenceId } = req.user;

    const stats = await Assurance.aggregate([
      { $match: { agenceId: agenceId } },
      {
        $group: {
          _id: null,
          totalAssurances: { $sum: 1 },
          assurancesEnAttente: { 
            $sum: { $cond: [{ $eq: ['$statut', 'en_attente'] }, 1, 0] } 
          },
          assurancesActives: { 
            $sum: { $cond: [{ $eq: ['$statut', 'active'] }, 1, 0] } 
          },
          assurancesExpirees: { 
            $sum: { $cond: [{ $eq: ['$statut', 'expiree'] }, 1, 0] } 
          },
          assurancesAnnulees: { 
            $sum: { $cond: [{ $eq: ['$statut', 'annulee'] }, 1, 0] } 
          },
          assurancesResiliees: { 
            $sum: { $cond: [{ $eq: ['$statut', 'resiliee'] }, 1, 0] } 
          },
          chiffreAffaires: { $sum: '$prime' }
        }
      }
    ]);

    const result = stats[0] || {
      totalAssurances: 0,
      assurancesEnAttente: 0,
      assurancesActives: 0,
      assurancesExpirees: 0,
      assurancesAnnulees: 0,
      assurancesResiliees: 0,
      chiffreAffaires: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques assurance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques assurance'
    });
  }
}; 