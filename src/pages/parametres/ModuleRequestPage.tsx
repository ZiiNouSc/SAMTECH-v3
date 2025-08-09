import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  CheckSquare,
  Package,
  FileText,
  Users,
  CreditCard,
  Wallet,
  Plane,
  Calendar,
  MessageSquare,
  FolderOpen,
  Clock,
  Store,
  Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { moduleRequestsAPI } from '../../services/api';

interface ModuleRequest {
  id: string;
  modules: string[];
  message: string;
  statut: 'en_attente' | 'approuve' | 'rejete';
  dateCreation: string;
  dateTraitement?: string;
  commentaireAdmin?: string;
}

const ModuleRequestPage: React.FC = () => {
  const { user, currentAgence } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ModuleRequest[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableModules = [
    { id: 'clients', name: 'Clients', description: 'Gestion des clients', icon: Users },
    { id: 'fournisseurs', name: 'Fournisseurs', description: 'Gestion des fournisseurs', icon: Users },
    { id: 'pre-factures', name: 'Devis', description: 'Gestion des devis clients', icon: FileText },
    { id: 'caisse', name: 'Caisse', description: 'Gestion de caisse', icon: Wallet },
    { id: 'creances', name: 'Créances', description: 'Suivi des impayés', icon: CreditCard },
    { id: 'packages', name: 'Packages', description: 'Création de packages', icon: Package },
    { id: 'billets', name: 'Billets d\'avion', description: 'Gestion des billets', icon: Plane },
    { id: 'vitrine', name: 'Vitrine', description: 'Vitrine publique', icon: Store },
    { id: 'documents', name: 'Documents', description: 'Gestion des documents', icon: FolderOpen },
    { id: 'todos', name: 'Tâches', description: 'Gestion des tâches', icon: CheckSquare },
    { id: 'calendrier', name: 'Calendrier', description: 'Gestion du calendrier', icon: Calendar },
    { id: 'crm', name: 'CRM', description: 'Gestion des contacts', icon: MessageSquare },
    { id: 'reservations', name: 'Réservations', description: 'Gestion des réservations', icon: Clock }
  ];

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await moduleRequestsAPI.getAgencyRequests();
      
      if (response.data.success) {
        setRequests(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load module requests');
      }
    } catch (error) {
      console.error('Error loading module requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => {
      if (prev.includes(moduleId)) {
        return (Array.isArray(prev) ? prev : []).filter(id => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  const handleSubmit = async () => {
    if ((Array.isArray(selectedModules) ? selectedModules : []).length === 0 || !message.trim()) {
      alert('Veuillez sélectionner au moins un module et saisir un message');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await moduleRequestsAPI.create({
        modules: selectedModules,
        message
      });
      
      if (response.data.success) {
        alert('Demande de modules envoyée avec succès');
        setSelectedModules([]);
        setMessage('');
        fetchRequests();
      } else {
        throw new Error(response.data.message || 'Failed to submit module request');
      }
    } catch (error) {
      console.error('Error submitting module request:', error);
      alert('Une erreur est survenue lors de l\'envoi de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'approuve':
        return <Badge variant="success">Approuvée</Badge>;
      case 'rejete':
        return <Badge variant="danger">Rejetée</Badge>;
      default:
        return <Badge variant="warning">En attente</Badge>;
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Demande de Modules</h1>
          <p className="text-gray-600">Demandez l'activation de nouveaux modules pour votre agence</p>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* New request form */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Demander de nouveaux modules</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sélectionnez les modules à demander
            </label>
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  const allSelectable = availableModules
                    .filter(module => {
                      const isActive = currentAgence?.modulesActifs?.includes(module.id);
                      const isPending = currentAgence?.modulesDemandes?.includes(module.id);
                      return !isActive && !isPending;
                    })
                    .map(module => module.id);
                  setSelectedModules(allSelectable);
                }}
              >
                Tout cocher
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableModules.map(module => {
                const isActive = currentAgence?.modulesActifs?.includes(module.id);
                const isPending = currentAgence?.modulesDemandes?.includes(module.id);
                const isDisabled = isActive || isPending;
                const Icon = module.icon;
                return (
                  <button
                    key={module.id}
                    type="button"
                    className={`flex items-center p-3 border rounded-lg w-full transition
                      ${selectedModules.includes(module.id) ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200'}
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 hover:border-blue-300'}`}
                    onClick={() => !isDisabled && handleModuleToggle(module.id)}
                    disabled={isDisabled}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : isPending ? 'text-green-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">
                      {module.name}
                      {isActive && <span key={`${module.id}-active`} className="ml-2 text-xs text-blue-600">(actif)</span>}
                      {isPending && <span key={`${module.id}-pending`} className="ml-2 text-xs text-green-600">(en attente)</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message pour l'administrateur
            </label>
            <textarea
              id="message"
              rows={4}
              className="input-field"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Expliquez pourquoi vous avez besoin de ces modules et comment vous comptez les utiliser..."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={(Array.isArray(selectedModules) ? selectedModules : []).length === 0 || !message.trim() || submitting}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Envoyer la demande
            </button>
          </div>
        </div>
      </Card>

      {/* Previous requests */}
      {(Array.isArray(requests) ? requests : []).length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des demandes</h2>
          
          <div className="space-y-4">
            {(Array.isArray(requests) ? requests : []).map((request, requestIndex) => (
              <div key={request.id || `request-${requestIndex}`} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {getStatusBadge(request.statut)}
                    </div>
                    <p className="font-medium text-gray-900">
                      Demande du {new Date(request.dateCreation).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {request.dateTraitement && (
                    <p className="text-sm text-gray-500">
                      Traitée le {new Date(request.dateTraitement).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Modules demandés:</p>
                  <div className="flex flex-wrap gap-2">
                    {(request.modules || []).map((moduleId, index) => {
                      const module = availableModules.find(m => m.id === moduleId);
                      return (
                        <Badge key={`${request.id || requestIndex}-${moduleId}-${index}`} variant="info">
                          {module ? module.name : moduleId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Votre message:</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{request.message}</p>
                </div>
                
                {request.commentaireAdmin && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Réponse de l'administrateur:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{request.commentaireAdmin}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ModuleRequestPage;