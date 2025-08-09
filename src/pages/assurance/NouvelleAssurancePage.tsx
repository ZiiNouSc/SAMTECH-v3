import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { assuranceAPI, clientsAPI } from "../../services/api";

const NouvelleAssurancePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    clientId: '',
    compagnieAssurance: '',
    typeAssurance: 'voyage',
    paysDestination: '',
    dateDepart: '',
    dateRetour: '',
    nombrePersonnes: 1,
    montantAssure: '',
    prime: '',
    devise: 'DA',
    conditions: '',
    exclusions: '',
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
    
    if (!formData.clientId || formData.clientId === '' || !formData.compagnieAssurance || !formData.paysDestination || 
        !formData.dateDepart || !formData.dateRetour || !formData.montantAssure || !formData.prime) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation supplémentaire pour clientId
    if (!formData.clientId.match(/^[0-9a-fA-F]{24}$/)) {
      alert('Veuillez sélectionner un client valide');
      return;
    }

    try {
      setLoading(true);
      await assuranceAPI.create(formData);
      alert('Assurance créée avec succès !');
      navigate('/assurance');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de l\'assurance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/assurance')}
          className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle assurance</h1>
          <p className="text-gray-600 mt-2">Créer une nouvelle assurance voyage</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow-sm border max-w-4xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Informations de l'assurance</h2>
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
                Compagnie d'assurance *
              </label>
              <input
                type="text"
                name="compagnieAssurance"
                value={formData.compagnieAssurance}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: AXA, Allianz, etc."
                required
              />
            </div>
          </div>

          {/* Type et destination */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'assurance *
              </label>
              <select
                name="typeAssurance"
                value={formData.typeAssurance}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option key="voyage" value="voyage">Voyage</option>
                <option key="medicale" value="medicale">Médicale</option>
                <option key="annulation" value="annulation">Annulation</option>
                <option key="bagages" value="bagages">Bagages</option>
                <option key="responsabilite_civile" value="responsabilite_civile">Responsabilité civile</option>
                <option key="comprehensive" value="comprehensive">Comprehensive</option>
              </select>
            </div>

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

          {/* Montants */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant assuré *
              </label>
              <input
                type="number"
                name="montantAssure"
                value={formData.montantAssure}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prime *
              </label>
              <input
                type="number"
                name="prime"
                value={formData.prime}
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

          {/* Conditions et exclusions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conditions
              </label>
              <textarea
                name="conditions"
                value={formData.conditions}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Conditions de l'assurance..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exclusions
              </label>
              <textarea
                name="exclusions"
                value={formData.exclusions}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Exclusions de l'assurance..."
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
              onClick={() => navigate('/assurance')}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Création...' : 'Créer l\'assurance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NouvelleAssurancePage; 