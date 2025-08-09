import React, { useState, useEffect, useCallback } from 'react';
import {
  Building,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  Plus,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';
import { fournisseursAPI, billetsAPI, facturesFournisseursAPI } from '../../services/api';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';

interface BilletInformations {
  code_compagnie?: string;
  compagnie_aerienne?: string;
  classe?: string;
  type_pax?: string;
  type_vol?: string;
  nom_passager?: string;
  prix_ttc?: number;
  prix_ht?: number;
  prix?: number;
  taxes?: number;
  vols?: any[];
  commission?: number;
  netfournisseur?: number;
  regle_appliquee?: any;
}

interface Billet {
  _id: string;
  numero_billet?: string;
  prix_ttc?: number;
  prix_ht?: number;
  prix?: number;
  netfournisseur?: number; // Ajout du champ netfournisseur
  informations?: BilletInformations;
  fournisseurId?: string;
  factureFournisseurId?: string;
  commission_calculée?: number;
  commission_amount?: number;
  base_commission?: string;
  mode_commission?: string;
  valeur_commission?: number;
  montant_fournisseur?: number;
  regle_appliquee?: any;
  isAutoRule?: boolean;
  prix_original?: number;
  reason?: string;
  date_calcul_commission?: Date;
}

interface Fournisseur {
  _id: string;
  entreprise?: string;
  nom?: string;
  commissionRules?: Array<{
    compagnie: string;
    passager: string;
    typeVol: string;
    classe: string;
    mode: string;
    valeur: number;
    base: string;
  }>;
}

interface CommissionRule {
  compagnie: string;
  passager: string;
  typeVol: string;
  classe: string;
  mode: string;
  valeur: number;
  base: string;
}

const TransactionsPage: React.FC = () => {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [billets, setBillets] = useState<Billet[]>([]);
  const [selectedFournisseur, setSelectedFournisseur] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [selectedBillets, setSelectedBillets] = useState<string[]>([]);
  const [isCreatingFacture, setIsCreatingFacture] = useState(false);

  const [showRuleModal, setShowRuleModal] = useState<{ open: boolean, billet: Billet | null }>({ open: false, billet: null });
  const [showAddRuleModal, setShowAddRuleModal] = useState<{ open: boolean, billet: Billet | null }>({ open: false, billet: null });
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [newRule, setNewRule] = useState<CommissionRule>({
    compagnie: 'ALL',
    passager: 'ALL',
    typeVol: 'ALL',
    classe: 'ALL',
    mode: 'Fixe',
    valeur: 1000,
    base: 'TTC'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-rule' | 'without-rule'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'prix' | 'commission'>('date');
  const [hasTriedAutoCalc, setHasTriedAutoCalc] = useState(false);

  const loadFournisseurs = async () => {
    try {
      const response = await fournisseursAPI.getAll();
      const fournisseursData = response.data.data || [];
      setFournisseurs(fournisseursData);
      
    } catch (error) {
      console.error('❌ Erreur chargement fournisseurs:', error);
    }
  };

  const loadBilletsFournisseur = async () => {
    if (!selectedFournisseur) return;
    setLoading(true);
    try {
      const response = await billetsAPI.getAll();
      const allBillets = response.data.data || [];
      const billetsFournisseur = allBillets.filter((b: Billet) =>
        b.fournisseurId === selectedFournisseur && !b.factureFournisseurId
      );
      setBillets(billetsFournisseur);
   
      // SUPPRIME le recalcul automatique ici pour éviter la boucle infinie
      // if (billetsFournisseur.length > 0) {
      //   await calculateCommissions(billetsFournisseur);
      // }
    } catch (error) {
      console.error('❌ Erreur chargement billets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Comparaison insensible à la casse et aux espaces pour tous les champs de matching
  const normalizeValue = (value: string): string => {
    const v = (value || '').trim().toLowerCase();
    if (["tous", "toutes", "all"].includes(v)) return "all";
    return v;
  };

  // Fonction pour vérifier si une valeur correspond (gère ALL/all et insensible à la casse)
  const isMatchingValue = (ruleValue: string, billetValue: string): boolean => {
    const normalizedRule = normalizeValue(ruleValue);
    const normalizedBillet = normalizeValue(billetValue);
    
    // Si la règle est "all", elle correspond à tout
    if (normalizedRule === "all") return true;
    
    // Sinon, comparaison exacte insensible à la casse
    return normalizedRule === normalizedBillet;
  };

  const mapClasse = (classe: string): string => {
    const normalized = normalizeValue(classe);
    if (['s', 'eco', 'economy', 'standard'].includes(normalized)) return 'economy';
    if (['b', 'business', 'affaires'].includes(normalized)) return 'business';
    if (['f', 'first', 'premiere'].includes(normalized)) return 'first';
    return normalized;
  };

  const adaptTypeVol = (typeVol: string): string => {
    const v = normalizeValue(typeVol);
    if (["international", "depuis_algerie", "vol international (depuis algérie)"].includes(v)) return "depuis_algerie";
    if (["vers_algerie"].includes(v)) return "vers_algerie";
    if (["domestique", "national", "vol domestique (algérie → algérie)"].includes(v)) return "domestique";
    if (v === "all") return "all";
    return v;
  };

  const fetchFournisseurById = async (id: string): Promise<Fournisseur | null> => {
    try {
      const response = await fournisseursAPI.getById(id);
      return response.data.data || null;
    } catch {
      return null;
    }
  };

  const calculateCommissions = useCallback(async (billetsToCalculate: Billet[]) => {
    console.log('🧮 Calcul des commissions pour', billetsToCalculate.length, 'billets');
    if (!selectedFournisseur || billetsToCalculate.length === 0) return;
    setCalculating(true);
    // Utilise le fournisseur à jour depuis l'API
    const fournisseur = await fetchFournisseurById(selectedFournisseur);
    if (!fournisseur || !fournisseur.commissionRules) {
      
      setCalculating(false);
      return;
    }

    const updatedBillets: Billet[] = [];
    // Remplace la boucle filtrée par une boucle sur tous les billets
    for (const billet of billetsToCalculate) {
      const billetInfo = billet.informations || {};
      let regleAppliquee = null;
      let isMatch = false;
      for (const regle of fournisseur.commissionRules) {
        // Appliquer la même normalisation/mapping/adaptation sur les deux côtés
        const regleCompagnie = normalizeValue(regle.compagnie || '');
        const billetCompagnie = normalizeValue(billetInfo.code_compagnie || '');

        const regleClasse = mapClasse(regle.classe || '');
        const billetClasse = mapClasse(billetInfo.classe || '');

        const reglePassager = normalizeValue(regle.passager || '');
        const billetPassager = normalizeValue(billetInfo.type_pax || '');

        const regleTypeVol = adaptTypeVol(regle.typeVol || '');
        const billetTypeVol = adaptTypeVol(billetInfo.type_vol || '');

        // Matching insensible à la casse et aux variantes
        const compagnieMatch = regleCompagnie === "all" || regleCompagnie === billetCompagnie;
        const classeMatch = regleClasse === "all" || regleClasse === billetClasse;
        const passagerMatch = reglePassager === "all" || reglePassager === billetPassager;
        const typeVolMatch = regleTypeVol === "all" || regleTypeVol === billetTypeVol;

        // Debug
        console.log('🔍 Matching billet:', {
          billetCompagnie, billetClasse, billetPassager, billetTypeVol
        }, 'avec règle:', {
          regleCompagnie, regleClasse, reglePassager, regleTypeVol
        }, {
          compagnieMatch, classeMatch, passagerMatch, typeVolMatch
        });

        isMatch = compagnieMatch && classeMatch && passagerMatch && typeVolMatch;
        if (isMatch) {
          regleAppliquee = regle;
          console.log('✅ Règle trouvée:', regle);
          break;
        }
      }
      // Calcul du prix original : priorité aux champs Fdans informations, puis dans le premier vol
      const vols = billet.informations?.vols || [];
      const vol0 = vols[0] || {};
      const prixOriginal =
        billet.informations?.prix_ttc ||
        billet.informations?.prix ||
        billet.informations?.prix_ht ||
        vol0.prix_ttc ||
        vol0.prix ||
        vol0.prix_ht ||
        billet.prix_ttc ||
        billet.prix ||
        billet.prix_ht ||
        0;
      let commission = 0;
      let reason = '';
      if (regleAppliquee) {
        console.log('💰 Calcul commission pour règle:', regleAppliquee);
        
        if (regleAppliquee.mode === 'Fixe') {
          commission = Number(regleAppliquee.valeur);
          console.log('💰 Commission fixe:', commission);
        } else if (regleAppliquee.mode === '%') {
          const base = regleAppliquee.base === 'HT'
            ? (billet.informations?.prix_ht || billet.prix_ht || prixOriginal)
            : (billet.informations?.prix_ttc || billet.prix_ttc || prixOriginal);
          commission = base * (Number(regleAppliquee.valeur) / 100);
          console.log('💰 Commission %:', commission, 'base:', base, 'pourcentage:', regleAppliquee.valeur);
        }
        reason = `Règle appliquée: ${regleAppliquee.compagnie}/${regleAppliquee.passager}/${regleAppliquee.typeVol}/${regleAppliquee.classe}`;
      } else {
        // Utiliser les valeurs normalisées du billet pour le message d'erreur
        const billetCompagnie = normalizeValue(billetInfo.code_compagnie || '');
        const billetPassager = normalizeValue(billetInfo.type_pax || '');
        const billetTypeVol = adaptTypeVol(billetInfo.type_vol || '');
        const billetClasse = mapClasse(billetInfo.classe || '');
        reason = `Aucune règle trouvée pour: ${billetCompagnie}/${billetPassager}/${billetTypeVol}/${billetClasse}`;
      }
      
      const montantFournisseur = (billet.informations?.prix_ttc || billet.prix_ttc || prixOriginal) - commission;
      console.log('💰 Résultats finaux:', {
        prixOriginal,
        commission,
        montantFournisseur,
        regleAppliquee: !!regleAppliquee
      });
      
      const updatedBillet: Billet = {
        ...billet,
        commission_calculée: commission,
        commission_amount: commission,
        base_commission: regleAppliquee?.base || undefined,
        mode_commission: regleAppliquee?.mode || undefined,
        valeur_commission: regleAppliquee?.valeur || undefined,
        montant_fournisseur: montantFournisseur,
        regle_appliquee: regleAppliquee,
        isAutoRule: !!regleAppliquee,
        prix_original: prixOriginal,
        reason: reason,
        date_calcul_commission: new Date()
      };
      updatedBillets.push(updatedBillet);
    }
    await saveCalculationsToDatabase(updatedBillets);
    // Supprimer l'appel à loadBilletsFournisseur pour éviter la boucle infinie
    // await loadBilletsFournisseur(); // Recharge les billets après calcul
    setBillets(prev => {
      const updated = [...prev];
      updatedBillets.forEach(updatedBillet => {
        const index = updated.findIndex(b => b._id === updatedBillet._id);
        if (index !== -1) {
          updated[index] = updatedBillet;
        }
      });
      return updated;
    });
    setCalculating(false);
  }, [selectedFournisseur]);

  const saveCalculationsToDatabase = async (billets: Billet[]) => {
    try {
      for (const billet of billets) {
        console.log('💾 Sauvegarde billet:', billet._id, {
          commission: billet.commission_calculée,
          netfournisseur: billet.montant_fournisseur,
          regle_appliquee: billet.regle_appliquee
        });
        
        const updatedBillet = {
          commission_calculée: billet.commission_calculée || 0, // Supprimer Math.round()
          montant_fournisseur: billet.montant_fournisseur || 0, // Supprimer Math.round()
          regle_appliquee: billet.regle_appliquee,
          date_calcul_commission: billet.date_calcul_commission,
          base_commission: billet.base_commission,
          mode_commission: billet.mode_commission,
          valeur_commission: billet.valeur_commission,
          reason: billet.reason,
          informations: {
            ...billet.informations,
            netfournisseur: billet.montant_fournisseur || 0, // Supprimer Math.round()
            commission: billet.commission_calculée || 0, // Supprimer Math.round()
            regle_appliquee: billet.regle_appliquee,
            date_calcul_commission: billet.date_calcul_commission
          }
        };
        await billetsAPI.update(billet._id, updatedBillet);
        console.log('✅ Billet sauvegardé:', billet._id);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde calculs:', error);
    }
  };

  const forceRecalculateAll = async () => {
    if (window.confirm('Voulez-vous recalculer les commissions pour tous les billets de ce fournisseur ?')) {
      await calculateCommissions(billets);
    }
  };

  // 1. Ajout de règle : n'écrase jamais, ajoute seulement si la règle n'existe pas
  const handleAddRule = async () => {
    // Si pas de billet, on ajoute toujours une nouvelle règle
    if (!showAddRuleModal.billet) {
      try {
        const fournisseur = fournisseurs.find(f => f._id === selectedFournisseur);
        if (!fournisseur) return;

        const adaptedRule = {
          ...newRule,
          valeur: Number(newRule.valeur)
        };

        // Vérifier si la règle existe déjà (tous les critères)
        const ruleExists = fournisseur.commissionRules?.some(r =>
          r.compagnie === adaptedRule.compagnie &&
          r.passager === adaptedRule.passager &&
          r.typeVol === adaptedRule.typeVol &&
          r.classe === adaptedRule.classe &&
          r.mode === adaptedRule.mode &&
          r.base === adaptedRule.base &&
          Number(r.valeur) === adaptedRule.valeur
        );
        if (ruleExists) {
          alert('Cette règle existe déjà !');
          return;
        }

        // Utiliser la nouvelle route d'ajout
        await fetch(`/api/fournisseurs/${selectedFournisseur}/add-commission-rule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('samtech_user') || '{}').token}`
          },
          body: JSON.stringify(adaptedRule)
        });
        await loadFournisseurs();
        await loadBilletsFournisseur();
        setShowAddRuleModal({ open: false, billet: null });
        alert('Règle ajoutée avec succès !');
      } catch (error) {
        alert('Erreur lors de l\'ajout de la règle');
      }
      return;
    }

    // Sinon, logique normale de modification/ajout pour un billet précis
    try {
      const fournisseur = fournisseurs.find(f => f._id === selectedFournisseur);
      if (!fournisseur) return;

      const adaptedRule = {
        ...newRule,
        valeur: Number(newRule.valeur)
      };

      // Chercher une règle existante sur les critères principaux (hors mode/base/valeur)
      const existingRuleIndex = fournisseur.commissionRules?.findIndex(r =>
        r.compagnie === adaptedRule.compagnie &&
        r.passager === adaptedRule.passager &&
        r.typeVol === adaptedRule.typeVol &&
        r.classe === adaptedRule.classe
      );

      let updatedFournisseur;
      if (existingRuleIndex !== -1 && existingRuleIndex !== undefined) {
        // Modifier la règle existante
        const updatedRules = [...(fournisseur.commissionRules || [])];
        updatedRules[existingRuleIndex] = {
          ...updatedRules[existingRuleIndex],
          mode: adaptedRule.mode,
          valeur: adaptedRule.valeur,
          base: adaptedRule.base
        };
        updatedFournisseur = {
          ...fournisseur,
          commissionRules: updatedRules
        };
        await fournisseursAPI.update(selectedFournisseur, updatedFournisseur);
      } else {
        // Utiliser la nouvelle route d'ajout
        await fetch(`/api/fournisseurs/${selectedFournisseur}/add-commission-rule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('samtech_user') || '{}').token}`
          },
          body: JSON.stringify(adaptedRule)
        });
      }
      await loadFournisseurs();
      await loadBilletsFournisseur();
      await calculateCommissions([showAddRuleModal.billet]);
      setShowAddRuleModal({ open: false, billet: null });
      alert('Règle ajoutée ou modifiée avec succès !');
    } catch (error) {
      alert('Erreur lors de l\'ajout/modification de la règle');
    }
  };

  const handleCreateFacture = async () => {
    if (selectedBillets.length === 0) {
      alert('Veuillez sélectionner au moins un billet');
      return;
    }
    setIsCreatingFacture(true);
    try {
      // Le backend va maintenant créer automatiquement les articles détaillés 
      // à partir des billets, donc on ne passe que les IDs des billets
      const montantHT = selectedBillets.reduce((sum, billetId) => {
        const billet = billets.find(b => b._id === billetId);
        // Utiliser le net fournisseur depuis informations (où il est stocké après calcul)
        const prix = billet?.informations?.netfournisseur || 
                    billet?.netfournisseur || 
                    billet?.montant_fournisseur || 
                    0;
        console.log(`💰 Billet ${billetId}: Net fournisseur = ${prix} DA (depuis informations: ${billet?.informations?.netfournisseur || 'N/A'})`);
        return sum + prix;
      }, 0);
      
      const montantTTC = montantHT; // Le net fournisseur est déjà le montant final
      
      console.log(`💰 Montants calculés: Net fournisseur total=${montantHT} DA`);
      
      if (montantHT === 0) {
        alert('Aucun net fournisseur défini pour les billets sélectionnés. Veuillez d\'abord calculer les commissions.');
        setIsCreatingFacture(false);
        return;
      }
      
      const payload = {
        fournisseurId: selectedFournisseur,
        billetsAssocies: selectedBillets,
        articles: [], // Le backend créera automatiquement les articles à partir des billets
        montantHT,
        montantTTC,
        montantTVA: 0,
        tva: 0,
        dateEmission: new Date().toISOString(),
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Facture générée automatiquement pour les billets sélectionnés',
        conditionsPaiement: 'Paiement à 30 jours'
      };

      console.log('📤 Création facture fournisseur avec payload:', payload);
      
      const response = await facturesFournisseursAPI.create(payload);
      if (response.data && response.data.success) {
        alert('Facture créée avec succès !');
        setSelectedBillets([]);
        // Rafraîchir les billets et factures
        loadBilletsFournisseur();
      } else {
        console.error('❌ Erreur response:', response.data);
        alert(`Erreur lors de la création de la facture: ${response.data?.message || 'Erreur inconnue'}`);
      }
    } catch (error: any) {
      console.error('❌ Erreur création facture fournisseur:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création de la facture';
      alert(`Erreur lors de la création de la facture: ${errorMessage}`);
    } finally {
      setIsCreatingFacture(false);
    }
  };

  const toggleBilletSelection = (billetId: string) => {
    setSelectedBillets(prev =>
      prev.includes(billetId)
        ? prev.filter(id => id !== billetId)
        : [...prev, billetId]
    );
  };

  const getTotalSelected = () => {
    return selectedBillets.reduce((total, billetId) => {
      const billet = billets.find(b => b._id === billetId);
      return total + (billet?.montant_fournisseur || 0);
    }, 0);
  };

  const filteredAndSortedBillets = billets
    .filter(billet => {
      const matchesSearch = searchTerm === '' ||
        billet.numero_billet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        billet.informations?.nom_passager?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        billet.informations?.code_compagnie?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' ||
        (filterStatus === 'with-rule' && billet.regle_appliquee) ||
        (filterStatus === 'without-rule' && !billet.regle_appliquee);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'prix':
          return (b.prix_original || 0) - (a.prix_original || 0);
        case 'commission':
          return (b.commission_calculée || 0) - (a.commission_calculée || 0);
        default:
          return new Date(b.date_calcul_commission || 0).getTime() - new Date(a.date_calcul_commission || 0).getTime();
      }
    });

  useEffect(() => {
    loadFournisseurs();
  }, []);

  useEffect(() => {
    if (selectedFournisseur) {
      loadBilletsFournisseur();
    }
  }, [selectedFournisseur]);

  // Recalculer automatiquement quand les billets sont chargés
  useEffect(() => {
    if (billets.length > 0 && selectedFournisseur && !hasTriedAutoCalc) {
      const billetsSansCommission = billets.filter(billet => 
        !billet.commission_calculée && !billet.regle_appliquee
      );
      
      if (billetsSansCommission.length > 0) {
        console.log('🔄 Recalcul automatique pour', billetsSansCommission.length, 'billets sans commission');
        calculateCommissions(billetsSansCommission);
        setHasTriedAutoCalc(true);
      } else {
        console.log('✅ Tous les billets ont déjà des commissions calculées');
        setHasTriedAutoCalc(true);
      }
    }
  }, [billets, selectedFournisseur, calculateCommissions, hasTriedAutoCalc]);

  useEffect(() => {
    setHasTriedAutoCalc(false);
  }, [selectedFournisseur]);

  // 2. Pré-remplissage du modal d'ajout de règle avec les détails du billet ou ALL
  useEffect(() => {
    if (showAddRuleModal.open && showAddRuleModal.billet) {
      const billet = showAddRuleModal.billet;
      const fournisseur = fournisseurs.find(f => f._id === selectedFournisseur);
      
      // Chercher si une règle existe déjà pour ce billet
      const existingRule = fournisseur?.commissionRules?.find(r =>
        r.compagnie === billet.informations?.code_compagnie &&
        r.passager === billet.informations?.type_pax &&
        r.typeVol === billet.informations?.type_vol &&
        r.classe === billet.informations?.classe
      );
      
      if (existingRule) {
        // Pré-remplir avec la règle existante
        setNewRule({
          compagnie: existingRule.compagnie,
          passager: existingRule.passager,
          typeVol: existingRule.typeVol,
          classe: existingRule.classe,
          mode: existingRule.mode,
          valeur: existingRule.valeur,
          base: existingRule.base
        });
        setIsEditingRule(true);
        console.log('🔄 Chargement de la règle existante:', existingRule);
      } else {
        // Pré-remplir avec les valeurs du billet ou ALL
        setNewRule({
          compagnie: billet.informations?.code_compagnie || 'ALL',
          passager: billet.informations?.type_pax || 'ALL',
          typeVol: billet.informations?.type_vol || 'ALL',
          classe: billet.informations?.classe || 'ALL',
          mode: 'Fixe',
          valeur: 1000,
          base: 'TTC'
        });
        setIsEditingRule(false);
        console.log('➕ Nouvelle règle pour le billet:', billet.informations);
      }
    }
  }, [showAddRuleModal, selectedFournisseur, fournisseurs]);



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions fournisseurs</h1>
          <p className="text-gray-600">Gestion des billets et calcul des commissions</p>
        </div>
        {/* 3. Supprimer le bouton 'Recalculer' de l'UI */}
      </div>
      <div className="card">
        <div className="flex items-center gap-4">
          <Building className="w-5 h-5 text-gray-400" />
          <select
            className="input-field flex-1"
            value={selectedFournisseur}
            onChange={(e) => setSelectedFournisseur(e.target.value)}
          >
            <option value="">-- Sélectionner un fournisseur --</option>
            {fournisseurs.map(f => (
              <option key={f._id} value={f._id}>
                {f.entreprise || f.nom}
              </option>
            ))}
          </select>
        </div>
      </div>
      {selectedFournisseur && (
        loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="card">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par numéro billet, passager, compagnie..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="input-field"
                >
                  <option value="all">Tous les billets</option>
                  <option value="with-rule">Avec règle appliquée</option>
                  <option value="without-rule">Sans règle</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="input-field"
                >
                  <option value="date">Trier par date</option>
                  <option value="prix">Trier par prix</option>
                  <option value="commission">Trier par commission</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stat-card">
                  <div className="stat-value">{billets.length}</div>
                  <div className="stat-label">Total billets</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{billets.filter(b => b.regle_appliquee).length}</div>
                  <div className="stat-label">Avec règle</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{billets.filter(b => !b.regle_appliquee).length}</div>
                  <div className="stat-label">Sans règle</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {billets.reduce((sum, b) => sum + (b.commission_calculée || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                  </div>
                  <div className="stat-label">Total commissions</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowAddRuleModal({ open: true, billet: null })}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une règle
                  </button>
                  <button
                    onClick={forceRecalculateAll}
                    disabled={calculating}
                    className="btn-secondary flex items-center gap-2"
                  >
                    {calculating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Recalculer
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedBillets.length > 0 && (
                      `Total sélectionné: ${getTotalSelected().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA`
                    )}
                  </span>
                </div>
                {selectedBillets.length > 0 && (
                  <button
                    onClick={handleCreateFacture}
                    disabled={isCreatingFacture}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isCreatingFacture ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    Créer facture ({selectedBillets.length})
                  </button>
                )}
              </div>
            </div>
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3">
                        <input
                          type="checkbox"
                          checked={selectedBillets.length === billets.length && billets.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBillets(billets.map(b => b._id));
                            } else {
                              setSelectedBillets([]);
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-3">Billet</th>
                      <th className="text-left p-3">Passager</th>
                      <th className="text-left p-3">Compagnie</th>
                      <th className="text-left p-3">Critères</th>
                      <th className="text-left p-3">Prix TTC</th>
                      <th className="text-left p-3">Commission</th>
                      <th className="text-left p-3">Net fournisseur</th>
                      <th className="text-left p-3">Statut</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedBillets.map(billet => {
                      const isSelected = selectedBillets.includes(billet._id);
                      const billetInfo = billet.informations || {};
                      return (
                        <tr key={billet._id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleBilletSelection(billet._id)}
                            />
                          </td>
                          <td className="p-3 font-medium">
                            {billet.numero_billet || billet._id.slice(-8)}
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              <div className="font-medium">
                                {billetInfo.nom_passager || '-'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {billetInfo.type_pax || '-'}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              <div className="font-medium">
                                {billetInfo.compagnie_aerienne || '-'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {billetInfo.code_compagnie || '-'}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900">
                                {adaptTypeVol(billet.informations?.type_vol || '')} / {mapClasse(billet.informations?.classe || '')}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm font-semibold text-gray-900">
                              {(billet.informations?.prix_ttc || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              <div className="font-semibold text-red-600">
                                -{(billet.informations?.commission ?? billet.commission_calculée ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                              </div>
                              {billet.regle_appliquee && (
                                <div className="text-xs text-gray-500">
                                  {billet.mode_commission} {billet.valeur_commission}
                                  {billet.mode_commission === '%' ? '%' : ' DA'}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm font-semibold text-green-600">
                              {(billet.informations?.netfournisseur ?? billet.montant_fournisseur ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                            </div>
                          </td>
                          <td className="p-3">
                            {(billet.regle_appliquee || billet.informations?.regle_appliquee)
                              ? <Badge variant="success" className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Règle appliquée
                              </Badge>
                              : <Badge variant="warning" className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Sans règle
                              </Badge>
                            }
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {!billet.regle_appliquee && (
                                <button
                                  onClick={() => setShowAddRuleModal({ open: true, billet })}
                                  className="btn-secondary text-xs"
                                  title="Ajouter une règle"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => setShowRuleModal({ open: true, billet })}
                                className="btn-secondary text-xs"
                                title="Voir les détails"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredAndSortedBillets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Aucun billet ne correspond aux critères de recherche'
                    : 'Aucun billet trouvé pour ce fournisseur'
                  }
                </div>
              )}
            </div>
          </>
        )
      )}
      <Modal
        isOpen={showRuleModal.open}
        onClose={() => setShowRuleModal({ open: false, billet: null })}
        title="Détails du calcul"
      >
        {showRuleModal.billet && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Numéro billet</label>
                <div className="text-sm">{showRuleModal.billet.numero_billet || showRuleModal.billet._id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Passager</label>
                <div className="text-sm">{showRuleModal.billet.informations?.nom_passager || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type passager</label>
                <div className="text-sm">{showRuleModal.billet.informations?.type_pax || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Compagnie</label>
                <div className="text-sm">{showRuleModal.billet.informations?.code_compagnie || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type vol</label>
                <div className="text-sm">{showRuleModal.billet.informations?.type_vol || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Classe</label>
                <div className="text-sm">{showRuleModal.billet.informations?.classe || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix TTC</label>
                <div className="text-sm font-semibold">
                  {(showRuleModal.billet.informations?.prix_ttc || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix HT</label>
                <div className="text-sm font-semibold">
                  {(showRuleModal.billet.informations?.prix_ht || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                </div>
              </div>
            </div>
            {showRuleModal.billet.regle_appliquee ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Règle appliquée</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Compagnie:</span> {showRuleModal.billet.regle_appliquee.compagnie}
                  </div>
                  <div>
                    <span className="font-medium">Passager:</span> {showRuleModal.billet.regle_appliquee.passager}
                  </div>
                  <div>
                    <span className="font-medium">Type vol:</span> {showRuleModal.billet.regle_appliquee.typeVol}
                  </div>
                  <div>
                    <span className="font-medium">Classe:</span> {showRuleModal.billet.regle_appliquee.classe}
                  </div>
                  <div>
                    <span className="font-medium">Mode:</span> {showRuleModal.billet.mode_commission}
                  </div>
                  <div>
                    <span className="font-medium">Valeur:</span> {showRuleModal.billet.valeur_commission}
                    {showRuleModal.billet.mode_commission === '%' ? '%' : ' DA'}
                  </div>
                  <div>
                    <span className="font-medium">Base:</span> {showRuleModal.billet.base_commission}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Aucune règle trouvée</h4>
                <p className="text-sm text-yellow-700">{showRuleModal.billet.reason}</p>
              </div>
            )}
            {showRuleModal.billet?.regle_appliquee && (
              <button
                className="btn-secondary mt-2"
                onClick={async () => {
                  if (!showRuleModal.billet?._id) return;
                  
                  // Créer un billet sans règle appliquée
                  const billetSansRegle = {
                    ...showRuleModal.billet,
                    regle_appliquee: undefined,
                    commission_calculée: 0,
                    montant_fournisseur: showRuleModal.billet.informations?.prix_ttc || showRuleModal.billet.prix_ttc || 0,
                    base_commission: undefined,
                    mode_commission: undefined,
                    valeur_commission: undefined,
                    reason: 'Règle supprimée manuellement'
                  };
                  
                  // Sauvegarder directement sans recalculer
                  await saveCalculationsToDatabase([billetSansRegle]);
                  
                  // Mettre à jour l'état local
                  setBillets(prev => {
                    const updated = [...prev];
                    const index = updated.findIndex(b => b._id === billetSansRegle._id);
                    if (index !== -1) {
                      updated[index] = billetSansRegle;
                    }
                    return updated;
                  });
                  
                  setShowRuleModal({ open: false, billet: null });
                  alert('Règle supprimée avec succès !');
                }}
              >
                Supprimer la règle appliquée
              </button>
            )}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Résultat du calcul</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Commission:</span>
                  <div className="text-red-600 font-semibold">
                    -{(showRuleModal.billet.informations?.commission ?? showRuleModal.billet.commission_calculée ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                  </div>
                </div>
                <div>
                  <span className="font-medium">Net fournisseur:</span>
                  <div className="text-green-600 font-semibold">
                    {(showRuleModal.billet.informations?.netfournisseur ?? showRuleModal.billet.montant_fournisseur ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                  </div>
                </div>
                <div>
                  <span className="font-medium">Date calcul:</span>
                  <div className="text-gray-600">
                    {showRuleModal.billet.date_calcul_commission
                      ? new Date(showRuleModal.billet.date_calcul_commission).toLocaleDateString()
                      : '-'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={showAddRuleModal.open}
        onClose={() => setShowAddRuleModal({ open: false, billet: null })}
        title={isEditingRule ? "Modifier la règle de commission" : "Ajouter une règle de commission"}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              {isEditingRule ? "Modification de la règle existante" : "Informations du billet"}
            </h4>
            {showAddRuleModal.billet && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Compagnie:</span> {showAddRuleModal.billet.informations?.code_compagnie || '-'}
                </div>
                <div>
                  <span className="font-medium">Passager:</span> {showAddRuleModal.billet.informations?.type_pax || '-'}
                </div>
                <div>
                  <span className="font-medium">Type vol:</span> {showAddRuleModal.billet.informations?.type_vol || '-'}
                </div>
                <div>
                  <span className="font-medium">Classe:</span> {showAddRuleModal.billet.informations?.classe || '-'}
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Compagnie</label>
              <select
                value={newRule.compagnie}
                onChange={(e) => setNewRule({ ...newRule, compagnie: e.target.value })}
                className="input-field"
              >
                <option value="ALL">Toutes les compagnies</option>
                {showAddRuleModal.billet?.informations?.code_compagnie && (
                  <option value={showAddRuleModal.billet.informations.code_compagnie}>
                    {showAddRuleModal.billet.informations.code_compagnie}
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Passager</label>
              <select
                value={newRule.passager}
                onChange={(e) => setNewRule({ ...newRule, passager: e.target.value })}
                className="input-field"
              >
                <option value="ALL">Tous</option>
                {showAddRuleModal.billet?.informations?.type_pax && (
                  <option value={showAddRuleModal.billet.informations.type_pax}>
                    {showAddRuleModal.billet.informations.type_pax}
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type de vol</label>
              <select
                value={newRule.typeVol}
                onChange={(e) => setNewRule({ ...newRule, typeVol: e.target.value })}
                className="input-field"
              >
                <option value="ALL">Tous</option>
                {showAddRuleModal.billet?.informations?.type_vol && (
                  <option value={showAddRuleModal.billet.informations.type_vol}>
                    {showAddRuleModal.billet.informations.type_vol}
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Classe</label>
              <select
                value={newRule.classe}
                onChange={(e) => setNewRule({ ...newRule, classe: e.target.value })}
                className="input-field"
              >
                <option value="ALL">Toutes</option>
                {showAddRuleModal.billet?.informations?.classe && (
                  <option value={showAddRuleModal.billet.informations.classe}>
                    {showAddRuleModal.billet.informations.classe}
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mode</label>
              <select
                value={newRule.mode}
                onChange={(e) => setNewRule({ ...newRule, mode: e.target.value })}
                className="input-field"
              >
                <option value="Fixe">Fixe</option>
                <option value="%">Pourcentage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valeur</label>
              <input
                type="number"
                value={newRule.valeur}
                onChange={(e) => setNewRule({ ...newRule, valeur: Number(e.target.value) })}
                className="input-field"
                placeholder={newRule.mode === 'Fixe' ? 'Montant en DA' : 'Pourcentage'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Base</label>
              <select
                value={newRule.base}
                onChange={(e) => setNewRule({ ...newRule, base: e.target.value })}
                className="input-field"
              >
                <option value="TTC">TTC</option>
                <option value="HT">HT</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowAddRuleModal({ open: false, billet: null })}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleAddRule}
              className="btn-primary"
            >
              {isEditingRule ? "Modifier la règle" : "Ajouter la règle"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TransactionsPage; 