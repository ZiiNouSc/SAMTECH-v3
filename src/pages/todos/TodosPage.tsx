import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  CheckSquare,
  Square,
  Calendar,
  User,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  Bell,
  Link as LinkIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ViewToggle from '../../components/ui/ViewToggle';
import GridView from '../../components/ui/GridView';
import ListView from '../../components/ui/ListView';
import Card from '../../components/ui/Card';
import SearchFilter from '../../components/ui/SearchFilter';
import StatCard from '../../components/ui/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { todosAPI, clientsAPI } from '../../services/api';

const TodosPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todos, setTodos] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'table' | 'grid' | 'list'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [priorityFilter, setPriorityFilter] = useState<string>('tous');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    clientId: '',
    dateEcheance: '',
    priorite: 'normale' as const,
    type: 'tache' as const,
    assigneA: ''
  });

  const filterOptions = [
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'en_attente', label: 'En attente' },
        { value: 'en_cours', label: 'En cours' },
        { value: 'termine', label: 'Terminé' }
      ]
    },
    {
      id: 'priorite',
      label: 'Priorité',
      options: [
        { value: 'faible', label: 'Faible' },
        { value: 'normale', label: 'Normale' },
        { value: 'haute', label: 'Haute' },
        { value: 'urgente', label: 'Urgente' }
      ]
    },
    {
      id: 'type',
      label: 'Type',
      options: [
        { value: 'tache', label: 'Tâche' },
        { value: 'rappel', label: 'Rappel' },
        { value: 'suivi', label: 'Suivi client' }
      ]
    }
  ];

  useEffect(() => {
    fetchTodos();
    fetchClients();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await todosAPI.getAll();
      setTodos(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!formData.titre || !formData.dateEcheance) return;

    try {
      setActionLoading(true);
      const response = await todosAPI.create({
        titre: formData.titre,
        description: formData.description,
        clientId: formData.clientId || undefined,
        dateEcheance: new Date(formData.dateEcheance).toISOString(),
        priorite: formData.priorite,
        type: formData.type,
        assigneA: formData.assigneA || undefined
      });

      setTodos(prev => [response.data.data, ...prev]);
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout:', error);
      alert('Erreur lors de l\'ajout: ' + (error.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (todoId: string) => {
    if (!todoId) {
      console.error('Todo ID is undefined');
      return;
    }
    
    try {
      setActionLoading(true);
      await todosAPI.toggleStatus(todoId);
      
      // Update local state
      setTodos(prev => (Array.isArray(prev) ? prev : []).map(todo => {
        if (todo.id === todoId) {
          // Cycle through statuses: en_attente -> en_cours -> termine -> en_attente
          const currentStatus = todo.statut;
          let newStatus;
          
          if (currentStatus === 'en_attente') {
            newStatus = 'en_cours';
          } else if (currentStatus === 'en_cours') {
            newStatus = 'termine';
          } else {
            newStatus = 'en_attente';
          }
          
          return { ...todo, statut: newStatus };
        }
        return todo;
      }));
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour: ' + (error.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTodo = async () => {
    if (!selectedTodo || !selectedTodo.id) return;

    try {
      setActionLoading(true);
      await todosAPI.delete(selectedTodo.id);
      setTodos(prev => (Array.isArray(prev) ? prev : []).filter(todo => todo.id !== selectedTodo.id));
      setShowDeleteModal(false);
      setSelectedTodo(null);
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression: ' + (error.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      clientId: '',
      dateEcheance: '',
      priorite: 'normale',
      type: 'tache',
      assigneA: ''
    });
  };

  const openEditModal = (todo: any) => {
    setSelectedTodo(todo);
    setFormData({
      titre: todo.titre,
      description: todo.description || '',
      clientId: todo.clientId || '',
      dateEcheance: new Date(todo.dateEcheance).toISOString().slice(0, 16),
      priorite: todo.priorite,
      type: todo.type,
      assigneA: todo.assigneA || ''
    });
    setShowEditModal(true);
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const filteredTodos = (Array.isArray(todos) ? todos : []).filter(todo => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = todo.titre.toLowerCase().includes(searchLower) ||
                         todo.description?.toLowerCase().includes(searchLower) ||
                         (todo.clientNom && todo.clientNom.toLowerCase().includes(searchLower));
    
    const statutFilter = activeFilters.statut;
    const prioriteFilter = activeFilters.priorite;
    const typeFilter = activeFilters.type;

    const matchesStatut = !statutFilter || statutFilter === 'tous' || todo.statut === statutFilter;
    const matchesPriorite = !prioriteFilter || prioriteFilter === 'tous' || todo.priorite === prioriteFilter;
    const matchesType = !typeFilter || typeFilter === 'tous' || todo.type === typeFilter;

    return matchesSearch && matchesStatut && matchesPriorite && matchesType;
  });

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'urgente': return 'danger';
      case 'haute': return 'warning';
      case 'normale': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'termine': return 'success';
      case 'en_cours': return 'info';
      default: return 'warning';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rappel': return <Bell className="w-4 h-4" />;
      case 'suivi': return <User className="w-4 h-4" />;
      default: return <CheckSquare className="w-4 h-4" />;
    }
  };

  const isOverdue = (dateEcheance: string) => {
    return new Date(dateEcheance) < new Date() && todos.find(t => t.dateEcheance === dateEcheance)?.statut !== 'termine';
  };

  const renderTodoCard = (todo: any) => (
    <Card key={todo.id} hover className="h-full">
      <div className="flex items-start space-x-3">
        <button
          onClick={() => todo.id && handleToggleStatus(todo.id)}
          disabled={actionLoading}
          className="mt-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {todo.statut === 'termine' ? (
            <CheckSquare className="w-5 h-5 text-green-600" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {getTypeIcon(todo.type)}
            <p className={`font-medium ${todo.statut === 'termine' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {todo.titre}
            </p>
            {isOverdue(todo.dateEcheance) && (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{todo.description}</p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant={getPriorityColor(todo.priorite)} size="sm">
              {(typeof todo.priorite === 'string' && todo.priorite.length > 0) 
                ? todo.priorite.charAt(0).toUpperCase() + todo.priorite.slice(1)
                : 'Normal'}
            </Badge>
            <Badge variant={getStatusColor(todo.statut)} size="sm">
              {todo.statut === 'en_attente' ? 'En attente' :
               todo.statut === 'en_cours' ? 'En cours' : 'Terminé'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2 mt-3 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className={isOverdue(todo.dateEcheance) ? 'text-red-600 font-medium' : ''}>
              {new Date(todo.dateEcheance).toLocaleDateString('fr-FR')}
            </span>
          </div>
          
          {todo.clientNom && (
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <User className="w-4 h-4 text-gray-400 mr-2" />
              <span>{todo.clientNom}</span>
            </div>
          )}
          
          {todo.assigneA && (
            <div className="mt-2 text-xs text-blue-600">
              Assigné à: {todo.assigneA}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
        {todo.id && (
          <>
            <button
              onClick={() => openEditModal(todo)}
              disabled={actionLoading}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedTodo(todo);
                setShowDeleteModal(true);
              }}
              disabled={actionLoading}
              className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </Card>
  );

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
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Tâches & Rappels</h1>
          <p className="text-gray-600">Gérer vos tâches et rappels clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/todos/nouveau" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle Tâche
          </Link>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total tâches"
          value={(Array.isArray(todos) ? todos : []).length}
          icon={CheckSquare}
          color="blue"
        />
        <StatCard
          title="En attente"
          value={(Array.isArray(todos) ? todos : []).filter(t => t.statut === 'en_attente').length}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Terminées"
          value={(Array.isArray(todos) ? todos : []).filter(t => t.statut === 'termine').length}
          icon={CheckSquare}
          color="green"
        />
        <StatCard
          title="En retard"
          value={(Array.isArray(todos) ? todos : []).filter(t => isOverdue(t.dateEcheance)).length}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Filtres et recherche */}
      <SearchFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        placeholder="Rechercher une tâche..."
      />

      {/* Contrôles de vue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {(Array.isArray(filteredTodos) ? filteredTodos : []).length} tâche{(Array.isArray(filteredTodos) ? filteredTodos : []).length > 1 ? 's' : ''} trouvée{(Array.isArray(filteredTodos) ? filteredTodos : []).length > 1 ? 's' : ''}
          </span>
        </div>
        <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Liste des tâches */}
      {currentView === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Tâche</TableHeaderCell>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Échéance</TableHeaderCell>
                <TableHeaderCell>Priorité</TableHeaderCell>
                <TableHeaderCell>Statut</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(filteredTodos) ? filteredTodos : []).map((todo, index) => (
                <TableRow key={todo.id || `todo-${index}`} className={isOverdue(todo.dateEcheance) ? 'bg-red-50' : ''}>
                  <TableCell>
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => todo.id && handleToggleStatus(todo.id)}
                        disabled={actionLoading}
                        className="mt-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {todo.statut === 'termine' ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(todo.type)}
                          <p className={`font-medium ${todo.statut === 'termine' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {todo.titre}
                          </p>
                          {isOverdue(todo.dateEcheance) && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{todo.description}</p>
                        {todo.assigneA && (
                          <p className="text-xs text-blue-600 mt-1">Assigné à: {todo.assigneA}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {todo.clientNom ? (
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{todo.clientNom}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className={`text-sm ${isOverdue(todo.dateEcheance) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {new Date(todo.dateEcheance).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(todo.dateEcheance).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(todo.priorite)} size="sm">
                      {(typeof todo.priorite === 'string' && todo.priorite.length > 0) 
                        ? todo.priorite.charAt(0).toUpperCase() + todo.priorite.slice(1)
                        : 'Normal'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(todo.statut)} size="sm">
                      {todo.statut === 'en_attente' ? 'En attente' :
                       todo.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {todo.id && (
                        <>
                          <button
                            onClick={() => openEditModal(todo)}
                            disabled={actionLoading}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTodo(todo);
                              setShowDeleteModal(true);
                            }}
                            disabled={actionLoading}
                            className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(Array.isArray(filteredTodos) ? filteredTodos : []).length === 0 && (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune tâche trouvée</p>
            </div>
          )}
        </Card>
      )}

      {currentView === 'grid' && (
        <GridView columns={3}>
          {(Array.isArray(filteredTodos) ? filteredTodos : []).map(renderTodoCard)}
        </GridView>
      )}

      {currentView === 'list' && (
        <ListView>
          {(Array.isArray(filteredTodos) ? filteredTodos : []).map((todo, index) => (
            <Card key={todo.id} padding="sm" className="hover:bg-gray-50 transition-colors">
              <div key={index} className="flex items-center">
                <button
                  onClick={() => todo.id && handleToggleStatus(todo.id)}
                  disabled={actionLoading}
                  className="mr-3 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {todo.statut === 'termine' ? (
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(todo.type)}
                    <p className={`font-medium ${todo.statut === 'termine' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {todo.titre}
                    </p>
                    {isOverdue(todo.dateEcheance) && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <Badge variant={getPriorityColor(todo.priorite)} size="sm">
                      {(typeof todo.priorite === 'string' && todo.priorite.length > 0) 
                        ? todo.priorite.charAt(0).toUpperCase() + todo.priorite.slice(1)
                        : 'Normal'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center mt-1 space-x-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span className={isOverdue(todo.dateEcheance) ? 'text-red-600 font-medium' : ''}>
                        {new Date(todo.dateEcheance).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    {todo.clientNom && (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-3 h-3 mr-1" />
                        {todo.clientNom}
                      </div>
                    )}
                    
                    {todo.assigneA && (
                      <div className="text-xs text-blue-600">
                        Assigné à: {todo.assigneA}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(todo.statut)} size="sm">
                    {todo.statut === 'en_attente' ? 'En attente' :
                     todo.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                  </Badge>
                  {todo.id && (
                    <>
                      <button
                        onClick={() => openEditModal(todo)}
                        disabled={actionLoading}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTodo(todo);
                          setShowDeleteModal(true);
                        }}
                        disabled={actionLoading}
                        className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </ListView>
      )}

      {/* Modal ajout tâche */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Nouvelle tâche"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
              placeholder="Titre de la tâche"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="input-field"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description détaillée"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                className="input-field"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <option value="tache">Tâche</option>
                <option value="rappel">Rappel</option>
                <option value="suivi">Suivi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorité *
              </label>
              <select
                className="input-field"
                value={formData.priorite}
                onChange={(e) => setFormData(prev => ({ ...prev, priorite: e.target.value as any }))}
              >
                <option value="faible">Faible</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date et heure d'échéance *
            </label>
            <input
              type="datetime-local"
              className="input-field"
              value={formData.dateEcheance}
              onChange={(e) => setFormData(prev => ({ ...prev, dateEcheance: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client (optionnel)
            </label>
            <select
              className="input-field"
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
            >
              <option value="">Aucun client</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.entreprise || `${client.prenom} ${client.nom}`}
                </option>
              ))}
            </select>
          </div>

          {user?.role === 'agence' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigné à
              </label>
              <select
                className="input-field"
                value={formData.assigneA}
                onChange={(e) => setFormData(prev => ({ ...prev, assigneA: e.target.value }))}
              >
                <option value="">Moi-même</option>
                {user?.nom && <option value={user.nom}>{user.nom}</option>}
                {clients.map(client => (
                  <option key={client._id} value={client.nom}>{client.nom}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleAddTodo}
              disabled={!formData.titre || !formData.dateEcheance || actionLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? <LoadingSpinner size="sm" className="mr-2" /> : 'Créer la tâche'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal modification */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTodo(null);
          resetForm();
        }}
        title="Modifier la tâche"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="input-field"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                className="input-field"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <option value="tache">Tâche</option>
                <option value="rappel">Rappel</option>
                <option value="suivi">Suivi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorité *
              </label>
              <select
                className="input-field"
                value={formData.priorite}
                onChange={(e) => setFormData(prev => ({ ...prev, priorite: e.target.value as any }))}
              >
                <option value="faible">Faible</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date et heure d'échéance *
            </label>
            <input
              type="datetime-local"
              className="input-field"
              value={formData.dateEcheance}
              onChange={(e) => setFormData(prev => ({ ...prev, dateEcheance: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client (optionnel)
            </label>
            <select
              className="input-field"
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
            >
              <option value="">Aucun client</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.entreprise || `${client.prenom} ${client.nom}`}
                </option>
              ))}
            </select>
          </div>

          {user?.role === 'agence' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigné à
              </label>
              <select
                className="input-field"
                value={formData.assigneA}
                onChange={(e) => setFormData(prev => ({ ...prev, assigneA: e.target.value }))}
              >
                <option value="">Moi-même</option>
                {user?.nom && <option value={user.nom}>{user.nom}</option>}
                {clients.map(client => (
                  <option key={client._id} value={client.nom}>{client.nom}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedTodo(null);
                resetForm();
              }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                if (!selectedTodo || !selectedTodo.id) return;
                
                setActionLoading(true);
                todosAPI.update(selectedTodo.id, {
                  titre: formData.titre,
                  description: formData.description,
                  clientId: formData.clientId || undefined,
                  dateEcheance: new Date(formData.dateEcheance).toISOString(),
                  priorite: formData.priorite,
                  type: formData.type,
                  assigneA: formData.assigneA || undefined
                }).then(response => {
                  setTodos(prev => (Array.isArray(prev) ? prev : []).map(todo => 
                    todo.id === selectedTodo.id ? response.data.data : todo
                  ));
                  
                  setShowEditModal(false);
                  setSelectedTodo(null);
                  resetForm();
                }).catch(error => {
                  console.error('Erreur lors de la mise à jour:', error);
                  alert('Erreur lors de la mise à jour: ' + (error.response?.data?.message || 'Erreur inconnue'));
                }).finally(() => {
                  setActionLoading(false);
                });
              }}
              disabled={!formData.titre || !formData.dateEcheance || actionLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? <LoadingSpinner size="sm" className="mr-2" /> : 'Enregistrer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTodo(null);
        }}
        title="Confirmer la suppression"
      >
        {selectedTodo && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer la tâche{' '}
              <strong>"{selectedTodo.titre}"</strong> ?
            </p>
            <p className="text-sm text-red-600">
              Cette action est irréversible.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteTodo}
                disabled={actionLoading}
                className="btn-danger"
              >
                {actionLoading ? <LoadingSpinner size="sm" className="mr-2" /> : 'Supprimer'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTodo(null);
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TodosPage;