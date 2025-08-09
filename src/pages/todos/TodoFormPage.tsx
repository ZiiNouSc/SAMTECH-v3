import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, User, Bell, CheckSquare } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { todosAPI, clientsAPI } from '../../services/api';

interface TodoFormData {
  titre: string;
  description: string;
  clientId: string;
  clientNom: string;
  dateEcheance: string;
  priorite: 'faible' | 'normale' | 'haute' | 'urgente';
  type: 'rappel' | 'tache' | 'suivi';
  assigneA: string;
  recurrence: 'aucune' | 'quotidienne' | 'hebdomadaire' | 'mensuelle';
}

const TodoFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<TodoFormData>({
    titre: '',
    description: '',
    clientId: '',
    clientNom: '',
    dateEcheance: '',
    priorite: 'normale',
    type: 'tache',
    assigneA: '',
    recurrence: 'aucune'
  });

  useEffect(() => {
    fetchClients();
    if (user?.role === 'agence') {
      fetchAgents();
    }
    if (isEditing && id) {
      fetchTodo();
    }
  }, [isEditing, id, user]);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      // In a real app, this would be an API call to get agents
      // For now, we'll use mock data
      setAgents([
        { id: '1', nom: 'Martin', prenom: 'Sophie' },
        { id: '2', nom: 'Dubois', prenom: 'Jean' },
        { id: '3', nom: 'Leroy', prenom: 'Marie' }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
    }
  };

  const fetchTodo = async () => {
    setLoading(true);
    try {
      const response = await todosAPI.getById(id!);
      const todo = response.data.data;
      
      setFormData({
        titre: todo.titre,
        description: todo.description || '',
        clientId: todo.clientId || '',
        clientNom: todo.clientNom || '',
        dateEcheance: new Date(todo.dateEcheance).toISOString().slice(0, 16),
        priorite: todo.priorite,
        type: todo.type,
        assigneA: todo.assigneA || '',
        recurrence: 'aucune'
      });
    } catch (error) {
      console.error('Erreur lors du chargement de la tâche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing && id) {
        await todosAPI.update(id, {
          titre: formData.titre,
          description: formData.description,
          clientId: formData.clientId || undefined,
          dateEcheance: new Date(formData.dateEcheance).toISOString(),
          priorite: formData.priorite,
          type: formData.type,
          assigneA: formData.assigneA || undefined
        });
      } else {
        await todosAPI.create({
          titre: formData.titre,
          description: formData.description,
          clientId: formData.clientId || undefined,
          dateEcheance: new Date(formData.dateEcheance).toISOString(),
          priorite: formData.priorite,
          type: formData.type,
          assigneA: formData.assigneA || undefined
        });
      }
      navigate('/todos');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof TodoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c._id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientId,
        clientNom: client.entreprise || `${client.prenom} ${client.nom}`
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        clientId: '',
        clientNom: ''
      }));
    }
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
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/todos')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              {isEditing ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Modifier les informations de la tâche' : 'Créer une nouvelle tâche ou rappel'}
            </p>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informations générales
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
              </label>
              <input
                type="text"
                id="titre"
                value={formData.titre}
                onChange={(e) => handleChange('titre', e.target.value)}
                required
                className="input-field"
                placeholder="Titre de la tâche ou du rappel"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="input-field"
                placeholder="Description détaillée de la tâche"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="input-field"
                >
                  <option value="tache">
                    Tâche
                  </option>
                  <option value="rappel">
                    Rappel
                  </option>
                  <option value="suivi">
                    Suivi client
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="priorite" className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité *
                </label>
                <select
                  id="priorite"
                  value={formData.priorite}
                  onChange={(e) => handleChange('priorite', e.target.value)}
                  className="input-field"
                >
                  <option value="faible">Faible</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Planification
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="dateEcheance" className="block text-sm font-medium text-gray-700 mb-1">
                Date et heure d'échéance *
              </label>
              <input
                type="datetime-local"
                id="dateEcheance"
                value={formData.dateEcheance}
                onChange={(e) => handleChange('dateEcheance', e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700 mb-1">
                Récurrence
              </label>
              <select
                id="recurrence"
                value={formData.recurrence}
                onChange={(e) => handleChange('recurrence', e.target.value)}
                className="input-field"
              >
                <option value="aucune">Aucune</option>
                <option value="quotidienne">Quotidienne</option>
                <option value="hebdomadaire">Hebdomadaire</option>
                <option value="mensuelle">Mensuelle</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Attribution et client
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                Client concerné
              </label>
              <select
                id="clientId"
                value={formData.clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="input-field"
              >
                <option value="">Aucun client spécifique</option>
                {(Array.isArray(clients) ? clients : []).map((client, index) => (
                  <option key={client._id} value={client._id}>
                    {client.entreprise || `${client.prenom} ${client.nom}`}
                  </option>
                ))}
              </select>
            </div>

            {user?.role === 'agence' && (
              <div>
                <label htmlFor="assigneA" className="block text-sm font-medium text-gray-700 mb-1">
                  Assigné à
                </label>
                <select
                  id="assigneA"
                  value={formData.assigneA}
                  onChange={(e) => handleChange('assigneA', e.target.value)}
                  className="input-field"
                >
                  <option value="">Moi-même</option>
                  {(Array.isArray(agents) ? agents : []).map((agent, index) => (
                    <option key={agent.id} value={`${agent.prenom} ${agent.nom}`}>
                      {agent.prenom} {agent.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Notifications - COMMENTÉ TEMPORAIREMENT */}
        {/* <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Notifications
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notificationEmail"
                checked={formData.notificationEmail}
                onChange={(e) => handleChange('notificationEmail', e.target.checked)}
                className="mr-3"
              />
              <label htmlFor="notificationEmail" className="text-sm font-medium text-gray-700">
                Notification par email
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="notificationSMS"
                checked={formData.notificationSMS}
                onChange={(e) => handleChange('notificationSMS', e.target.checked)}
                className="mr-3"
              />
              <label htmlFor="notificationSMS" className="text-sm font-medium text-gray-700">
                Notification par SMS
              </label>
            </div>
          </div>
        </div> */}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/todos')}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving || !formData.titre || !formData.dateEcheance}
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

export default TodoFormPage;