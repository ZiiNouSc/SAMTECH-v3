const HotelReservation = require('../models/hotelModel');
const { validateObjectId } = require('../utils/validation');

// Récupérer toutes les réservations d'hôtel d'une agence
exports.getAllReservations = async (req, res) => {
  try {
    const { agenceId } = req.user;
    
    const reservations = await HotelReservation.find({ agenceId })
      .populate('clientId', 'nom prenom email telephone')
      .populate('agentId', 'nom prenom')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations hôtel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations hôtel'
    });
  }
};

// Récupérer toutes les réservations d'hôtel non facturées
exports.getNonFactures = async (req, res) => {
  try {
    const { agenceId } = req.user;
    
    const reservations = await HotelReservation.find({ 
      agenceId,
      factureClientId: { $exists: false },
      statut: { $in: ['confirmée', 'confirme', 'confirmed'] }
    })
      .populate('clientId', 'nom prenom email telephone')
      .sort({ createdAt: -1 });

    const reservationsFormatees = reservations.map(reservation => ({
      id: reservation._id,
      _id: reservation._id,
      nomHotel: reservation.nomHotel,
      ville: reservation.ville,
      dateArrivee: reservation.dateArrivee,
      dateDepart: reservation.dateDepart,
      nombreNuits: reservation.nombreNuits,
      nombreChambres: reservation.nombreChambres,
      typeChambres: reservation.typeChambres,
      prix: reservation.prix,
      statut: reservation.statut,
      clientNom: reservation.clientId ? `${reservation.clientId.prenom} ${reservation.clientId.nom}` : '',
      informations: reservation.informations
    }));

    res.json({
      success: true,
      count: reservationsFormatees.length,
      data: reservationsFormatees
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations non facturées:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations non facturées'
    });
  }
};

// Récupérer une réservation par ID
exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de réservation invalide'
      });
    }

    const reservation = await HotelReservation.findOne({ _id: id, agenceId })
      .populate('clientId', 'nom prenom email telephone')
      .populate('agentId', 'nom prenom');
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation hôtel non trouvée'
      });
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation hôtel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la réservation hôtel'
    });
  }
};

// Créer une nouvelle réservation
exports.createReservation = async (req, res) => {
  try {
    const { agenceId } = req.user;
    const {
      clientId,
      nomHotel,
      ville,
      pays,
      dateArrivee,
      dateDepart,
      nombreChambres,
      typeChambre,
      pension,
      prix,
      devise,
      notes
    } = req.body;

    // Validation des champs obligatoires
    if (!clientId || !nomHotel || !ville || !pays || !dateArrivee || !dateDepart || !prix) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Créer la réservation
    const newReservation = new HotelReservation({
      agenceId,
      clientId,
      nomHotel,
      ville,
      pays,
      dateArrivee,
      dateDepart,
      nombreChambres: nombreChambres || 1,
      typeChambre: typeChambre || 'double',
      pension: pension || 'sans_pension',
      prix,
      devise: devise || 'DA',
      notes: notes || '',
      agentId: req.user.id
    });

    await newReservation.save();

    // Récupérer la réservation avec les données du client
    const reservationWithClient = await HotelReservation.findById(newReservation._id)
      .populate('clientId', 'nom prenom email telephone')
      .populate('agentId', 'nom prenom');

    res.status(201).json({
      success: true,
      message: 'Réservation hôtel créée avec succès',
      data: reservationWithClient
    });
  } catch (error) {
    console.error('Erreur lors de la création de la réservation hôtel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réservation hôtel'
    });
  }
};

// Mettre à jour une réservation
exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;
    const updateData = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de réservation invalide'
      });
    }

    // Vérifier si la réservation existe
    const reservation = await HotelReservation.findOne({ _id: id, agenceId });
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation hôtel non trouvée'
      });
    }

    // Mettre à jour la réservation
    const updatedReservation = await HotelReservation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('clientId', 'nom prenom email telephone')
     .populate('agentId', 'nom prenom');

    res.json({
      success: true,
      message: 'Réservation hôtel mise à jour avec succès',
      data: updatedReservation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réservation hôtel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la réservation hôtel'
    });
  }
};

// Supprimer une réservation
exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenceId } = req.user;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de réservation invalide'
      });
    }

    const reservation = await HotelReservation.findOneAndDelete({ _id: id, agenceId });
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation hôtel non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Réservation hôtel supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la réservation hôtel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la réservation hôtel'
    });
  }
};

// Récupérer les statistiques des réservations hôtel
exports.getStats = async (req, res) => {
  try {
    const { agenceId } = req.user;

    const stats = await HotelReservation.aggregate([
      { $match: { agenceId: agenceId } },
      {
        $group: {
          _id: null,
          totalReservations: { $sum: 1 },
          reservationsEnAttente: { 
            $sum: { $cond: [{ $eq: ['$statut', 'en_attente'] }, 1, 0] } 
          },
          reservationsConfirmees: { 
            $sum: { $cond: [{ $eq: ['$statut', 'confirmee'] }, 1, 0] } 
          },
          reservationsAnnulees: { 
            $sum: { $cond: [{ $eq: ['$statut', 'annulee'] }, 1, 0] } 
          },
          reservationsTerminees: { 
            $sum: { $cond: [{ $eq: ['$statut', 'terminee'] }, 1, 0] } 
          },
          chiffreAffaires: { $sum: '$prix' }
        }
      }
    ]);

    const result = stats[0] || {
      totalReservations: 0,
      reservationsEnAttente: 0,
      reservationsConfirmees: 0,
      reservationsAnnulees: 0,
      reservationsTerminees: 0,
      chiffreAffaires: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques hôtel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques hôtel'
    });
  }
}; 