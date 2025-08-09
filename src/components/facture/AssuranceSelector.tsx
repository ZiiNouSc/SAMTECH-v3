import React, { useState, useEffect } from 'react';
import { X, Search, Shield, Calendar, User, Check, CreditCard } from 'lucide-react';
import { assuranceAPI } from '../../services/api';

interface AssuranceSelectorProps {
  onAddAssurances: (assurances: any[]) => void;
  onClose: () => void;
}

interface Assurance {
  id: string;
  _id: string;
  typeAssurance: string;
  compagnieAssurance: string;
  numeroPolice: string;
  dateDebut: string;
  dateFin: string;
  montantCouverture: number;
  prime: number;
  statut: string;
  clientNom: string;
  informations?: any;
}

const AssuranceSelector: React.FC<AssuranceSelectorProps> = ({ onAddAssurances, onClose }) => {
  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssurances, setSelectedAssurances] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAssurancesNonFacturees();
  }, []);

  const fetchAssurancesNonFacturees = async () => {
    try {
      setLoading(true);
      const response = await assuranceAPI.getNonFactures();
      const assurancesData = response.data?.data || [];
      setAssurances(assurancesData);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des assurances:', error);
      alert('Erreur lors du chargement des assurances non facturées');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssurances = assurances.filter(assurance => {
    const searchLower = searchQuery.toLowerCase();
    return (
      assurance.typeAssurance?.toLowerCase().includes(searchLower) ||
      assurance.compagnieAssurance?.toLowerCase().includes(searchLower) ||
      assurance.clientNom?.toLowerCase().includes(searchLower) ||
      assurance.numeroPolice?.toLowerCase().includes(searchLower)
    );
  });

  const toggleSelection = (assuranceId: string) => {
    const newSelection = new Set(selectedAssurances);
    if (newSelection.has(assuranceId)) {
      newSelection.delete(assuranceId);
    } else {
      newSelection.add(assuranceId);
    }
    setSelectedAssurances(newSelection);
  };

  const handleAddSelected = () => {
    const assurancesSelectionnees = assurances.filter(assurance => 
      selectedAssurances.has(assurance._id || assurance.id)
    );

    const articles = assurancesSelectionnees.map((assurance, index) => {
      const typeAssurance = assurance.typeAssurance || 'Assurance';
      const compagnie = assurance.compagnieAssurance || '';
      const numeroPolice = assurance.numeroPolice || '';
      const dateDebut = assurance.dateDebut ? new Date(assurance.dateDebut).toLocaleDateString('fr-FR') : '';
      const dateFin = assurance.dateFin ? new Date(assurance.dateFin).toLocaleDateString('fr-FR') : '';
      const montantCouverture = assurance.montantCouverture || 0;
      
      // Construction de la désignation détaillée
      let designation = typeAssurance;
      
      if (compagnie) {
        designation += ` - ${compagnie}`;
      }
      
      if (assurance.clientNom) {
        designation += `\nAssuré: ${assurance.clientNom}`;
      }
      
      if (numeroPolice) {
        designation += `\nPolice N°: ${numeroPolice}`;
      }
      
      if (montantCouverture > 0) {
        designation += `\nCouverture: ${montantCouverture.toLocaleString('fr-FR')} DA`;
      }
      
      if (dateDebut && dateFin) {
        designation += `\nPériode: du ${dateDebut} au ${dateFin}`;
      } else if (dateDebut) {
        designation += `\nDate de début: ${dateDebut}`;
      }

      return {
        id: `assurance-${assurance._id || assurance.id}-${Date.now()}-${index}`,
        designation,
        quantite: 1,
        prixUnitaire: assurance.prime || 0,
        montant: assurance.prime || 0,
        assuranceId: assurance._id || assurance.id,
        type: 'assurance'
      };
    });

    onAddAssurances(articles);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const renderAssuranceCard = (assurance: Assurance) => {
    const isSelected = selectedAssurances.has(assurance._id || assurance.id);

    return (
      <div
        key={assurance._id || assurance.id}
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected 
            ? 'border-orange-500 bg-orange-50 shadow-md' 
            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }`}
        onClick={() => toggleSelection(assurance._id || assurance.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">
                {assurance.typeAssurance || 'Assurance'}
              </h3>
              {isSelected && <Check className="w-5 h-5 text-orange-600" />}
            </div>

            {assurance.compagnieAssurance && (
              <div className="text-sm text-gray-600 mb-2">
                Compagnie: {assurance.compagnieAssurance}
              </div>
            )}

            {assurance.clientNom && (
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{assurance.clientNom}</span>
              </div>
            )}

            {assurance.numeroPolice && (
              <div className="text-sm text-gray-600 mb-2">
                Police: {assurance.numeroPolice}
              </div>
            )}

            {assurance.montantCouverture && (
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Couverture: {assurance.montantCouverture.toLocaleString('fr-FR')} DA
                </span>
              </div>
            )}

            {(assurance.dateDebut || assurance.dateFin) && (
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {assurance.dateDebut && formatDate(assurance.dateDebut)}
                  {assurance.dateDebut && assurance.dateFin && ' - '}
                  {assurance.dateFin && formatDate(assurance.dateFin)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                assurance.statut === 'active' || assurance.statut === 'confirmée' || assurance.statut === 'confirme'
                  ? 'bg-green-100 text-green-800'
                  : assurance.statut === 'validee'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {assurance.statut || 'En cours'}
              </span>
              
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {(assurance.prime || 0).toLocaleString('fr-FR')} DA
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="w-6 h-6 text-orange-600" />
              <span>Sélectionner des assurances</span>
            </h2>
            <p className="text-gray-600 mt-1">
              {assurances.length} assurance(s) non facturée(s) disponible(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par type, compagnie, client ou police..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Chargement des assurances...</span>
            </div>
          ) : filteredAssurances.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Aucune assurance trouvée' : 'Aucune assurance non facturée'}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Essayez de modifier votre recherche'
                  : 'Toutes les assurances ont été facturées'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAssurances.map(renderAssuranceCard)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedAssurances.size} assurance(s) sélectionnée(s)
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedAssurances.size === 0}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Ajouter {selectedAssurances.size > 0 && `(${selectedAssurances.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssuranceSelector; 