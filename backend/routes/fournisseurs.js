const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middlewares/authMiddleware');
const { 
  getFournisseurs, 
  getFournisseurById, 
  createFournisseur, 
  updateFournisseur, 
  deleteFournisseur,
  getFournisseurStats,
  exportFournisseursToExcel,
  getFournisseurHistory,
  addCommissionRule
} = require('../controllers/fournisseurController');
const Fournisseur = require('../models/fournisseurModel');
const BilletAvion = require('../models/billetModel');
const fs = require('fs').promises;
const path = require('path');

// Routes protégées
router.use(protect);

// Endpoint pour rechercher les compagnies IATA (DOIT ÊTRE AVANT /:id)
router.get('/search-companies', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ companies: [] });
    }

    // Lire le fichier iata_compagnies.json
    const iataPath = path.join(__dirname, '../services/iata_compagnies.json');
    const iataData = JSON.parse(await fs.readFile(iataPath, 'utf8'));
    
    const searchQuery = query.toLowerCase();
    const results = [];
    
    // Rechercher dans les compagnies
    for (const company of iataData) {
      const id = company.id?.toLowerCase() || '';
      const name = company.name?.toLowerCase() || '';
      
      if (id.includes(searchQuery) || name.includes(searchQuery)) {
        results.push({
          id: company.id,
          name: company.name,
          logo: company.logo
        });
        
        // Limiter à 10 résultats
        if (results.length >= 10) break;
      }
    }
    
    res.json({ companies: results });
  } catch (error) {
    console.error('Erreur recherche compagnies:', error);
    res.status(500).json({ message: 'Erreur lors de la recherche des compagnies' });
  }
});

// Routes CRUD de base
router.route('/')
  .get(getFournisseurs)
  .post(createFournisseur);

router.route('/:id')
  .get(getFournisseurById)
  .put(updateFournisseur)
  .delete(deleteFournisseur);

// Routes spécialisées
router.get('/:id/stats', getFournisseurStats);
router.get('/:id/history', getFournisseurHistory);
router.put('/:id/commission-rule', addCommissionRule);

// Route pour ajouter une règle de commission sans écraser les autres
router.post('/:id/add-commission-rule', addCommissionRule);

// Route pour calculer les commissions
router.post('/:id/calculate-commission', async (req, res) => {
  try {
    const { id } = req.params;
    const { billetId } = req.body;

    const fournisseur = await Fournisseur.findById(id);
    if (!fournisseur) {
      return res.status(404).json({ message: 'Fournisseur non trouvé' });
    }

    const billet = await BilletAvion.findById(billetId);
    if (!billet) {
      return res.status(404).json({ message: 'Billet non trouvé' });
    }

    // Calcul de la commission
    const codeCompagnie = billet.code_compagnie || (billet.informations && billet.informations.code_compagnie) || '';
    const typePax = billet.type_pax || (billet.informations && billet.informations.type_pax) || '';
    const typeVol = billet.type_vol || (billet.informations && billet.informations.type_vol) || '';
    const prix_ht = Number(billet.prix_ht || (billet.informations && billet.informations.prix_ht) || 0);
    const prix_ttc = Number(billet.prix_ttc || (billet.informations && billet.informations.prix_ttc) || billet.prix || 0);

    // Adapter le type de vol pour la compatibilité avec les anciens billets
    let adaptedTypeVol = typeVol;
    if (typeVol === 'international') {
      // Pour les billets existants avec 'international', on considère que c'est 'depuis_algerie'
      adaptedTypeVol = 'depuis_algerie';
    }

    let regle = fournisseur.commissionRules.find((r) => {
      // Matching compagnie
      const compagnieMatch = r.compagnie === codeCompagnie || r.compagnie === 'ALL';
      
      // Matching passager
      const passagerMatch = r.passager === typePax || r.passager === 'ALL';
      
      // Matching type de vol avec compatibilité
      let typeVolMatch = false;
      if (r.typeVol === 'ALL') {
        typeVolMatch = true;
      } else if (r.typeVol === adaptedTypeVol) {
        typeVolMatch = true;
      } else if (r.typeVol === typeVol) {
        // Fallback pour les anciens codes
        typeVolMatch = true;
      } else if (typeVol === 'international' && r.typeVol === 'depuis_algerie') {
        // Compatibilité spéciale pour les billets 'international' → 'depuis_algerie'
        typeVolMatch = true;
      }
      
      return compagnieMatch && passagerMatch && typeVolMatch;
    });

    if (!regle) {
      return res.json({
        commission_calculée: 0,
        base_commission: null,
        mode_commission: null,
        valeur_commission: null,
        montant_fournisseur: prix_ttc,
        regle_appliquee: null
      });
    }

    let commission = 0;
    if (regle.mode === '%') {
      if (regle.base === 'HT') {
        commission = prix_ht * (Number(regle.valeur) / 100);
      } else if (regle.base === 'TTC') {
        commission = prix_ttc * (Number(regle.valeur) / 100);
      }
    } else if (regle.mode === 'Fixe') {
      commission = Number(regle.valeur);
    }

    const montant_fournisseur = prix_ttc - commission;

    res.json({
      commission_calculée: Math.round(commission),
      base_commission: regle.base,
      mode_commission: regle.mode,
      valeur_commission: regle.valeur,
      montant_fournisseur: Math.round(montant_fournisseur),
      regle_appliquee: regle
    });

  } catch (error) {
    console.error('Erreur calcul commission:', error);
    res.status(500).json({ message: 'Erreur lors du calcul de la commission' });
  }
});

// Export fournisseurs to Excel
router.get('/export/excel', hasPermission('fournisseurs', 'lire'), exportFournisseursToExcel);

module.exports = router;