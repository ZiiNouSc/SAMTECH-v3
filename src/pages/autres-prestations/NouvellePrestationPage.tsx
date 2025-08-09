import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, StarIcon } from "@heroicons/react/24/outline";
import { autresPrestationsAPI, clientsAPI } from "../../services/api";

const NouvellePrestationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    clientId: '',
    typePrestation: 'excursion',
    titre: '',
    description: '',
    destination: '',
    dateDebut: '',
    dateFin: '',
    nombrePersonnes: 1,
    prix: '',
    devise: 'DA',
    fournisseur: '',
    notes: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      console.log('Clients chargés:', response.data.data);
      console.log('Nombre de clients:', response.data.data.length);
      setClients(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      alert('Erreur lors du chargement des clients');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Debug pour clientId
    if (name === 'clientId') {
      console.log('handleInputChange - clientId:', value);
      console.log('handleInputChange - clientId type:', typeof value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('FormData clientId:', formData.clientId);
    console.log('FormData clientId type:', typeof formData.clientId);
    console.log('FormData clientId length:', formData.clientId?.length);
    
    if (!formData.clientId || formData.clientId === '' || !formData.titre || !formData.description || 
        !formData.destination || !formData.dateDebut || !formData.prix) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation supplémentaire pour clientId
    if (!formData.clientId.match(/^[0-9a-fA-F]{24}$/)) {
      alert('Veuillez sélectionner un client valide (clientId: ' + formData.clientId + ')');
      return;
    }

    try {
      setLoading(true);
      await autresPrestationsAPI.create(formData);
      alert('Prestation créée avec succès !');
      navigate('/autres-prestations');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de la prestation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/autres-prestations')}
          className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle prestation</h1>
          <p className="text-gray-600 mt-2">Créer une nouvelle prestation supplémentaire</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow-sm border max-w-4xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <StarIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Informations de la prestation</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option key="default" value="">Sélectionner un client</option>
                {clients.map((client: any) => (
                  <option key={client._id} value={client._id}>
                    {client.nom} {client.prenom} - {client.email}
                  </option>
                ))}
              </select>
              {clients.length === 0 && (
                <p className="mt-1 text-sm text-orange-600">Aucun client disponible</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de prestation *
              </label>
              <select
                name="typePrestation"
                value={formData.typePrestation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option key="excursion" value="excursion">Excursion</option>
                <option key="guide" value="guide">Guide</option>
                <option key="transfert" value="transfert">Transfert</option>
                <option key="location_voiture" value="location_voiture">Location de voiture</option>
                <option key="restaurant" value="restaurant">Restaurant</option>
                <option key="spectacle" value="spectacle">Spectacle</option>
                <option key="autre" value="autre">Autre</option>
              </select>
            </div>
          </div>

          {/* Titre et description */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de la prestation *
              </label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Visite guidée de Paris"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description détaillée de la prestation..."
                required
              />
            </div>
          </div>

          {/* Destination et dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination *
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Paris, France"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début *
              </label>
              <input
                type="date"
                name="dateDebut"
                value={formData.dateDebut}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                name="dateFin"
                value={formData.dateFin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Nombre de personnes et prix */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de personnes
              </label>
              <input
                type="number"
                name="nombrePersonnes"
                value={formData.nombrePersonnes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix *
              </label>
              <input
                type="number"
                name="prix"
                value={formData.prix}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Devise
              </label>
              <select
                name="devise"
                value={formData.devise}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option key="DA" value="DA">DA</option>
                <option key="EUR" value="EUR">EUR</option>
                <option key="USD" value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fournisseur
              </label>
              <input
                type="text"
                name="fournisseur"
                value={formData.fournisseur}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom du fournisseur"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes supplémentaires..."
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/autres-prestations')}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Création...' : 'Créer la prestation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NouvellePrestationPage; 