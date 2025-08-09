import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plane, User, Calendar, MapPin } from 'lucide-react';
import { billetsAPI } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const BilletDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [billet, setBillet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadBillet();
    }
  }, [id]);

  const loadBillet = async () => {
    try {
      setLoading(true);
      const response = await billetsAPI.getById(id!);
      setBillet(response.data.data);
    } catch (error) {
      console.error('Erreur chargement billet:', error);
      setError('Erreur lors du chargement du billet');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce billet ?')) {
      return;
    }

    try {
      await billetsAPI.delete(id!);
      navigate('/billets');
    } catch (error) {
      console.error('Erreur suppression billet:', error);
      alert('Erreur lors de la suppression du billet');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !billet) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Billet non trouvé'}</p>
        <button 
          onClick={() => navigate('/billets')}
          className="btn-secondary mt-4"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const getUnifiedBilletFields = (billet: any) => {
    return {
      ...billet,
      statut: billet.informations?.statut || billet.statut,
      date_emission: billet.informations?.date_emission || billet.date_emission,
      passager: billet.informations?.nom_passager || billet.passager,
      compagnie: billet.informations?.compagnie_aerienne || billet.compagnie,
      code_compagnie: billet.informations?.code_compagnie || billet.code_compagnie,
      prix_ttc: billet.informations?.prix_ttc || billet.prix_ttc || billet.prix,
      prix_ht: billet.informations?.prix_ht || billet.prix_ht,
      destination: billet.informations?.destination || billet.destination,
      origine: billet.informations?.origine || billet.origine,
      date_depart: billet.informations?.date_depart || billet.date_depart,
      date_retour: billet.informations?.date_retour || billet.date_retour,
      numero_vol: billet.informations?.numero_vol || billet.numero_vol,
      numero_billet: billet.informations?.numero_billet || billet.numero_billet
    };
  };

  const unifiedBillet = getUnifiedBilletFields(billet);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/billets')}
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Détail du billet</h1>
            <p className="text-gray-600">Numéro: {unifiedBillet.numero_billet || unifiedBillet._id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/billets/${id}/modifier`)}
            className="btn-primary"
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </button>
          <button 
            onClick={handleDelete}
            className="btn-danger"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Statut */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Plane className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Statut</h3>
          </div>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
            unifiedBillet.statut === 'Confirmed' ? 'bg-green-100 text-green-800' :
            unifiedBillet.statut === 'Cancelled' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {unifiedBillet.statut || 'Non défini'}
          </div>
        </div>

        {/* Passager */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold">Passager</h3>
          </div>
          <p className="text-gray-700">{unifiedBillet.passager || 'Non défini'}</p>
        </div>

        {/* Compagnie */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Plane className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold">Compagnie</h3>
          </div>
          <p className="text-gray-700">
            {unifiedBillet.compagnie || 'Non définie'}
            {unifiedBillet.code_compagnie && (
              <span className="ml-2 text-sm text-gray-500">
                ({unifiedBillet.code_compagnie})
              </span>
            )}
          </p>
        </div>

        {/* Prix */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-green-600">DA</span>
            <h3 className="font-semibold">Prix TTC</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {unifiedBillet.prix_ttc ? `${unifiedBillet.prix_ttc.toLocaleString()} DA` : 'Non défini'}
          </p>
        </div>

        {/* Date d'émission */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold">Date d'émission</h3>
          </div>
          <p className="text-gray-700">
            {unifiedBillet.date_emission ? 
              new Date(unifiedBillet.date_emission).toLocaleDateString('fr-FR') : 
              'Non définie'
            }
          </p>
        </div>

        {/* Type de vol */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Plane className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold">Type de vol</h3>
          </div>
          <p className="text-gray-700">
            {unifiedBillet.type_vol === 'domestique' ? 'Vol domestique (Algérie → Algérie)' :
             unifiedBillet.type_vol === 'vers_algerie' ? 'Vol vers l\'Algérie' :
             unifiedBillet.type_vol === 'depuis_algerie' ? 'Vol international (depuis Algérie)' :
             unifiedBillet.type_vol === 'etranger' ? 'Vol étranger (hors Algérie)' :
             unifiedBillet.type_vol || 'Non défini'}
          </p>
        </div>
      </div>

      {/* Itinéraire */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Itinéraire</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="font-medium">Origine</span>
            </div>
            <p className="text-gray-700">{unifiedBillet.origine || 'Non définie'}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className="font-medium">Destination</span>
            </div>
            <p className="text-gray-700">{unifiedBillet.destination || 'Non définie'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Date de départ</span>
            </div>
            <p className="text-gray-700">
              {unifiedBillet.date_depart ? 
                new Date(unifiedBillet.date_depart).toLocaleDateString('fr-FR') : 
                'Non définie'
              }
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Date de retour</span>
            </div>
            <p className="text-gray-700">
              {unifiedBillet.date_retour ? 
                new Date(unifiedBillet.date_retour).toLocaleDateString('fr-FR') : 
                'Non définie'
              }
            </p>
          </div>
        </div>

        {unifiedBillet.numero_vol && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">Numéro de vol</span>
            </div>
            <p className="text-gray-700">{unifiedBillet.numero_vol}</p>
          </div>
        )}
      </div>

      {/* Informations détaillées */}
      {billet.informations && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Informations détaillées</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(billet.informations).map(([key, value]) => (
              <div key={key}>
                <span className="text-sm font-medium text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <p className="text-gray-700">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value || 'Non défini')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fournisseur */}
      {billet.fournisseurId && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Fournisseur</h3>
          <p className="text-gray-700">ID: {billet.fournisseurId}</p>
          <button 
            onClick={() => navigate(`/fournisseurs/${billet.fournisseurId}`)}
            className="btn-secondary mt-2"
          >
            Voir le fournisseur
          </button>
        </div>
      )}
    </div>
  );
};

export default BilletDetailPage; 