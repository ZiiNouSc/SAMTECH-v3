import React, { useState, useEffect } from 'react';
import { 
  Search,
  RefreshCw,
  Plus,
  Check,
  X,
  AlertTriangle,
  Plane,
  ExternalLink,
  MapPin,
  Calendar,
  Users,
  Euro
} from 'lucide-react';
import { billetsAPI } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';

interface BilletSelectorProps {
  onAddBillets: (billets: any[]) => void;
  onClose: () => void;
}

const BilletSelector: React.FC<BilletSelectorProps> = ({
  onAddBillets,
  onClose
}) => {
  const [billets, setBillets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBillets, setSelectedBillets] = useState<Set<string>>(new Set());
  const [filteredBillets, setFilteredBillets] = useState<any[]>([]);

  useEffect(() => {
    fetchBilletsNonFactures();
  }, []);

  useEffect(() => {
    // Filtrer les billets en fonction de la recherche
    if (searchQuery.trim() === '') {
      setFilteredBillets(billets);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = billets.filter(billet => 
        billet.numero_billet?.toLowerCase().includes(query) ||
        billet.nom_passager?.toLowerCase().includes(query) ||
        billet.passager?.toLowerCase().includes(query) ||
        billet.compagnie?.toLowerCase().includes(query) ||
        billet.origine?.toLowerCase().includes(query) ||
        billet.destination?.toLowerCase().includes(query) ||
        billet.numeroVol?.toLowerCase().includes(query)
      );
      setFilteredBillets(filtered);
    }
  }, [searchQuery, billets]);

  const fetchBilletsNonFactures = async () => {
    try {
      setLoading(true);
      const response = await billetsAPI.getNonFactures();
      const billetsData = response.data?.data || [];
      setBillets(billetsData);
      setFilteredBillets(billetsData);
    } catch (error: any) {
      console.error('Erreur lors du chargement des billets:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (billetId: string) => {
    setSelectedBillets(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(billetId)) {
        newSelection.delete(billetId);
      } else {
        newSelection.add(billetId);
      }
      return newSelection;
    });
  };

  const handleAddSelected = () => {
    const billetsSelectionnes = billets.filter(billet => 
      selectedBillets.has(billet._id || billet.id)
    );

    const articles = billetsSelectionnes.map((billet, index) => {
      const passager = billet.nom_passager || billet.passager || billet.informations?.nom_passager || 'Passager non spécifié';
      const origine = billet.origine || billet.informations?.ville_depart || billet.informations?.origine || 'Départ';
      const destination = billet.destination || billet.informations?.ville_arrivee || billet.informations?.destination || 'Arrivée';
      const compagnie = billet.compagnie || billet.informations?.compagnie_aerienne || billet.code_compagnie || '';
      const numeroVol = billet.numeroVol || billet.informations?.numero_vol || billet.numero_billet || '';
      const dateDepart = billet.dateDepart || billet.informations?.date_depart || '';
      const dateArrivee = billet.dateArrivee || billet.informations?.date_arrivee || '';
      
      // Construction de la désignation détaillée
      let designation = `Billet d'avion - ${passager}`;
      
      // Ajouter le trajet
      if (origine !== 'Départ' || destination !== 'Arrivée') {
        designation += `\nTrajet: ${origine} → ${destination}`;
      }
      
      // Ajouter la compagnie et numéro de vol
      if (compagnie || numeroVol) {
        let ligneVol = '';
        if (compagnie) ligneVol += compagnie;
        if (numeroVol) ligneVol += (compagnie ? ' - ' : '') + `Vol ${numeroVol}`;
        if (ligneVol) designation += `\n${ligneVol}`;
      }
      
      // Ajouter les dates
      if (dateDepart) {
        const dateFormatee = new Date(dateDepart).toLocaleDateString('fr-FR');
        designation += `\nDate de départ: ${dateFormatee}`;
        
        if (dateArrivee && dateArrivee !== dateDepart) {
          const dateArriveeFormatee = new Date(dateArrivee).toLocaleDateString('fr-FR');
          designation += ` - Arrivée: ${dateArriveeFormatee}`;
        }
      }
      
      // Ajouter le numéro de billet si disponible
      const numeroBillet = billet.informations?.numero_billet || billet.numeroVol;
      if (numeroBillet) {
        designation += `\nN° de billet: ${numeroBillet}`;
      }
      
      return {
        id: `billet-${billet._id || billet.id}-${Date.now()}-${index}`,
        designation,
        quantite: 1,
        prixUnitaire: billet.prix_ttc || billet.montant_ttc || billet.prix || 0,
        montant: billet.prix_ttc || billet.montant_ttc || billet.prix || 0,
        billetId: billet._id || billet.id,
        type: 'billet'
      };
    });

    onAddBillets(articles);
    onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderBilletCard = (billet: any) => {
    const isSelected = selectedBillets.has(billet._id || billet.id);
    const prix = billet.prix_ttc || billet.montant_ttc || billet.prix || 0;

    return (
      <div
        key={billet._id || billet.id}
        className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
        onClick={() => toggleSelection(billet._id || billet.id)}
      >
        {/* Checkbox de sélection */}
        <div className="absolute top-3 right-3">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
          }`}>
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>

        {/* Contenu du billet */}
        <div className="space-y-3">
          {/* Header avec compagnie et numéro */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Plane className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-900">
                {billet.compagnie || 'Compagnie inconnue'}
              </span>
            </div>
            {billet.numeroVol && (
              <Badge variant="secondary" size="sm">
                {billet.numeroVol}
              </Badge>
            )}
          </div>

          {/* Passager */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {billet.nom_passager || billet.passager || 'Passager non spécifié'}
            </span>
          </div>

          {/* Trajet */}
          {(billet.origine || billet.destination || 
            billet.informations?.ville_depart || billet.informations?.ville_arrivee ||
            billet.informations?.origine || billet.informations?.destination) && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {(billet.origine || billet.informations?.ville_depart || billet.informations?.origine || 'Départ')} 
                {' → '}
                {(billet.destination || billet.informations?.ville_arrivee || billet.informations?.destination || 'Arrivée')}
              </span>
            </div>
          )}

          {/* Date de départ */}
          {billet.dateDepart && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {formatDate(billet.dateDepart)}
              </span>
            </div>
          )}

          {/* Numéro de billet */}
          {billet.numero_billet && (
            <div className="text-xs text-gray-500">
              Billet N° {billet.numero_billet}
            </div>
          )}

          {/* Prix */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Euro className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-green-600">
                {formatPrice(prix)}
              </span>
            </div>
            
            {billet.statut && (
              <Badge 
                variant={billet.statut === 'confirmé' || billet.statut === 'confirme' || billet.statut === 'issued' ? 'success' : 'secondary'}
                size="sm"
              >
                {billet.statut}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Plane className="w-5 h-5 mr-2 text-blue-600" />
            Billets d'avion non facturés
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recherche */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-3">
            🔍 Rechercher un billet
          </h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Numéro de billet, passager, compagnie, trajet..."
              className="flex-1 input-field"
            />
            <button
              onClick={() => setSearchQuery('')}
              className="btn-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {filteredBillets.length} billet(s) disponible(s)
              {searchQuery && ` (filtré sur "${searchQuery}")`}
            </span>
            <span className="text-gray-600">
              {selectedBillets.size} sélectionné(s)
            </span>
          </div>
        </div>

        {/* Liste des billets */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredBillets.length === 0 ? (
            <div className="text-center py-12">
              <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchQuery ? 'Aucun billet trouvé' : 'Aucun billet non facturé'}
              </p>
              <p className="text-sm text-gray-400">
                {searchQuery 
                  ? 'Essayez avec d\'autres termes de recherche.'
                  : 'Tous les billets ont été facturés.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBillets.map(billet => renderBilletCard(billet))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-600">
              {selectedBillets.size} billet(s) sélectionné(s)
            </p>
            {selectedBillets.size > 0 && (
              <p className="text-sm font-medium text-green-600">
                Total: {formatPrice(
                  billets
                    .filter(b => selectedBillets.has(b._id || b.id))
                    .reduce((sum, b) => sum + (b.prix_ttc || b.montant_ttc || b.prix || 0), 0)
                )}
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedBillets.size === 0}
              className="btn-primary disabled:opacity-50"
            >
              Ajouter {selectedBillets.size > 0 ? `(${selectedBillets.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BilletSelector; 