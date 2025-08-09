const calculerCommissionFournisseur = (billet, fournisseur) => {
  if (!fournisseur || !Array.isArray(fournisseur.commissionRules)) {
    return {
      commission_calculée: 0,
      base_commission: null,
      mode_commission: null,
      valeur_commission: null,
      montant_fournisseur: billet.prix_ttc || billet.prix || 0,
      regle_appliquee: null
    };
  }
  // On cherche la règle la plus spécifique
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

  // Recherche de la règle la plus spécifique avec compatibilité
  let regle = fournisseur.commissionRules.find(r => {
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

  // Si aucune règle trouvée, on retourne les montants d'origine
  if (!regle) {
    return {
      commission_calculée: 0,
      base_commission: null,
      mode_commission: null,
      valeur_commission: null,
      montant_fournisseur: prix_ttc,
      regle_appliquee: null
    };
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

  return {
    commission_calculée: Math.round(commission),
    base_commission: regle.base,
    mode_commission: regle.mode,
    valeur_commission: regle.valeur,
    montant_fournisseur: Math.round(montant_fournisseur),
    regle_appliquee: regle
  };
};

module.exports = { calculerCommissionFournisseur }; 