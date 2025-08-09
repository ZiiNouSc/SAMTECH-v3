const Visa = require('../models/visaModel');
const { validateObjectId } = require('../utils/validation');

// Récupérer toutes les demandes de visa d'une agence
exports.getAllVisas = async (req, res) => {
  try {
    const { agenceId } = req.user;
    
    const visas = await Visa.find({ agenceId })
      .populate('clientId', 'nom prenom email telephone')
      .populate('agentId', 'nom prenom')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: visas
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des visas:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des visas'
    });
  }
};

// Récupérer toutes les demandes de visa non facturées
exports.getNonFactures = async (req, res) => {
  try {
    const { agenceId } = req.user;
    
    const visas = await Visa.find({ 
      agenceId,
      factureClientId: { $exists: false },
      statut: { $in: ['approuve', 'approuvé', 'approved', 'delivre', 'délivré'] }
    })
      .populate('clientId', 'nom prenom email telephone')
      .sort({ createdAt: -1 });

    const visasFormats = visas.map(visa => ({
      id: visa._id,
      _id: visa._id,
      typeVisa: visa.typeVisa,
      pays: visa.pays,
      duree: visa.duree,
      dateDebut: visa.dateDebut,
      dateFin: visa.dateFin,
      prix: visa.prix,
      statut: visa.statut,
      clientNom: visa.clientId ? `${visa.clientId.prenom} ${visa.clientId.nom}` : '',
      numeroPasseport: visa.numeroPasseport,
      informations: visa.informations
    }));

    res.json({
      success: true,
      count: visasFormats.length,
      data: visasFormats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des visas non facturés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des visas non facturés'
    });
  }
};

// Récupérer un visa par ID
exports.getVisaById = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de visa invalide'
      });
    }

    const visa = await Visa.findOne({ _id: id, agenceId })
      .populate('clientId', 'nom prenom email telephone')
      .populate('agentId', 'nom prenom');
    
    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'Visa non trouvé'
      });
    }

    res.json({
      success: true,
      data: visa
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du visa:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du visa'
    });
  }
};

// Créer une nouvelle demande de visa
exports.createVisa = async (req, res) => {
  try {
    const { agenceId } = req.user;
    const {
      clientId,
      paysDestination,
      typeVisa,
      dureeSejour,
      dateDepart,
      dateRetour,
      nombrePersonnes,
      documentsFournis,
      prix,
      devise,
      fraisConsulaire,
      fraisService,
      notes
    } = req.body;

    // Validation des champs obligatoires
    if (!clientId || !paysDestination || !typeVisa || !dureeSejour || !dateDepart || !dateRetour || !prix) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Créer la demande de visa
    const newVisa = new Visa({
      agenceId,
      clientId,
      paysDestination,
      typeVisa,
      dureeSejour,
      dateDepart,
      dateRetour,
      nombrePersonnes: nombrePersonnes || 1,
      documentsFournis: documentsFournis || [],
      prix,
      devise: devise || 'DA',
      fraisConsulaire: fraisConsulaire || 0,
      fraisService: fraisService || 0,
      notes: notes || '',
      agentId: req.user.id
    });

    await newVisa.save();

    // Récupérer le visa avec les données du client
    const visaWithClient = await Visa.findById(newVisa._id)
      .populate('clientId', 'nom prenom email telephone')
      .populate('agentId', 'nom prenom');

    res.status(201).json({
      success: true,
      message: 'Demande de visa créée avec succès',
      data: visaWithClient
    });
  } catch (error) {
    console.error('Erreur lors de la création du visa:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du visa'
    });
  }
};

// Mettre à jour une demande de visa
exports.updateVisa = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;
    const updateData = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de visa invalide'
      });
    }

    // Vérifier si le visa existe
    const visa = await Visa.findOne({ _id: id, agenceId });
    
    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'Visa non trouvé'
      });
    }

    // Mettre à jour le visa
    const updatedVisa = await Visa.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('clientId', 'nom prenom email telephone')
     .populate('agentId', 'nom prenom');

    res.json({
      success: true,
      message: 'Visa mis à jour avec succès',
      data: updatedVisa
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du visa:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du visa'
    });
  }
};

// Supprimer une demande de visa
exports.deleteVisa = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de visa invalide'
      });
    }

    const visa = await Visa.findOneAndDelete({ _id: id, agenceId });
    
    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'Visa non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Visa supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du visa:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du visa'
    });
  }
};

// Récupérer les statistiques des visas
exports.getStats = async (req, res) => {
  try {
    const { agenceId } = req.user;

    const stats = await Visa.aggregate([
      { $match: { agenceId: agenceId } },
      {
        $group: {
          _id: null,
          totalVisas: { $sum: 1 },
          visasEnPreparation: { 
            $sum: { $cond: [{ $eq: ['$statut', 'en_preparation'] }, 1, 0] } 
          },
          visasSoumis: { 
            $sum: { $cond: [{ $eq: ['$statut', 'soumis'] }, 1, 0] } 
          },
          visasEnCours: { 
            $sum: { $cond: [{ $eq: ['$statut', 'en_cours'] }, 1, 0] } 
          },
          visasApprouves: { 
            $sum: { $cond: [{ $eq: ['$statut', 'approuve'] }, 1, 0] } 
          },
          visasRefuses: { 
            $sum: { $cond: [{ $eq: ['$statut', 'refuse'] }, 1, 0] } 
          },
          visasAnnules: { 
            $sum: { $cond: [{ $eq: ['$statut', 'annule'] }, 1, 0] } 
          },
          chiffreAffaires: { $sum: '$prix' }
        }
      }
    ]);

    const result = stats[0] || {
      totalVisas: 0,
      visasEnPreparation: 0,
      visasSoumis: 0,
      visasEnCours: 0,
      visasApprouves: 0,
      visasRefuses: 0,
      visasAnnules: 0,
      chiffreAffaires: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques visa:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques visa'
    });
  }
}; 