import React, { useState, useEffect } from 'react';
import { 
  Search,
  RefreshCw,
  Plus,
  Check,
  X,
  AlertTriangle,
  Package,
  ExternalLink
} from 'lucide-react';
import { PrestationExistante, ArticleWithPrestation } from '../../types/prestations';
import { prestationsAPI } from '../../services/api';
import { prestationConfigs, generateDesignationForPrestation } from '../../utils/prestationUtils';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';

interface PrestationSelectorProps {
  clientId: string;
  onAddPrestations: (prestations: ArticleWithPrestation[]) => void;
  onClose: () => void;
}

const PrestationSelector: React.FC<PrestationSelectorProps> = ({
  clientId,
  onAddPrestations,
  onClose
}) => {
  const [prestations, setPrestations] = useState<PrestationExistante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchReference, setSearchReference] = useState('');
  const [selectedPrestations, setSelectedPrestations] = useState<Set<string>>(new Set());
  const [searchResult, setSearchResult] = useState<PrestationExistante | null>(null);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    fetchPrestationsNonFacturees();
  }, [clientId]);

  const fetchPrestationsNonFacturees = async () => {
    try {
      setLoading(true);
      const response = await prestationsAPI.getNonFacturees(clientId);
      const prestationsData = response.data?.data || [];
      setPrestations(prestationsData);
    } catch (error: any) {
      console.error('Erreur lors du chargement des prestations:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchByReference = async () => {
    if (!searchReference.trim()) return;

    try {
      setSearching(true);
      setSearchError('');
      setSearchResult(null);

      const response = await prestationsAPI.getByReference(searchReference.trim());
      const prestation = response.data?.data;
      
      if (prestation) {
        setSearchResult(prestation);
        // Vérifier si cette prestation n'est pas déjà dans la liste
        const isAlreadyListed = prestations.some(p => p.id === prestation.id);
        if (isAlreadyListed) {
          setSearchError('Cette prestation est déjà listée ci-dessous');
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Prestation non trouvée';
      setSearchError(errorMessage);
    } finally {
      setSearching(false);
    }
  };

  const toggleSelection = (prestationId: string) => {
    const newSelected = new Set(selectedPrestations);
    if (newSelected.has(prestationId)) {
      newSelected.delete(prestationId);
    } else {
      newSelected.add(prestationId);
    }
    setSelectedPrestations(newSelected);
  };

  const addSearchResultToSelection = () => {
    if (searchResult) {
      const newSelected = new Set(selectedPrestations);
      newSelected.add(searchResult.id);
      setSelectedPrestations(newSelected);
      
      // Ajouter à la liste des prestations si pas déjà présente
      if (!prestations.some(p => p.id === searchResult.id)) {
        setPrestations(prev => [searchResult, ...prev]);
      }
      
      setSearchResult(null);
      setSearchReference('');
    }
  };

  const convertToArticles = (prestationsToConvert: PrestationExistante[]): ArticleWithPrestation[] => {
    return prestationsToConvert.map(prestation => {
      // Créer l'objet prestation avec la structure correcte
      const prestationData = {
        type: prestation.type,
        designation: prestation.designation,
        designationAuto: true,
        ...prestation.details
      };

      // Générer la désignation automatiquement
      const designation = generateDesignationForPrestation(prestationData);

      return {
        id: `imported-${prestation.id}-${Date.now()}`,
        designation: designation || prestation.designation,
        quantite: 1,
        prixUnitaire: prestation.prix,
        montant: prestation.prix,
        prestation: prestationData
      };
    });
  };

  const handleAddSelected = () => {
    const prestationsToAdd = prestations.filter(p => selectedPrestations.has(p.id));
    
    if (searchResult && selectedPrestations.has(searchResult.id)) {
      prestationsToAdd.push(searchResult);
    }

    const articles = convertToArticles(prestationsToAdd);
    onAddPrestations(articles);
    onClose();
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR') + ' DA';
  };

  const renderPrestationCard = (prestation: PrestationExistante, isSearchResult = false) => {
    const config = prestationConfigs[prestation.type];
    const isSelected = selectedPrestations.has(prestation.id);

    return (
      <div
        key={prestation.id}
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        } ${isSearchResult ? 'border-green-500 bg-green-50' : ''}`}
        onClick={() => toggleSelection(prestation.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{config?.icon}</span>
              <span className="text-sm font-medium text-blue-600">{config?.label}</span>
              <Badge variant="default">{prestation.reference}</Badge>
              {isSearchResult && (
                <Badge variant="success">Trouvé par référence</Badge>
              )}
            </div>
            
            <h4 className="font-medium text-gray-900 mb-2">
              {prestation.designation}
            </h4>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>📅 {new Date(prestation.datePrestation).toLocaleDateString('fr-FR')}</p>
              <p className="font-medium text-green-600">{formatPrice(prestation.prix)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isSelected && (
              <Check className="w-5 h-5 text-blue-600" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Prestations non facturées
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recherche par référence */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-3">
            🔍 Rechercher par référence
          </h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchReference}
              onChange={(e) => setSearchReference(e.target.value)}
              placeholder="Numéro de billet, voucher, police, etc."
              className="flex-1 input-field"
              onKeyPress={(e) => e.key === 'Enter' && searchByReference()}
            />
            <button
              onClick={searchByReference}
              disabled={searching || !searchReference.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {searching ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {searchError && (
            <div className="mt-2 flex items-center space-x-2 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{searchError}</span>
            </div>
          )}
        </div>

        {/* Résultat de recherche */}
        {searchResult && !searchError && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-700">
                ✅ Prestation trouvée
              </h3>
              <button
                onClick={addSearchResultToSelection}
                className="text-sm text-green-600 hover:text-green-700 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Sélectionner</span>
              </button>
            </div>
            {renderPrestationCard(searchResult, true)}
          </div>
        )}

        {/* Liste des prestations */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Prestations disponibles ({prestations.length})
            </h3>
            <button
              onClick={fetchPrestationsNonFacturees}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : prestations.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Aucune prestation non facturée</p>
                <p className="text-sm text-gray-400">
                  Toutes les prestations de ce client ont été facturées.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prestations.map(prestation => renderPrestationCard(prestation))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-600">
            {selectedPrestations.size} prestation(s) sélectionnée(s)
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedPrestations.size === 0}
              className="btn-primary disabled:opacity-50"
            >
              Ajouter {selectedPrestations.size > 0 ? `(${selectedPrestations.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrestationSelector; 