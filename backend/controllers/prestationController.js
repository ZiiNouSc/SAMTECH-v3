const asyncHandler = require('express-async-handler');
const BilletAvion = require('../models/billetModel');
const Hotel = require('../models/hotelModel'); 
const Visa = require('../models/visaModel');
const Assurance = require('../models/assuranceModel');
const AutrePrestation = require('../models/autrePrestationModel');
const PreFacture = require('../models/preFactureModel');
const Facture = require('../models/factureModel');

// @desc    Récupérer toutes les prestations non facturées pour un client
// @route   GET /api/prestations/non-facturees/:clientId
// @access  Private
const getPrestationsNonFacturees = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const agenceId = req.user.agenceId;

  try {
    // Récupérer toutes les prestations déjà facturées ou en devis
    const prestationsFacturees = await getFacturedPrestations(clientId, agenceId);
    const prestationsEnDevis = await getDevisPrestations(clientId, agenceId);
    
    const prestationsExclues = [...prestationsFacturees, ...prestationsEnDevis];

    // Récupérer les prestations de chaque type
    const [billets, hotels, visas, assurances, autresPrestations] = await Promise.all([
      getBilletsNonFactures(clientId, agenceId, prestationsExclues),
      getHotelsNonFactures(clientId, agenceId, prestationsExclues),
      getVisasNonFactures(clientId, agenceId, prestationsExclues),
      getAssurancesNonFacturees(clientId, agenceId, prestationsExclues),
      getAutresPrestationsNonFacturees(clientId, agenceId, prestationsExclues)
    ]);

    const prestationsNonFacturees = [
      ...billets,
      ...hotels, 
      ...visas,
      ...assurances,
      ...autresPrestations
    ];

    res.json({
      success: true,
      count: prestationsNonFacturees.length,
      data: prestationsNonFacturees
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des prestations non facturées:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des prestations non facturées'
    });
  }
});

// @desc    Récupérer une prestation par référence
// @route   GET /api/prestations/reference/:reference
// @access  Private
const getPrestationByReference = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const agenceId = req.user.agenceId;

  try {
    let prestation = null;

    // Chercher dans chaque type de prestation
    const searchPromises = [
      searchInBillets(reference, agenceId),
      searchInHotels(reference, agenceId),
      searchInVisas(reference, agenceId),
      searchInAssurances(reference, agenceId),
      searchInAutresPrestations(reference, agenceId)
    ];

    const results = await Promise.all(searchPromises);
    prestation = results.find(result => result !== null);

    if (!prestation) {
      return res.status(404).json({
        success: false,
        message: 'Aucune prestation trouvée avec cette référence'
      });
    }

    res.json({
      success: true,
      data: prestation
    });

  } catch (error) {
    console.error('Erreur lors de la recherche par référence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de la prestation'
    });
  }
});

// Fonctions utilitaires pour récupérer les prestations déjà facturées
const getFacturedPrestations = async (clientId, agenceId) => {
  try {
    const factures = await Facture.find({ 
      clientId, 
      agenceId,
      statut: { $ne: 'annulee' }
    }).select('articles');

    const prestations = [];
    factures.forEach(facture => {
      facture.articles.forEach(article => {
        if (article.prestation && article.prestation.type) {
          prestations.push({
            type: article.prestation.type,
            reference: getReference(article.prestation)
          });
        }
      });
    });

    return prestations;
  } catch (error) {
    console.error('Erreur getFacturedPrestations:', error);
    return [];
  }
};

const getDevisPrestations = async (clientId, agenceId) => {
  try {
    const devis = await PreFacture.find({ 
      clientId, 
      agenceId,
      statut: { $in: ['envoye', 'accepte'] }
    }).select('articles');

    const prestations = [];
    devis.forEach(devisItem => {
      devisItem.articles.forEach(article => {
        if (article.prestation && article.prestation.type) {
          prestations.push({
            type: article.prestation.type,
            reference: getReference(article.prestation)
          });
        }
      });
    });

    return prestations;
  } catch (error) {
    console.error('Erreur getDevisPrestations:', error);
    return [];
  }
};

const getReference = (prestation) => {
  switch (prestation.type) {
    case 'billet':
      return prestation.numeroBillet;
    case 'hotel':
      return prestation.numeroVoucher;
    case 'visa':
      return prestation.numeroVisa || prestation.nomClient;
    case 'assurance':
      return prestation.numeroPolice;
    case 'autre':
      return prestation.numeroReference || prestation.designationLibre;
    default:
      return null;
  }
};

// Fonctions pour récupérer chaque type de prestation
const getBilletsNonFactures = async (clientId, agenceId, prestationsExclues) => {
  try {
    const billetsExclus = prestationsExclues
      .filter(p => p.type === 'billet')
      .map(p => p.reference);

    const billets = await BilletAvion.find({
      clientId,
      agenceId,
      statut: { $in: ['confirme', 'emis'] },
      numeroBillet: { $nin: billetsExclus }
    }).populate('clientId', 'nom prenom entreprise');

    return billets.map(billet => ({
      id: billet._id,
      type: 'billet',
      reference: billet.numeroBillet,
      designation: `Billet d'avion pour ${billet.passager}, ${billet.origine} → ${billet.destination}`,
      prix: billet.prix,
      datePrestation: billet.dateDepart,
      client: billet.clientId,
      details: {
        pax: billet.passager,
        numeroBillet: billet.numeroBillet,
        dateDepart: billet.dateDepart,
        dateRetour: billet.dateRetour,
        villeDepart: billet.origine,
        villeArrivee: billet.destination,
        compagnie: billet.compagnie
      }
    }));
  } catch (error) {
    console.error('Erreur getBilletsNonFactures:', error);
    return [];
  }
};

const getHotelsNonFactures = async (clientId, agenceId, prestationsExclues) => {
  try {
    const hotelsExclus = prestationsExclues
      .filter(p => p.type === 'hotel')
      .map(p => p.reference);

    const hotels = await Hotel.find({
      clientId,
      agenceId,
      statut: { $in: ['confirme', 'reserve'] },
      numeroVoucher: { $nin: hotelsExclus }
    }).populate('clientId', 'nom prenom entreprise');

    return hotels.map(hotel => ({
      id: hotel._id,
      type: 'hotel',
      reference: hotel.numeroVoucher,
      designation: `Réservation hôtel ${hotel.nomHotel} à ${hotel.ville}`,
      prix: hotel.prix,
      datePrestation: hotel.dateEntree,
      client: hotel.clientId,
      details: {
        nomClient: `${hotel.clientId.prenom} ${hotel.clientId.nom}`,
        nomHotel: hotel.nomHotel,
        ville: hotel.ville,
        dateEntree: hotel.dateEntree,
        dateSortie: hotel.dateSortie,
        numeroVoucher: hotel.numeroVoucher
      }
    }));
  } catch (error) {
    console.error('Erreur getHotelsNonFactures:', error);
    return [];
  }
};

const getVisasNonFactures = async (clientId, agenceId, prestationsExclues) => {
  try {
    const visasExclus = prestationsExclues
      .filter(p => p.type === 'visa')
      .map(p => p.reference);

    const visas = await Visa.find({
      clientId,
      agenceId,
      statut: { $in: ['en_cours', 'approuve'] },
      $or: [
        { numeroVisa: { $nin: visasExclus } },
        { numeroVisa: { $exists: false } }
      ]
    }).populate('clientId', 'nom prenom entreprise');

    return visas.map(visa => ({
      id: visa._id,
      type: 'visa',
      reference: visa.numeroVisa || `${visa.clientId.nom}-${visa.paysDestination}`,
      designation: `Demande de visa ${visa.typeVisa} pour ${visa.paysDestination}`,
      prix: visa.prix,
      datePrestation: visa.dateDepot,
      client: visa.clientId,
      details: {
        nomClient: `${visa.clientId.prenom} ${visa.clientId.nom}`,
        typeVisa: visa.typeVisa,
        paysVise: visa.paysDestination,
        dateDepot: visa.dateDepot
      }
    }));
  } catch (error) {
    console.error('Erreur getVisasNonFactures:', error);
    return [];
  }
};

const getAssurancesNonFacturees = async (clientId, agenceId, prestationsExclues) => {
  try {
    const assurancesExclues = prestationsExclues
      .filter(p => p.type === 'assurance')
      .map(p => p.reference);

    const assurances = await Assurance.find({
      clientId,
      agenceId,
      statut: { $in: ['active', 'validee'] },
      numeroPolice: { $nin: assurancesExclues }
    }).populate('clientId', 'nom prenom entreprise');

    return assurances.map(assurance => ({
      id: assurance._id,
      type: 'assurance',
      reference: assurance.numeroPolice,
      designation: `Assurance ${assurance.typeAssurance}`,
      prix: assurance.prix,
      datePrestation: assurance.dateDebut,
      client: assurance.clientId,
      details: {
        nomAssure: `${assurance.clientId.prenom} ${assurance.clientId.nom}`,
        typeAssurance: assurance.typeAssurance,
        dateDebut: assurance.dateDebut,
        dateFin: assurance.dateFin,
        numeroPolice: assurance.numeroPolice
      }
    }));
  } catch (error) {
    console.error('Erreur getAssurancesNonFacturees:', error);
    return [];
  }
};

const getAutresPrestationsNonFacturees = async (clientId, agenceId, prestationsExclues) => {
  try {
    const autresExclues = prestationsExclues
      .filter(p => p.type === 'autre')
      .map(p => p.reference);

    const autresPrestations = await AutrePrestation.find({
      clientId,
      agenceId,
      statut: { $in: ['confirmee', 'realisee'] },
      $or: [
        { numeroReference: { $nin: autresExclues } },
        { designation: { $nin: autresExclues } }
      ]
    }).populate('clientId', 'nom prenom entreprise');

    return autresPrestations.map(prestation => ({
      id: prestation._id,
      type: 'autre',
      reference: prestation.numeroReference || prestation.designation,
      designation: prestation.designation,
      prix: prestation.prix,
      datePrestation: prestation.dateDebut,
      client: prestation.clientId,
      details: {
        designationLibre: prestation.designation,
        ville: prestation.ville,
        dateDebut: prestation.dateDebut,
        dateFin: prestation.dateFin,
        duree: prestation.duree
      }
    }));
  } catch (error) {
    console.error('Erreur getAutresPrestationsNonFacturees:', error);
    return [];
  }
};

// Fonctions de recherche par référence
const searchInBillets = async (reference, agenceId) => {
  try {
    const billet = await BilletAvion.findOne({
      agenceId,
      $or: [
        { numeroBillet: reference },
        { numeroVol: reference }
      ]
    }).populate('clientId', 'nom prenom entreprise');

    if (!billet) return null;

    return {
      id: billet._id,
      type: 'billet',
      reference: billet.numeroBillet,
      designation: `Billet d'avion pour ${billet.passager}, ${billet.origine} → ${billet.destination}`,
      prix: billet.prix,
      datePrestation: billet.dateDepart,
      client: billet.clientId,
      details: {
        pax: billet.passager,
        numeroBillet: billet.numeroBillet,
        dateDepart: billet.dateDepart,
        dateRetour: billet.dateRetour,
        villeDepart: billet.origine,
        villeArrivee: billet.destination,
        compagnie: billet.compagnie
      }
    };
  } catch (error) {
    return null;
  }
};

const searchInHotels = async (reference, agenceId) => {
  try {
    const hotel = await Hotel.findOne({
      agenceId,
      numeroVoucher: reference
    }).populate('clientId', 'nom prenom entreprise');

    if (!hotel) return null;

    return {
      id: hotel._id,
      type: 'hotel',
      reference: hotel.numeroVoucher,
      designation: `Réservation hôtel ${hotel.nomHotel} à ${hotel.ville}`,
      prix: hotel.prix,
      datePrestation: hotel.dateEntree,
      client: hotel.clientId,
      details: {
        nomClient: `${hotel.clientId.prenom} ${hotel.clientId.nom}`,
        nomHotel: hotel.nomHotel,
        ville: hotel.ville,
        dateEntree: hotel.dateEntree,
        dateSortie: hotel.dateSortie,
        numeroVoucher: hotel.numeroVoucher
      }
    };
  } catch (error) {
    return null;
  }
};

const searchInVisas = async (reference, agenceId) => {
  try {
    const visa = await Visa.findOne({
      agenceId,
      $or: [
        { numeroVisa: reference },
        { numeroDossier: reference }
      ]
    }).populate('clientId', 'nom prenom entreprise');

    if (!visa) return null;

    return {
      id: visa._id,
      type: 'visa',
      reference: visa.numeroVisa || visa.numeroDossier,
      designation: `Demande de visa ${visa.typeVisa} pour ${visa.paysDestination}`,
      prix: visa.prix,
      datePrestation: visa.dateDepot,
      client: visa.clientId,
      details: {
        nomClient: `${visa.clientId.prenom} ${visa.clientId.nom}`,
        typeVisa: visa.typeVisa,
        paysVise: visa.paysDestination,
        dateDepot: visa.dateDepot
      }
    };
  } catch (error) {
    return null;
  }
};

const searchInAssurances = async (reference, agenceId) => {
  try {
    const assurance = await Assurance.findOne({
      agenceId,
      numeroPolice: reference
    }).populate('clientId', 'nom prenom entreprise');

    if (!assurance) return null;

    return {
      id: assurance._id,
      type: 'assurance',
      reference: assurance.numeroPolice,
      designation: `Assurance ${assurance.typeAssurance}`,
      prix: assurance.prix,
      datePrestation: assurance.dateDebut,
      client: assurance.clientId,
      details: {
        nomAssure: `${assurance.clientId.prenom} ${assurance.clientId.nom}`,
        typeAssurance: assurance.typeAssurance,
        dateDebut: assurance.dateDebut,
        dateFin: assurance.dateFin,
        numeroPolice: assurance.numeroPolice
      }
    };
  } catch (error) {
    return null;
  }
};

const searchInAutresPrestations = async (reference, agenceId) => {
  try {
    const prestation = await AutrePrestation.findOne({
      agenceId,
      $or: [
        { numeroReference: reference },
        { designation: { $regex: reference, $options: 'i' } }
      ]
    }).populate('clientId', 'nom prenom entreprise');

    if (!prestation) return null;

    return {
      id: prestation._id,
      type: 'autre',
      reference: prestation.numeroReference || prestation.designation,
      designation: prestation.designation,
      prix: prestation.prix,
      datePrestation: prestation.dateDebut,
      client: prestation.clientId,
      details: {
        designationLibre: prestation.designation,
        ville: prestation.ville,
        dateDebut: prestation.dateDebut,
        dateFin: prestation.dateFin,
        duree: prestation.duree
      }
    };
  } catch (error) {
    return null;
  }
};

module.exports = {
  getPrestationsNonFacturees,
  getPrestationByReference
}; 