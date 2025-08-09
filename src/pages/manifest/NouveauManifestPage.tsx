import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, DocumentTextIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { manifestAPI, clientsAPI } from "../../services/api";
import iataCompagnies from '../../assets/iata_compagnies.json';

const NouveauManifestPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [compagnieLogo, setCompagnieLogo] = useState<string | null>(null);
  const [compagnieIataId, setCompagnieIataId] = useState<string | null>(null);
  const [passagers, setPassagers] = useState([
    {
      nom: '',
      prenom: '',
      dateNaissance: '',
      numeroPasseport: '',
      numeroCarteIdentite: '',
      telephone: '',
      email: ''
    }
  ]);
  const [formData, setFormData] = useState({
    numeroManifest: '',
    compagnieTransport: '',
    typeTransport: 'avion',
    destination: '',
    dateDepart: '',
    dateRetour: '',
    nombrePassagers: 1,
    observations: '',
    notes: ''
  });

  useEffect(() => {
    loadClients();
    if (isEditing) {
      loadManifest();
    }
  }, [id]);

  const loadClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      alert('Erreur lors du chargement des clients');
    }
  };

  const loadManifest = async () => {
    try {
      setLoading(true);
      const response = await manifestAPI.getById(id!);
      const manifest = response.data.data;
      
      setFormData({
        numeroManifest: manifest.numeroManifest || '',
        compagnieTransport: manifest.compagnieTransport || '',
        typeTransport: manifest.typeTransport || 'avion',
        destination: manifest.destination || '',
        dateDepart: manifest.dateDepart ? new Date(manifest.dateDepart).toISOString().split('T')[0] : '',
        dateRetour: manifest.dateRetour ? new Date(manifest.dateRetour).toISOString().split('T')[0] : '',
        nombrePassagers: manifest.nombrePassagers || 1,
        observations: manifest.observations || '',
        notes: manifest.notes || ''
      });

      if (manifest.passagers && manifest.passagers.length > 0) {
        setPassagers(manifest.passagers.map((p: any) => ({
          nom: p.nom || '',
          prenom: p.prenom || '',
          dateNaissance: p.dateNaissance ? new Date(p.dateNaissance).toISOString().split('T')[0] : '',
          numeroPasseport: p.numeroPasseport || '',
          numeroCarteIdentite: p.numeroCarteIdentite || '',
          telephone: p.telephone || '',
          email: p.email || ''
        })));
      }
    } catch (error) {
      console.error('Erreur lors du chargement du manifeste:', error);
      alert('Erreur lors du chargement du manifeste');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePassagerChange = (index: number, field: string, value: string) => {
    const newPassagers = [...passagers];
    newPassagers[index] = {
      ...newPassagers[index],
      [field]: value
    };
    setPassagers(newPassagers);
  };

  const addPassager = () => {
    setPassagers([
      ...passagers,
      {
        nom: '',
        prenom: '',
        dateNaissance: '',
        numeroPasseport: '',
        numeroCarteIdentite: '',
        telephone: '',
        email: ''
      }
    ]);
  };

  const removePassager = (index: number) => {
    if (passagers.length > 1) {
      setPassagers(passagers.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numeroManifest || !formData.compagnieTransport || !formData.destination || 
        !formData.dateDepart || !formData.dateRetour) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérifier que tous les passagers ont les informations obligatoires
    const passagersIncomplets = passagers.some(p => !p.nom || !p.prenom || !p.dateNaissance);
    if (passagersIncomplets) {
      alert('Veuillez remplir les informations de tous les passagers');
      return;
    }

    try {
      setLoading(true);
      const manifestData = {
        ...formData,
        nombrePassagers: passagers.length,
        passagers: passagers,
        compagnieLogo: compagnieLogo || undefined,
        compagnieIataId: compagnieIataId || undefined
      };
      
      if (isEditing) {
        await manifestAPI.update(id!, manifestData);
        alert('Manifeste modifié avec succès !');
      } else {
        await manifestAPI.create(manifestData);
        alert('Manifeste créé avec succès !');
      }
      navigate('/manifest');
    } catch (error) {
      console.error('Erreur lors de la création/modification:', error);
      alert(`Erreur lors de la ${isEditing ? 'modification' : 'création'} du manifeste`);
    } finally {
      setLoading(false);
    }
  };

  // Ajout de la fonction de sélection de compagnie
  const handleCompagnieSelect = (compagnie: any) => {
    setFormData(prev => ({ ...prev, compagnieTransport: compagnie.name }));
    setCompagnieLogo(compagnie.logo);
    setCompagnieIataId(compagnie.id);
  };

  // Ajout du composant d'autocomplétion pour les compagnies IATA
  const AutocompleteCompagnie = ({ value, onSelect, compagnies }: { value: string, onSelect: (compagnie: any) => void, compagnies: any[] }) => {
    const [inputValue, setInputValue] = useState(value || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
      setInputValue(value || '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      if (val.length > 1) {
        const lower = val.toLowerCase();
        setSuggestions(
          compagnies.filter(
            c => c.name.toLowerCase().includes(lower) || (c.id && c.id.toLowerCase().includes(lower))
          ).slice(0, 10)
        );
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const handleSelect = (compagnie: any) => {
      setInputValue(compagnie.name);
      setShowSuggestions(false);
      onSelect(compagnie);
    };

    return (
      <div className="relative">
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nom ou code IATA..."
          value={inputValue}
          onChange={handleChange}
          onFocus={() => inputValue.length > 1 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 bg-white border border-gray-200 rounded-md mt-1 w-full max-h-56 overflow-y-auto shadow-lg">
            {suggestions.map((c) => (
              <li
                key={c.id}
                className="px-3 py-2 cursor-pointer hover:bg-blue-100 flex items-center"
                onClick={() => handleSelect(c)}
              >
                {c.logo && <img src={c.logo} alt="logo" className="h-5 w-5 mr-2" />}
                <span className="font-medium">{c.name}</span>
                <span className="ml-2 text-xs text-gray-500">({c.id})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/manifest')}
          className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'Modifier le manifeste' : 'Nouveau manifeste'}</h1>
          <p className="text-gray-600 mt-2">{isEditing ? 'Modifier les informations du manifeste' : 'Créer un nouveau manifeste de voyage'}</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow-sm border max-w-4xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Modifier les informations du manifeste' : 'Informations du manifeste'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de manifeste *
              </label>
              <input
                type="text"
                name="numeroManifest"
                value={formData.numeroManifest}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: MAN-2024-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compagnie de transport *
              </label>
              <AutocompleteCompagnie
                value={formData.compagnieTransport}
                onSelect={handleCompagnieSelect}
                compagnies={iataCompagnies}
              />
              {compagnieLogo && (
                <img src={compagnieLogo} alt="Logo compagnie" className="h-8 mt-2" />
              )}
            </div>
          </div>

          {/* Type de transport et destination */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de transport *
              </label>
              <select
                name="typeTransport"
                value={formData.typeTransport}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="avion">Avion</option>
                <option value="bateau">Bateau</option>
                <option value="bus">Bus</option>
                <option value="train">Train</option>
              </select>
            </div>

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
                Nombre de passagers
              </label>
              <input
                type="number"
                name="nombrePassagers"
                value={formData.nombrePassagers}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                disabled
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

          {/* Passagers */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Passagers</h3>
              <button
                type="button"
                onClick={addPassager}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Ajouter un passager
              </button>
            </div>

            <div className="space-y-4">
              {passagers.map((passager, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Passager {index + 1}</h4>
                    {passagers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePassager(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={passager.nom}
                        onChange={(e) => handlePassagerChange(index, 'nom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        value={passager.prenom}
                        onChange={(e) => handlePassagerChange(index, 'prenom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de naissance *
                      </label>
                      <input
                        type="date"
                        value={passager.dateNaissance}
                        onChange={(e) => handlePassagerChange(index, 'dateNaissance', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de passeport
                      </label>
                      <input
                        type="text"
                        value={passager.numeroPasseport}
                        onChange={(e) => handlePassagerChange(index, 'numeroPasseport', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de carte d'identité
                      </label>
                      <input
                        type="text"
                        value={passager.numeroCarteIdentite}
                        onChange={(e) => handlePassagerChange(index, 'numeroCarteIdentite', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={passager.telephone}
                        onChange={(e) => handlePassagerChange(index, 'telephone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={passager.email}
                        onChange={(e) => handlePassagerChange(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Observations et notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observations
              </label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observations sur le manifeste..."
              />
            </div>

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
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/manifest')}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (isEditing ? 'Modification...' : 'Création...') : (isEditing ? 'Modifier le manifeste' : 'Créer le manifeste')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NouveauManifestPage; 