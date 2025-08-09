const asyncHandler = require('express-async-handler');
const Reservation = require('../models/reservationModel');
const Package = require('../models/packageModel');
const Agence = require('../models/agenceModel');

// @desc    Créer une nouvelle réservation (publique)
// @route   POST /api/reservations/public
// @access  Public
const createPublicReservation = asyncHandler(async (req, res) => {
  console.log('=== DÉBUT CRÉATION RÉSERVATION ===');
  console.log('Body reçu:', req.body);
  
  const { 
    packageId, 
    agenceSlug, 
    nom, 
    prenom, 
    telephone, 
    email, 
    nombrePlaces, 
    commentaire 
  } = req.body;

  console.log('Données extraites:', {
    packageId,
    agenceSlug,
    nom,
    prenom,
    telephone,
    email,
    nombrePlaces,
    commentaire
  });

  // Validation des champs requis
  if (!packageId || !agenceSlug || !nom || !prenom || !telephone || !nombrePlaces) {
    console.log('Validation échouée - champs manquants');
    return res.status(400).json({
      success: false,
      message: 'Tous les champs obligatoires doivent être remplis'
    });
  }

  try {
    console.log('Recherche de l\'agence avec slug:', agenceSlug);
    // Vérifier que l'agence existe
    const agence = await Agence.findOne({ slug: agenceSlug });
    console.log('Agence trouvée:', agence ? 'OUI' : 'NON');
    
    if (!agence) {
      console.log('Agence non trouvée');
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      });
    }

    console.log('Recherche du package avec ID:', packageId, 'et agenceId:', agence._id);
    // Vérifier que le package existe et appartient à cette agence
    const package = await Package.findOne({ 
      _id: packageId, 
      agenceId: agence._id,
      visible: true 
    });
    
    console.log('Package trouvé:', package ? 'OUI' : 'NON');
    if (!package) {
      console.log('Package non trouvé ou non disponible');
      return res.status(404).json({
        success: false,
        message: 'Package non trouvé ou non disponible'
      });
    }

    console.log('Vérification des places disponibles');
    // Vérifier la disponibilité des places
    if (package.placesDisponibles && nombrePlaces > package.placesDisponibles) {
      console.log('Places insuffisantes');
      return res.status(400).json({
        success: false,
        message: `Seulement ${package.placesDisponibles} places disponibles`
      });
    }

    console.log('Calcul du montant total');
    // Calculer le montant total
    const montantTotal = package.prix * nombrePlaces;
    console.log('Montant total calculé:', montantTotal);

    console.log('Création de la réservation');
    // Créer la réservation
    const reservation = await Reservation.create({
      packageId,
      agenceId: agence._id,
      nom,
      prenom,
      telephone,
      email,
      nombrePlaces,
      commentaire,
      montantTotal,
      source: 'vitrine_public'
    });

    console.log('Réservation créée avec succès, ID:', reservation._id);

    // Mettre à jour les places disponibles du package
    if (package.placesDisponibles) {
      console.log('Mise à jour des places disponibles');
      package.placesDisponibles -= nombrePlaces;
      await package.save();
      console.log('Places mises à jour');
    }

    console.log('Envoi de la réponse de succès');
    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: reservation
    });

  } catch (error) {
    console.error('=== ERREUR LORS DE LA CRÉATION DE LA RÉSERVATION ===');
    console.error('Erreur complète:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réservation'
    });
  }
});

// @desc    Récupérer toutes les réservations d'une agence
// @route   GET /api/reservations
// @access  Private/Agency
const getReservations = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: "ID d'agence manquant"
    });
  }

  try {
    const reservations = await Reservation.find({ agenceId })
      .populate('packageId', 'nom prix duree pays image')
      .sort({ dateReservation: -1 });

    res.status(200).json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations'
    });
  }
});

// @desc    Récupérer une réservation par ID
// @route   GET /api/reservations/:id
// @access  Private/Agency
const getReservationById = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  const reservationId = req.params.id;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: "ID d'agence manquant"
    });
  }

  try {
    const reservation = await Reservation.findOne({ 
      _id: reservationId, 
      agenceId 
    }).populate('packageId', 'nom prix duree pays image description');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la réservation'
    });
  }
});

// @desc    Mettre à jour le statut d'une réservation
// @route   PUT /api/reservations/:id/status
// @access  Private/Agency
const updateReservationStatus = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  const reservationId = req.params.id;
  const { statut, notesInterne } = req.body;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: "ID d'agence manquant"
    });
  }

  if (!['en_attente', 'confirmee', 'annulee', 'terminee'].includes(statut)) {
    return res.status(400).json({
      success: false,
      message: 'Statut invalide'
    });
  }

  try {
    const reservation = await Reservation.findOne({ 
      _id: reservationId, 
      agenceId 
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Mettre à jour le statut
    reservation.statut = statut;
    
    // Si confirmée, ajouter la date de confirmation
    if (statut === 'confirmee' && !reservation.dateConfirmation) {
      reservation.dateConfirmation = new Date();
    }

    // Ajouter les notes internes si fournies
    if (notesInterne) {
      reservation.notesInterne = notesInterne;
    }

    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Statut de la réservation mis à jour',
      data: reservation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// @desc    Supprimer une réservation
// @route   DELETE /api/reservations/:id
// @access  Private/Agency
const deleteReservation = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  const reservationId = req.params.id;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: "ID d'agence manquant"
    });
  }

  try {
    const reservation = await Reservation.findOne({ 
      _id: reservationId, 
      agenceId 
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Si la réservation est confirmée, remettre les places disponibles
    if (reservation.statut === 'confirmee') {
      const package = await Package.findById(reservation.packageId);
      if (package && package.placesDisponibles !== undefined) {
        package.placesDisponibles += reservation.nombrePlaces;
        await package.save();
      }
    }

    await Reservation.findByIdAndDelete(reservationId);

    res.status(200).json({
      success: true,
      message: 'Réservation supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la réservation'
    });
  }
});

// @desc    Obtenir les statistiques des réservations
// @route   GET /api/reservations/stats
// @access  Private/Agency
const getReservationStats = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;

  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: "ID d'agence manquant"
    });
  }

  try {
    const stats = await Reservation.aggregate([
      { $match: { agenceId: agenceId } },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 },
          totalMontant: { $sum: '$montantTotal' }
        }
      }
    ]);

    const totalReservations = await Reservation.countDocuments({ agenceId });
    const totalMontant = await Reservation.aggregate([
      { $match: { agenceId: agenceId } },
      { $group: { _id: null, total: { $sum: '$montantTotal' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats,
        totalReservations,
        totalMontant: totalMontant[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = {
  createPublicReservation,
  getReservations,
  getReservationById,
  updateReservationStatus,
  deleteReservation,
  getReservationStats
};