import React, { useState, useEffect } from 'react';
import { X, Search, Hotel, MapPin, Calendar, Users, Check } from 'lucide-react';
import { hotelAPI } from '../../services/api';

interface HotelSelectorProps {
  onAddHotels: (hotels: any[]) => void;
  onClose: () => void;
}

interface Hotel {
  id: string;
  _id: string;
  nomHotel: string;
  ville: string;
  dateArrivee: string;
  dateDepart: string;
  nombreNuits: number;
  nombreChambres: number;
  typeChambres: string;
  prix: number;
  statut: string;
  clientNom: string;
  informations?: any;
}

const HotelSelector: React.FC<HotelSelectorProps> = ({ onAddHotels, onClose }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHotelsNonFactures();
  }, []);

  const fetchHotelsNonFactures = async () => {
    try {
      setLoading(true);
      const response = await hotelAPI.getNonFactures();
      const hotelsData = response.data?.data || [];
      setHotels(hotelsData);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des hôtels:', error);
      alert('Erreur lors du chargement des hôtels non facturés');
    } finally {
      setLoading(false);
    }
  };

  const filteredHotels = hotels.filter(hotel => {
    const searchLower = searchQuery.toLowerCase();
    return (
      hotel.nomHotel?.toLowerCase().includes(searchLower) ||
      hotel.ville?.toLowerCase().includes(searchLower) ||
      hotel.clientNom?.toLowerCase().includes(searchLower)
    );
  });

  const toggleSelection = (hotelId: string) => {
    const newSelection = new Set(selectedHotels);
    if (newSelection.has(hotelId)) {
      newSelection.delete(hotelId);
    } else {
      newSelection.add(hotelId);
    }
    setSelectedHotels(newSelection);
  };

  const handleAddSelected = () => {
    const hotelsSelectionnes = hotels.filter(hotel => 
      selectedHotels.has(hotel._id || hotel.id)
    );

    const articles = hotelsSelectionnes.map((hotel, index) => {
      const dateArrivee = hotel.dateArrivee ? new Date(hotel.dateArrivee).toLocaleDateString('fr-FR') : '';
      const dateDepart = hotel.dateDepart ? new Date(hotel.dateDepart).toLocaleDateString('fr-FR') : '';
      const duree = hotel.nombreNuits ? `${hotel.nombreNuits} nuit(s)` : '';
      const chambres = hotel.nombreChambres ? `${hotel.nombreChambres} chambre(s)` : '';
      const typeChambres = hotel.typeChambres || 'Standard';
      
      let designation = `Réservation hôtel - ${hotel.nomHotel || 'Hôtel'}`;
      
      if (hotel.ville) {
        designation += ` à ${hotel.ville}`;
      }
      
      if (dateArrivee && dateDepart) {
        designation += `\nPériode: du ${dateArrivee} au ${dateDepart}`;
      }
      
      if (duree) {
        designation += ` (${duree})`;
      }
      
      if (chambres) {
        designation += `\n${chambres} ${typeChambres}`;
      }
      
      if (hotel.clientNom) {
        designation += `\nClient: ${hotel.clientNom}`;
      }

      return {
        id: `hotel-${hotel._id || hotel.id}-${Date.now()}-${index}`,
        designation,
        quantite: 1,
        prixUnitaire: hotel.prix || 0,
        montant: hotel.prix || 0,
        hotelId: hotel._id || hotel.id,
        type: 'hotel'
      };
    });

    onAddHotels(articles);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const renderHotelCard = (hotel: Hotel) => {
    const isSelected = selectedHotels.has(hotel._id || hotel.id);

    return (
      <div
        key={hotel._id || hotel.id}
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected 
            ? 'border-green-500 bg-green-50 shadow-md' 
            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }`}
        onClick={() => toggleSelection(hotel._id || hotel.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Hotel className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">
                {hotel.nomHotel || 'Hôtel non spécifié'}
              </h3>
              {isSelected && <Check className="w-5 h-5 text-green-600" />}
            </div>

            {hotel.ville && (
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{hotel.ville}</span>
              </div>
            )}

            {(hotel.dateArrivee || hotel.dateDepart) && (
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {formatDate(hotel.dateArrivee)} - {formatDate(hotel.dateDepart)}
                  {hotel.nombreNuits && ` (${hotel.nombreNuits} nuits)`}
                </span>
              </div>
            )}

            {hotel.nombreChambres && (
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {hotel.nombreChambres} chambre(s) {hotel.typeChambres || 'Standard'}
                </span>
              </div>
            )}

            {hotel.clientNom && (
              <div className="text-sm text-blue-600 mb-2">
                Client: {hotel.clientNom}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                hotel.statut === 'confirmée' || hotel.statut === 'confirme' || hotel.statut === 'confirmed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {hotel.statut || 'En attente'}
              </span>
              
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {(hotel.prix || 0).toLocaleString('fr-FR')} DA
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
              <Hotel className="w-6 h-6 text-green-600" />
              <span>Sélectionner des hôtels</span>
            </h2>
            <p className="text-gray-600 mt-1">
              {hotels.length} réservation(s) d'hôtel non facturée(s) disponible(s)
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
              placeholder="Rechercher par hôtel, ville ou client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Chargement des hôtels...</span>
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="text-center py-12">
              <Hotel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Aucun hôtel trouvé' : 'Aucun hôtel non facturé'}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Essayez de modifier votre recherche'
                  : 'Toutes les réservations d\'hôtel ont été facturées'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredHotels.map(renderHotelCard)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedHotels.size} hôtel(s) sélectionné(s)
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
              disabled={selectedHotels.size === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Ajouter {selectedHotels.size > 0 && `(${selectedHotels.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelSelector; 