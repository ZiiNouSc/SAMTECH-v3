import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { visaAPI, clientsAPI } from "../../services/api";

const NouveauVisaPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    clientId: '',
    paysDestination: '',
    typeVisa: 'touristique',
    dateDepart: '',
    dateRetour: '',
    dureeSejour: '',
    nombrePersonnes: 1,
    prix: '',
    devise: 'DA',
    fraisConsulaire: '',
    fraisService: '',
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
    
    if (!formData.clientId || formData.clientId === '' || !formData.paysDestination || !formData.dateDepart || 
        !formData.dateRetour || !formData.dureeSejour || !formData.prix) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation supplémentaire pour clientId
    if (!formData.clientId.match(/^[0-9a-fA-F]{24}$/)) {
      alert('Veuillez sélectionner un client valide (clientId: ' + formData.clientId + ')');
      return;
    }

    // Préparer les données pour l'API
    const apiData = {
      ...formData,
      dureeSejour: parseInt(formData.dureeSejour) || 0,
      nombrePersonnes: parseInt(formData.nombrePersonnes.toString()) || 1,
      prix: parseFloat(formData.prix) || 0,
      fraisConsulaire: parseFloat(formData.fraisConsulaire) || 0,
      fraisService: parseFloat(formData.fraisService) || 0
    };

    try {
      setLoading(true);
      await visaAPI.create(apiData);
      alert('Demande de visa créée avec succès !');
      navigate('/visa');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/visa')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Nouvelle demande de visa</h1>
            <p className="text-gray-600">Créer une nouvelle demande de visa</p>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow-sm border max-w-4xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Informations de la demande</h2>
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
                Type de visa *
              </label>
              <select
                name="typeVisa"
                value={formData.typeVisa}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option key="touristique" value="touristique">Touristique</option>
                <option key="affaires" value="affaires">Affaires</option>
                <option key="etudiant" value="etudiant">Étudiant</option>
                <option key="travail" value="travail">Travail</option>
                <option key="transit" value="transit">Transit</option>
                <option key="autre" value="autre">Autre</option>
              </select>
            </div>
          </div>

          {/* Informations visa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays de destination *
              </label>
              <input
                type="text"
                name="paysDestination"
                value={formData.paysDestination}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: France, Espagne, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée de séjour (jours) *
              </label>
              <input
                type="number"
                name="dureeSejour"
                value={formData.dureeSejour}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 15"
                min="1"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de départ *
              </label>
              <input
                type="date"
                name="dateDepart"
                value={formData.dateDepart}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de retour *
              </label>
              <input
                type="date"
                name="dateRetour"
                value={formData.dateRetour}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Nombre de personnes et prix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>

          {/* Frais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frais consulaires
              </label>
              <input
                type="number"
                name="fraisConsulaire"
                value={formData.fraisConsulaire}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frais de service
              </label>
              <input
                type="number"
                name="fraisService"
                value={formData.fraisService}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
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
              onClick={() => navigate('/visa')}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Création...' : 'Créer la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NouveauVisaPage; 