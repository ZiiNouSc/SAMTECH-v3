const Manifest = require('../models/manifestModel');
const Agence = require('../models/agenceModel');
const { validateObjectId } = require('../utils/validation');
const pdfService = require('../services/pdfService');

// Récupérer tous les manifestes d'une agence
exports.getAllManifests = async (req, res) => {
  try {
    const { agenceId } = req.user;
    
    const manifests = await Manifest.find({ agenceId })
      .populate('agentId', 'nom prenom')
      .populate('passagers.clientId', 'nom prenom email telephone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: manifests
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des manifestes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des manifestes'
    });
  }
};

// Récupérer un manifeste par ID
exports.getManifestById = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de manifeste invalide'
      });
    }

    const manifest = await Manifest.findOne({ _id: id, agenceId })
      .populate('agentId', 'nom prenom')
      .populate('passagers.clientId', 'nom prenom email telephone');
    
    if (!manifest) {
      return res.status(404).json({
        success: false,
        message: 'Manifeste non trouvé'
      });
    }

    res.json({
      success: true,
      data: manifest
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du manifeste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du manifeste'
    });
  }
};

// Créer un nouveau manifeste
exports.createManifest = async (req, res) => {
  try {
    const { agenceId } = req.user;
    const {
      numeroManifest,
      compagnieTransport,
      typeTransport,
      destination,
      dateDepart,
      dateRetour,
      nombrePassagers,
      passagers,
      observations,
      notes,
      compagnieLogo,
      compagnieIataId
    } = req.body;

    // Validation des champs obligatoires
    if (!compagnieTransport || !typeTransport || !destination || !dateDepart) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Créer le manifeste
    const manifestData = {
      agenceId,
      compagnieTransport,
      typeTransport,
      destination,
      dateDepart,
      dateRetour,
      nombrePassagers: nombrePassagers || 0,
      passagers: passagers || [],
      observations: observations || '',
      notes: notes || '',
      agentId: req.user.id,
      compagnieLogo: compagnieLogo || '',
      compagnieIataId: compagnieIataId || ''
    };

    // Ajouter le numéro de manifeste seulement s'il est fourni
    if (numeroManifest) {
      manifestData.numeroManifest = numeroManifest;
    }

    const newManifest = new Manifest(manifestData);

    await newManifest.save();

    // Récupérer le manifeste avec les données complètes
    const manifestWithDetails = await Manifest.findById(newManifest._id)
      .populate('agentId', 'nom prenom')
      .populate('passagers.clientId', 'nom prenom email telephone');

    res.status(201).json({
      success: true,
      message: 'Manifeste créé avec succès',
      data: manifestWithDetails
    });
  } catch (error) {
    console.error('Erreur lors de la création du manifeste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du manifeste'
    });
  }
};

// Mettre à jour un manifeste
exports.updateManifest = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;
    const updateData = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de manifeste invalide'
      });
    }

    // Vérifier si le manifeste existe
    const manifest = await Manifest.findOne({ _id: id, agenceId });
    
    if (!manifest) {
      return res.status(404).json({
        success: false,
        message: 'Manifeste non trouvé'
      });
    }

    // Mettre à jour le manifeste
    const updatedManifest = await Manifest.findByIdAndUpdate(
      id,
      {
        ...updateData,
        compagnieLogo: updateData.compagnieLogo || manifest.compagnieLogo || '',
        compagnieIataId: updateData.compagnieIataId || manifest.compagnieIataId || ''
      },
      { new: true, runValidators: true }
    )
      .populate('agentId', 'nom prenom')
      .populate('passagers.clientId', 'nom prenom email telephone');

    res.json({
      success: true,
      message: 'Manifeste mis à jour avec succès',
      data: updatedManifest
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du manifeste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du manifeste'
    });
  }
};

// Supprimer un manifeste
exports.deleteManifest = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de manifeste invalide'
      });
    }

    const manifest = await Manifest.findOneAndDelete({ _id: id, agenceId });
    
    if (!manifest) {
      return res.status(404).json({
        success: false,
        message: 'Manifeste non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Manifeste supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du manifeste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du manifeste'
    });
  }
};

// Générer le PDF d'un manifeste
exports.generateManifestPDF = async (req, res) => {
  try {
    const manifestId = req.params.id;
    const { agenceId } = req.user;
    
    // Récupérer le manifeste avec les données complètes
    const manifest = await Manifest.findOne({ _id: manifestId, agenceId })
      .populate('agentId', 'nom prenom')
      .populate('passagers.clientId', 'nom prenom email telephone');
    
    if (!manifest) {
      return res.status(404).json({
        success: false,
        message: 'Manifeste non trouvé'
      });
    }
    
    // Récupérer l'agence
    const agence = await Agence.findById(agenceId);
    
    if (!agence) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      });
    }
    
    // Préparer les données pour le PDF
    const manifestData = {
      id: manifest._id,
      numeroManifest: manifest.numeroManifest,
      compagnieTransport: manifest.compagnieTransport,
      typeTransport: manifest.typeTransport,
      destination: manifest.destination,
      dateDepart: manifest.dateDepart,
      dateRetour: manifest.dateRetour,
      nombrePassagers: manifest.nombrePassagers,
      passagers: manifest.passagers || [],
      observations: manifest.observations,
      notes: manifest.notes,
      agent: manifest.agentId
    };
    
    // Générer le PDF avec le service
    const pdfBuffer = await pdfService.generateManifestPDF(manifestData, agence);
    
    // Configurer les headers pour l'affichage inline
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `inline; filename="manifest-${manifest.numeroManifest || manifest._id}.pdf"`,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Envoyer le PDF
    res.send(pdfBuffer);
    console.log('✅ PDF manifest envoyé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF manifest:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
      error: error.message
    });
  }
};

// Récupérer les statistiques des manifestes
exports.getStats = async (req, res) => {
  try {
    const { agenceId } = req.user;

    const stats = await Manifest.aggregate([
      { $match: { agenceId: agenceId } },
      {
        $group: {
          _id: null,
          totalManifests: { $sum: 1 },
          totalPassagers: { $sum: '$nombrePassagers' }
        }
      }
    ]);

    const result = stats[0] || {
      totalManifests: 0,
      totalPassagers: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques manifeste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques manifeste'
    });
  }
}; 