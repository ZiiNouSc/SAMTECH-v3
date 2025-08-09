import React, { useState, useEffect } from 'react';
import { X, Search, FileText, MapPin, Calendar, User, Check } from 'lucide-react';
import { visaAPI } from '../../services/api';

interface VisaSelectorProps {
  onAddVisas: (visas: any[]) => void;
  onClose: () => void;
}

interface Visa {
  id: string;
  _id: string;
  typeVisa: string;
  pays: string;
  duree: string;
  dateDebut: string;
  dateFin: string;
  prix: number;
  statut: string;
  clientNom: string;
  numeroPasseport: string;
  informations?: any;
}

const VisaSelector: React.FC<VisaSelectorProps> = ({ onAddVisas, onClose }) => {
  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisas, setSelectedVisas] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVisasNonFactures();
  }, []);

  const fetchVisasNonFactures = async () => {
    try {
      setLoading(true);
      const response = await visaAPI.getNonFactures();
      const visasData = response.data?.data || [];
      setVisas(visasData);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des visas:', error);
      alert('Erreur lors du chargement des visas non facturés');
    } finally {
      setLoading(false);
    }
  };

  const filteredVisas = visas.filter(visa => {
    const searchLower = searchQuery.toLowerCase();
    return (
      visa.typeVisa?.toLowerCase().includes(searchLower) ||
      visa.pays?.toLowerCase().includes(searchLower) ||
      visa.clientNom?.toLowerCase().includes(searchLower) ||
      visa.numeroPasseport?.toLowerCase().includes(searchLower)
    );
  });

  const toggleSelection = (visaId: string) => {
    const newSelection = new Set(selectedVisas);
    if (newSelection.has(visaId)) {
      newSelection.delete(visaId);
    } else {
      newSelection.add(visaId);
    }
    setSelectedVisas(newSelection);
  };

  const handleAddSelected = () => {
    const visasSelectionnes = visas.filter(visa => 
      selectedVisas.has(visa._id || visa.id)
    );

    const articles = visasSelectionnes.map((visa, index) => {
      const typeVisa = visa.typeVisa || 'Visa';
      const pays = visa.pays || '';
      const duree = visa.duree || '';
      const dateDebut = visa.dateDebut ? new Date(visa.dateDebut).toLocaleDateString('fr-FR') : '';
      const dateFin = visa.dateFin ? new Date(visa.dateFin).toLocaleDateString('fr-FR') : '';
      const numeroPasseport = visa.numeroPasseport || '';
      
      // Construction de la désignation détaillée
      let designation = `${typeVisa}`;
      
      if (pays) {
        designation += ` pour ${pays}`;
      }
      
      if (visa.clientNom) {
        designation += `\nDemandeur: ${visa.clientNom}`;
      }
      
      if (numeroPasseport) {
        designation += `\nPasseport: ${numeroPasseport}`;
      }
      
      if (duree) {
        designation += `\nDurée: ${duree}`;
      }
      
      if (dateDebut && dateFin) {
        designation += `\nValidité: du ${dateDebut} au ${dateFin}`;
      } else if (dateDebut) {
        designation += `\nDate de début: ${dateDebut}`;
      }

      return {
        id: `visa-${visa._id || visa.id}-${Date.now()}-${index}`,
        designation,
        quantite: 1,
        prixUnitaire: visa.prix || 0,
        montant: visa.prix || 0,
        visaId: visa._id || visa.id,
        type: 'visa'
      };
    });

    onAddVisas(articles);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const renderVisaCard = (visa: Visa) => {
    const isSelected = selectedVisas.has(visa._id || visa.id);

    return (
      <div
        key={visa._id || visa.id}
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected 
            ? 'border-purple-500 bg-purple-50 shadow-md' 
            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }`}
        onClick={() => toggleSelection(visa._id || visa.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">
                {visa.typeVisa || 'Visa'} {visa.pays && `- ${visa.pays}`}
              </h3>
              {isSelected && <Check className="w-5 h-5 text-purple-600" />}
            </div>

            {visa.clientNom && (
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{visa.clientNom}</span>
              </div>
            )}

            {visa.numeroPasseport && (
              <div className="text-sm text-gray-600 mb-2">
                Passeport: {visa.numeroPasseport}
              </div>
            )}

            {visa.duree && (
              <div className="text-sm text-gray-600 mb-2">
                Durée: {visa.duree}
              </div>
            )}

            {(visa.dateDebut || visa.dateFin) && (
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {visa.dateDebut && formatDate(visa.dateDebut)}
                  {visa.dateDebut && visa.dateFin && ' - '}
                  {visa.dateFin && formatDate(visa.dateFin)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                visa.statut === 'approuve' || visa.statut === 'approuvé' || visa.statut === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : visa.statut === 'delivre' || visa.statut === 'délivré'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {visa.statut || 'En cours'}
              </span>
              
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {(visa.prix || 0).toLocaleString('fr-FR')} DA
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
              <FileText className="w-6 h-6 text-purple-600" />
              <span>Sélectionner des visas</span>
            </h2>
            <p className="text-gray-600 mt-1">
              {visas.length} visa(s) non facturé(s) disponible(s)
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
              placeholder="Rechercher par type, pays, client ou passeport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Chargement des visas...</span>
            </div>
          ) : filteredVisas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Aucun visa trouvé' : 'Aucun visa non facturé'}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Essayez de modifier votre recherche'
                  : 'Tous les visas ont été facturés'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredVisas.map(renderVisaCard)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedVisas.size} visa(s) sélectionné(s)
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
              disabled={selectedVisas.size === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Ajouter {selectedVisas.size > 0 && `(${selectedVisas.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisaSelector; 