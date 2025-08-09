import React, { useState, useEffect } from 'react';
import { X, CreditCard, Wallet, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { facturesAPI } from '../../services/api';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';

interface PaiementFournisseurModalProps {
  isOpen: boolean;
  onClose: () => void;
  facture: any;
  fournisseur: any;
  onSuccess: () => void;
}

const PaiementFournisseurModal: React.FC<PaiementFournisseurModalProps> = ({
  isOpen,
  onClose,
  facture,
  fournisseur,
  onSuccess
}) => {
  const [modePaiement, setModePaiement] = useState<'solde_crediteur' | 'moyen_paiement' | 'mixte'>('moyen_paiement');
  const [moyenPaiement, setMoyenPaiement] = useState('especes');
  const [montantAPayer, setMontantAPayer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [capacitePaiement, setCapacitePaiement] = useState<any>(null);

  const montantRestant = facture?.montantTTC - (facture?.montantPaye || 0);
  const soldeCrediteur = fournisseur?.soldeCrediteur || 0;

  useEffect(() => {
    if (isOpen && fournisseur?.id && montantRestant > 0) {
      verifierCapacite();
    }
  }, [isOpen, fournisseur, montantRestant]);

  useEffect(() => {
    setMontantAPayer(montantRestant);
  }, [montantRestant]);

  const verifierCapacite = async () => {
    try {
      const response = await facturesAPI.verifierCapacitePaiement(fournisseur.id, montantRestant);
      setCapacitePaiement(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!montantAPayer || montantAPayer <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    if (montantAPayer > montantRestant) {
      alert('Le montant à payer ne peut pas dépasser le montant restant');
      return;
    }

    setLoading(true);

    try {
      const data = {
        montantAPayer,
        modePaiement,
        ...(modePaiement !== 'solde_crediteur' && { moyenPaiement })
      };

      await facturesAPI.payerFactureFournisseur(facture.id, data);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors du paiement:', error);
      alert(error.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const getModePaiementInfo = () => {
    switch (modePaiement) {
      case 'solde_crediteur':
        return {
          title: 'Paiement par solde créditeur',
          description: `Utiliser le solde créditeur du fournisseur (${soldeCrediteur.toLocaleString('fr-FR')} DA)`,
          icon: <Wallet className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'moyen_paiement':
        return {
          title: 'Paiement par moyen de paiement',
          description: 'Effectuer un paiement via la caisse',
          icon: <CreditCard className="w-5 h-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'mixte':
        return {
          title: 'Paiement mixte',
          description: `Utiliser d'abord le solde créditeur (${soldeCrediteur.toLocaleString('fr-FR')} DA), puis le moyen de paiement`,
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      default:
        return null;
    }
  };

  const modeInfo = getModePaiementInfo();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Paiement facture fournisseur"
      size="lg"
    >
      <div className="space-y-6">
        {/* Informations de la facture */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Facture {facture?.numero}</h3>
            <Badge variant="info">Fournisseur</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Montant total:</span>
              <p className="font-medium text-gray-900">
                {facture?.montantTTC?.toLocaleString('fr-FR')} DA
              </p>
            </div>
            <div>
              <span className="text-gray-600">Montant payé:</span>
              <p className="font-medium text-gray-900">
                {facture?.montantPaye?.toLocaleString('fr-FR')} DA
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Montant restant:</span>
              <p className="font-semibold text-red-600 text-lg">
                {montantRestant.toLocaleString('fr-FR')} DA
              </p>
            </div>
          </div>
        </div>

        {/* Informations du fournisseur */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">Informations fournisseur</span>
          </div>
          <p className="text-sm text-blue-700 mb-2">
            <span className="font-medium">Nom:</span> {fournisseur?.entreprise || fournisseur?.nom}
          </p>
          <p className="text-sm text-blue-700">
            <span className="font-medium">Solde créditeur:</span> {soldeCrediteur.toLocaleString('fr-FR')} DA
          </p>
          {capacitePaiement && (
            <div className="mt-2">
              {capacitePaiement.peutPayerCompletement ? (
                <p className="text-sm text-green-600 font-medium">
                  ✓ Paiement complet possible
                </p>
              ) : (
                <p className="text-sm text-orange-600">
                  ⚠ Paiement partiel: {capacitePaiement.montantPayable.toLocaleString('fr-FR')} DA
                </p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode de paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Mode de paiement
            </label>
            <div className="space-y-3">
              {[
                { value: 'moyen_paiement', label: 'Moyen de paiement', desc: 'Effectuer un paiement via la caisse' },
                { value: 'solde_crediteur', label: 'Solde créditeur', desc: `Utiliser le solde créditeur (${soldeCrediteur.toLocaleString('fr-FR')} DA)` },
                { value: 'mixte', label: 'Mixte (solde + moyen)', desc: 'Utiliser d\'abord le solde, puis le moyen de paiement' }
              ].map((option) => (
                <label key={option.value} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    checked={modePaiement === option.value}
                    onChange={(e) => setModePaiement(e.target.value as any)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <p className="text-sm text-gray-600">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Informations du mode sélectionné */}
          {modeInfo && (
            <div className={`p-4 ${modeInfo.bgColor} border ${modeInfo.borderColor} rounded-lg`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={modeInfo.color}>{modeInfo.icon}</span>
                <span className="font-medium text-gray-900">{modeInfo.title}</span>
              </div>
              <p className="text-sm text-gray-600">{modeInfo.description}</p>
            </div>
          )}

          {/* Moyen de paiement (si nécessaire) */}
          {modePaiement !== 'solde_crediteur' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moyen de paiement
              </label>
              <select
                value={moyenPaiement}
                onChange={(e) => setMoyenPaiement(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="especes">Espèces</option>
                <option value="virement">Virement</option>
                <option value="cheque">Chèque</option>
              </select>
            </div>
          )}

          {/* Montant à payer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant à payer (DA)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={montantAPayer}
                onChange={(e) => setMontantAPayer(parseFloat(e.target.value) || 0)}
                min="0"
                max={montantRestant}
                step="0.01"
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Montant à payer"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Maximum: {montantRestant.toLocaleString('fr-FR')} DA
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !montantAPayer || montantAPayer <= 0}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Paiement...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Effectuer le paiement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PaiementFournisseurModal; 