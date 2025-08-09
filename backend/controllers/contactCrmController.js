const ContactCrm = require('../models/contactCrmModel');
const { validateObjectId } = require('../utils/validation');

// Récupérer tous les contacts CRM d'une agence
exports.getAllContacts = async (req, res) => {
  try {
    const { agenceId } = req.user;
    
    const contacts = await ContactCrm.find({ agenceId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts CRM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des contacts CRM'
    });
  }
};

// Récupérer un contact CRM par ID
exports.getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de contact invalide'
      });
    }

    const contact = await ContactCrm.findOne({ _id: id, agenceId });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact CRM non trouvé'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du contact CRM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contact CRM'
    });
  }
};

// Créer un nouveau contact CRM
exports.createContact = async (req, res) => {
  try {
    const { agenceId } = req.user;
    const {
      nom,
      prenom,
      entreprise,
      email,
      telephone,
      statut,
      source,
      score,
      notes
    } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !telephone) {
      return res.status(400).json({
        success: false,
        message: 'Les champs nom, prénom, email et téléphone sont obligatoires'
      });
    }

    // Vérifier si l'email existe déjà pour cette agence
    const existingContact = await ContactCrm.findOne({ 
      agenceId, 
      email: email.toLowerCase() 
    });

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Un contact avec cet email existe déjà'
      });
    }

    // Créer le contact CRM
    const newContact = new ContactCrm({
      agenceId,
      nom,
      prenom,
      entreprise: entreprise || null,
      email: email.toLowerCase(),
      telephone,
      statut: statut || 'prospect',
      source: source || 'site_web',
      score: score || null,
      notes: notes || '',
      interactions: [
        {
          type: 'rencontre',
          description: 'Premier contact - création du prospect',
          resultat: 'positif'
        }
      ],
      isClient: false
    });

    await newContact.save();

    res.status(201).json({
      success: true,
      message: 'Contact CRM créé avec succès',
      data: newContact
    });
  } catch (error) {
    console.error('Erreur lors de la création du contact CRM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du contact CRM'
    });
  }
};

// Mettre à jour un contact CRM
exports.updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;
    const updateData = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de contact invalide'
      });
    }

    // Vérifier si le contact existe
    const contact = await ContactCrm.findOne({ _id: id, agenceId });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact CRM non trouvé'
      });
    }

    // Mettre à jour le contact
    const updatedContact = await ContactCrm.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Contact CRM mis à jour avec succès',
      data: updatedContact
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contact CRM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du contact CRM'
    });
  }
};

// Supprimer un contact CRM
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de contact invalide'
      });
    }

    const contact = await ContactCrm.findOneAndDelete({ _id: id, agenceId });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact CRM non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Contact CRM supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du contact CRM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du contact CRM'
    });
  }
};

// Ajouter une interaction à un contact
exports.addInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;
    const { type, description, resultat } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de contact invalide'
      });
    }

    if (!type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Le type et la description sont obligatoires'
      });
    }

    const contact = await ContactCrm.findOne({ _id: id, agenceId });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact CRM non trouvé'
      });
    }

    // Ajouter l'interaction
    contact.interactions.push({
      type,
      description,
      resultat: resultat || 'positif'
    });

    // Mettre à jour la dernière interaction
    contact.derniereInteraction = new Date();

    await contact.save();

    res.json({
      success: true,
      message: 'Interaction ajoutée avec succès',
      data: contact
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'interaction'
    });
  }
};

// Récupérer les statistiques CRM
exports.getStats = async (req, res) => {
  try {
    const { agenceId } = req.user;

    const stats = await ContactCrm.aggregate([
      { $match: { agenceId: agenceId } },
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          prospects: { 
            $sum: { $cond: [{ $eq: ['$statut', 'prospect'] }, 1, 0] } 
          },
          clients: { 
            $sum: { $cond: [{ $eq: ['$statut', 'client'] }, 1, 0] } 
          },
          anciensClients: { 
            $sum: { $cond: [{ $eq: ['$statut', 'ancien_client'] }, 1, 0] } 
          },
          entreprises: { 
            $sum: { $cond: [{ $ne: ['$entreprise', null] }, 1, 0] } 
          },
          particuliers: { 
            $sum: { $cond: [{ $eq: ['$entreprise', null] }, 1, 0] } 
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalContacts: 0,
      prospects: 0,
      clients: 0,
      anciensClients: 0,
      entreprises: 0,
      particuliers: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques CRM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques CRM'
    });
  }
}; 

// Mettre à jour le score d'un contact
exports.updateScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;
    const { score } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de contact invalide'
      });
    }

    if (score !== null && (score < 1 || score > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Le score doit être entre 1 et 5 ou null'
      });
    }

    const contact = await ContactCrm.findOne({ _id: id, agenceId });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact CRM non trouvé'
      });
    }

    // Mettre à jour le score
    contact.score = score;
    await contact.save();

    res.json({
      success: true,
      message: 'Score mis à jour avec succès',
      data: contact
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du score:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du score'
    });
  }
}; 