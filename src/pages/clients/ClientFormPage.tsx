import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Users, Building2 } from 'lucide-react';
import { Client } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { clientsAPI } from '../../services/api';

const ClientFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    entreprise: '',
    typeClient: 'particulier' as 'particulier' | 'entreprise' | 'partenaire',
    email: '',
    telephone: '',
    adresse: '',
    codePostal: '',
    ville: '',
    pays: 'Algérie',
    statut: 'actif' as 'actif' | 'inactif' | 'suspendu',
    notes: ''
  });

  const typeClientOptions = [
    { value: 'particulier', label: 'Particulier', icon: Users, description: 'Client individuel' },
    { value: 'entreprise', label: 'Entreprise', icon: Building2, description: 'Société ou organisation' },
    { value: 'partenaire', label: 'Partenaire', icon: Building2, description: 'Agence de voyage' }
  ];

  const statutOptions = [
    { value: 'actif', label: 'Actif' },
    { value: 'inactif', label: 'Inactif' },
    { value: 'suspendu', label: 'Suspendu' }
  ];

  useEffect(() => {
    if (isEditing && id) {
      const fetchClient = async () => {
        setLoading(true);
        try {
          const response = await clientsAPI.getById(id);
          const client = response.data.data;
          
          setFormData({
            nom: client.nom,
            prenom: client.prenom || '',
            entreprise: client.entreprise || '',
            typeClient: client.typeClient || 'particulier',
            email: client.email,
            telephone: client.telephone,
            adresse: client.adresse,
            codePostal: client.codePostal || '',
            ville: client.ville || '',
            pays: client.pays || 'Algérie',
            statut: client.statut || 'actif',
            notes: client.notes || ''
          });
        } catch (error) {
          console.error('Erreur lors du chargement du client:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchClient();
    }
  }, [isEditing, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing && id) {
        await clientsAPI.update(id, formData);
      } else {
        await clientsAPI.create(formData);
      }
      navigate('/clients');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Modifier le client' : 'Nouveau client'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Modifier les informations du client' : 'Ajouter un nouveau client'}
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type de client */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Type de client
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {typeClientOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.value}
                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    formData.typeClient === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, typeClient: option.value as any }))}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      formData.typeClient === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{option.label}</h3>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="typeClient"
                    value={option.value}
                    checked={formData.typeClient === option.value}
                    onChange={handleChange}
                    className="absolute top-4 right-4"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Informations générales */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informations générales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.typeClient !== 'particulier' && (
              <div className="md:col-span-2">
                <label htmlFor="entreprise" className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.typeClient === 'entreprise' ? 'Nom de l\'entreprise *' : 'Nom du partenaire *'}
                </label>
                <input
                  type="text"
                  id="entreprise"
                  name="entreprise"
                  value={formData.entreprise}
                  onChange={handleChange}
                  required={formData.typeClient === 'entreprise' || formData.typeClient === 'partenaire'}
                  className="input-field"
                  placeholder={formData.typeClient === 'entreprise' ? 'Nom de l\'entreprise' : 'Nom du partenaire'}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.typeClient === 'particulier' ? 'Nom *' : 'Nom du contact *'}
              </label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="input-field"
                placeholder={formData.typeClient === 'particulier' ? 'Nom du client' : 'Nom du contact'}
              />
            </div>
            
            <div>
              <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.typeClient === 'particulier' ? 'Prénom' : 'Prénom du contact'}
              </label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                className="input-field"
                placeholder={formData.typeClient === 'particulier' ? 'Prénom du client' : 'Prénom du contact'}
              />
            </div>

            <div>
              <label htmlFor="statut" className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                id="statut"
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="input-field"
              >
                {statutOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Informations de contact */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informations de contact
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="email@exemple.com"
              />
            </div>
            
            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="+213 XXX XX XX XX"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <textarea
              id="adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Adresse complète du client"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <label htmlFor="codePostal" className="block text-sm font-medium text-gray-700 mb-1">
                Code Postal
              </label>
              <input
                type="text"
                id="codePostal"
                name="codePostal"
                value={formData.codePostal}
                onChange={handleChange}
                className="input-field"
                placeholder="16000"
              />
            </div>
            
            <div>
              <label htmlFor="ville" className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <input
                type="text"
                id="ville"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                className="input-field"
                placeholder="Alger"
              />
            </div>

            <div>
              <label htmlFor="pays" className="block text-sm font-medium text-gray-700 mb-1">
                Pays
              </label>
              <input
                type="text"
                id="pays"
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                className="input-field"
                placeholder="Algérie"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Notes supplémentaires
          </h2>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder="Notes ou commentaires sur le client..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center"
          >
            {saving ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientFormPage;