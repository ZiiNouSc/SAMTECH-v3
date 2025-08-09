import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calculator, AlertCircle, CheckCircle, Banknote, RefreshCw } from 'lucide-react';
import { facturesFournisseursAPI } from '../services/api';

interface Fournisseur {
  _id: string;
  entreprise: string;
  nom: string;
  prenom: string;
  soldeCrediteur: number;
  detteFournisseur: number;
}

interface FactureFournisseur {
  _id: string;
  numero: string;
  fournisseurId: Fournisseur;
  montantTTC: number;
  montantPaye?: number;
  statut: string;
  dateEcheance: string;
}

interface PaiementFactureFournisseurModalProps {
  isOpen: boolean;
  onClose: () => void;
  facture: FactureFournisseur;
  onSuccess?: () => void;
}

type ModePaiement = 'solde' | 'caisse' | 'mixte';

const PaiementFactureFournisseurModal: React.FC<PaiementFactureFournisseurModalProps> = ({
  isOpen,
  onClose,
  facture,
  onSuccess = () => {}
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingFournisseur, setLoadingFournisseur] = useState(false);
  const [modePaiement, setModePaiement] = useState<ModePaiement | null>(null);
  const [soldeDisponible, setSoldeDisponible] = useState(0);
  const [detteFournisseur, setDetteFournisseur] = useState(0);
  const [paiementData, setPaiementData] = useState({
    montantSolde: 0,
    montantCaisse: 0,
    montantDette: 0,
    modePaiementCaisse: 'especes',
    reference: '',
    notes: ''
  });

  const montantRestant = facture.montantTTC - (facture.montantPaye || 0);

  const formatMontant = (montant: number | undefined | null): string => {
    if (montant === undefined || montant === null) return '0';
    return montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Recalculer automatiquement la dette quand les montants changent
  const recalculerDette = (montantSolde: number, montantCaisse: number) => {
    return Math.max(0, montantRestant - montantSolde - montantCaisse);
  };

  useEffect(() => {
    if (isOpen && facture) {
      fetchFournisseurData();
    }
  }, [isOpen, facture]);

  // Recalculer la dette automatiquement
  useEffect(() => {
    if (modePaiement) {
      const nouvelleDette = recalculerDette(paiementData.montantSolde, paiementData.montantCaisse);
      setPaiementData(prev => ({
        ...prev,
        montantDette: nouvelleDette
      }));
    }
  }, [paiementData.montantSolde, paiementData.montantCaisse, montantRestant, modePaiement]);

  const fetchFournisseurData = async () => {
    try {
      setLoadingFournisseur(true);
      console.log('🔍 Récupération des données du fournisseur:', facture.fournisseurId._id);
      
      const response = await fetch(`/api/fournisseurs/${facture.fournisseurId._id}`, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('samtech_user') || '{}').token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Données du fournisseur reçues:', data);
      
      const soldeCrediteur = data.data?.soldeCrediteur || 0;
      const detteFournisseur = data.data?.detteFournisseur || 0;
      
      console.log(' Solde créditeur:', soldeCrediteur);
      console.log(' Dette fournisseur:', detteFournisseur);
      
      setSoldeDisponible(soldeCrediteur);
      setDetteFournisseur(detteFournisseur);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données du fournisseur:', error);
      setSoldeDisponible(0);
      setDetteFournisseur(0);
    } finally {
      setLoadingFournisseur(false);
    }
  };

  const handleModePaiementChange = (mode: ModePaiement) => {
    setModePaiement(mode);
    
    // Réinitialiser les montants selon le mode
    if (mode === 'solde') {
      const montantSolde = Math.min(soldeDisponible, montantRestant);
      const montantDette = recalculerDette(montantSolde, 0);
      
      setPaiementData(prev => ({
        ...prev,
        montantSolde: montantSolde,
        montantCaisse: 0,
        montantDette: montantDette
      }));
    } else if (mode === 'caisse') {
      setPaiementData(prev => ({
        ...prev,
        montantSolde: 0,
        montantCaisse: montantRestant,
        montantDette: 0
      }));
    } else if (mode === 'mixte') {
      const montantSolde = Math.min(soldeDisponible, montantRestant / 2);
      const montantCaisse = Math.max(0, montantRestant - montantSolde);
      const montantDette = recalculerDette(montantSolde, montantCaisse);
      
      setPaiementData(prev => ({
        ...prev,
        montantSolde: montantSolde,
        montantCaisse: montantCaisse,
        montantDette: montantDette
      }));
    }
  };

  const handleMontantSoldeChange = (value: number) => {
    const montantSolde = Math.min(value, soldeDisponible);
    const montantDette = recalculerDette(montantSolde, paiementData.montantCaisse);
    
    setPaiementData(prev => ({
      ...prev,
      montantSolde,
      montantDette
    }));
  };

  const handleMontantCaisseChange = (value: number) => {
    const montantCaisse = Math.min(value, montantRestant - paiementData.montantSolde);
    const montantDette = recalculerDette(paiementData.montantSolde, montantCaisse);
    
    setPaiementData(prev => ({
      ...prev,
      montantCaisse,
      montantDette
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modePaiement) {
      alert('Veuillez sélectionner un mode de paiement');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🚀 Envoi du paiement avec les données:', {
        factureId: facture._id,
        fournisseurId: facture.fournisseurId._id,
        montantSolde: paiementData.montantSolde,
        montantCaisse: paiementData.montantCaisse,
        montantDette: paiementData.montantDette,
        modePaiementCaisse: paiementData.modePaiementCaisse,
        reference: paiementData.reference,
        notes: paiementData.notes,
        typePaiement: modePaiement
      });

      const response = await facturesFournisseursAPI.markAsPaid(facture._id);

      console.log('✅ Paiement réussi:', response.data);
      
      // Rafraîchir les données du fournisseur après le paiement
      await fetchFournisseurData();
      
      // Notifier le composant parent du succès
      onSuccess();
      onClose();
      
      alert('Paiement traité avec succès !');
      
    } catch (error: any) {
      console.error('❌ Erreur lors du paiement:', error);
      const message = error.response?.data?.message || 'Erreur lors du paiement';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Paiement de la facture</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de la facture */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de la facture</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Numéro de facture</label>
                <p className="mt-1 text-sm text-gray-900">{facture.numero}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fournisseur</label>
                <p className="mt-1 text-sm text-gray-900">{facture.fournisseurId.entreprise}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Montant total</label>
                <p className="mt-1 text-sm text-gray-900">{formatMontant(facture.montantTTC)} DA</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Montant restant</label>
                <p className="mt-1 text-sm font-semibold text-red-600">{formatMontant(montantRestant)} DA</p>
              </div>
            </div>
          </div>

          {/* Informations du fournisseur avec bouton de rafraîchissement */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-blue-900">Informations du fournisseur</h3>
              <button
                type="button"
                onClick={fetchFournisseurData}
                disabled={loadingFournisseur}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loadingFournisseur ? 'animate-spin' : ''}`} />
                Rafraîchir
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-700">Solde créditeur</label>
                <p className="text-lg font-bold text-green-700">{formatMontant(soldeDisponible)} DA</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700">Dette fournisseur</label>
                <p className="text-lg font-bold text-red-700">{formatMontant(detteFournisseur)} DA</p>
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-2">
              Vous pouvez utiliser le solde créditeur pour payer tout ou partie de cette facture
            </p>
          </div>

          {/* Sélection du mode de paiement */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mode de paiement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => handleModePaiementChange('solde')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  modePaiement === 'solde'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="text-center">
                  <CreditCard className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-semibold">Solde uniquement</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Utiliser le solde créditeur
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleModePaiementChange('caisse')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  modePaiement === 'caisse'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-center">
                  <Banknote className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-semibold">Caisse uniquement</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Paiement via la caisse
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleModePaiementChange('mixte')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  modePaiement === 'mixte'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-center">
                  <CreditCard className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-semibold">Paiement combiné</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Combiner solde et caisse
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Répartition du paiement */}
          {modePaiement && !loadingFournisseur && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Répartition du paiement
              </h3>
              
              <div className="space-y-4">
                {/* Champ Solde créditeur */}
                {(modePaiement === 'solde' || modePaiement === 'mixte') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant via solde créditeur
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={Math.min(soldeDisponible, montantRestant)}
                        value={paiementData.montantSolde}
                        onChange={(e) => handleMontantSoldeChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-2 text-gray-500">DA</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Disponible: {formatMontant(soldeDisponible)} DA
                    </p>
                  </div>
                )}

                {/* Champ Caisse */}
                {(modePaiement === 'caisse' || modePaiement === 'mixte') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant via caisse
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={montantRestant - paiementData.montantSolde}
                        value={paiementData.montantCaisse}
                        onChange={(e) => handleMontantCaisseChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-2 text-gray-500">DA</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Restant à payer: {formatMontant(montantRestant - paiementData.montantSolde)} DA
                    </p>
                  </div>
                )}

                {/* Mode de paiement caisse */}
                {(modePaiement === 'caisse' || modePaiement === 'mixte') && paiementData.montantCaisse > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mode de paiement caisse
                    </label>
                    <select
                      value={paiementData.modePaiementCaisse}
                      onChange={(e) => setPaiementData(prev => ({ ...prev, modePaiementCaisse: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="especes">Espèces</option>
                      <option value="cheque">Chèque</option>
                      <option value="virement">Virement</option>
                      <option value="carte">Carte bancaire</option>
                    </select>
                  </div>
                )}

                {/* Montant dette restante */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dette restante (automatique)
                  </label>
                  <p className={`text-lg font-semibold ${paiementData.montantDette > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatMontant(paiementData.montantDette)} DA
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {paiementData.montantDette > 0 
                      ? 'Cette dette sera ajoutée au fournisseur'
                      : 'Facture entièrement payée'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Champs optionnels */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence (optionnel)
              </label>
              <input
                type="text"
                value={paiementData.reference}
                onChange={(e) => setPaiementData(prev => ({ ...prev, reference: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Numéro de chèque, référence virement..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={paiementData.notes}
                onChange={(e) => setPaiementData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Informations supplémentaires..."
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !modePaiement}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Traiter le paiement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaiementFactureFournisseurModal;