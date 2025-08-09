import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Eye, 
  User, 
  Calendar,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Activity,
  Plus,
  Edit,
  Trash2,
  LogIn,
  LogOut
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchFilter from '../../components/ui/SearchFilter';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { auditAPI } from '../../services/api';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  duration?: number; // en ms
  affectedResource?: string;
  oldValue?: any;
  newValue?: any;
}

interface AuditStats {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  avgDuration: number;
  actionStats: Array<{ _id: string; count: number }>;
  moduleStats: Array<{ _id: string; count: number }>;
}

const AuditPage: React.FC = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalLogs: 0,
    successCount: 0,
    failureCount: 0,
    avgDuration: 0,
    actionStats: [],
    moduleStats: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [error, setError] = useState<string | null>(null);

  const filterOptions = [
    {
      id: 'action',
      label: 'Action',
      options: [
        { value: 'CREATE', label: 'Création' },
        { value: 'UPDATE', label: 'Modification' },
        { value: 'DELETE', label: 'Suppression' },
        { value: 'LOGIN', label: 'Connexion' },
        { value: 'LOGOUT', label: 'Déconnexion' },
        { value: 'VIEW', label: 'Consultation' },
        { value: 'EXPORT', label: 'Export' }
      ]
    },
    {
      id: 'module',
      label: 'Module',
      options: [
        { value: 'clients', label: 'Clients' },
        { value: 'factures', label: 'Factures' },
        { value: 'reservations', label: 'Réservations' },
        { value: 'agents', label: 'Agents' },
        { value: 'parametres', label: 'Paramètres' },
        { value: 'auth', label: 'Authentification' }
      ]
    },
    {
      id: 'userRole',
      label: 'Rôle utilisateur',
      options: [
        { value: 'superadmin', label: 'Super Admin' },
        { value: 'agence', label: 'Agence' },
        { value: 'agent', label: 'Agent' }
      ]
    },
    {
      id: 'success',
      label: 'Résultat',
      options: [
        { value: 'true', label: 'Succès' },
        { value: 'false', label: 'Échec' }
      ]
    }
  ];

  useEffect(() => {
    fetchAuditData();
  }, [activeFilters, dateRange]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construire les paramètres de requête
      const params: any = {
        page: 1,
        limit: 100
      };
      
      if (activeFilters.action) params.action = activeFilters.action;
      if (activeFilters.module) params.module = activeFilters.module;
      if (activeFilters.userRole) params.userRole = activeFilters.userRole;
      if (activeFilters.success) params.success = activeFilters.success;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      if (searchTerm) params.search = searchTerm;

      // Récupérer les logs et les statistiques en parallèle
      const [logsResponse, statsResponse] = await Promise.all([
        auditAPI.getLogs(params),
        auditAPI.getStats()
      ]);

      if (logsResponse.data.success) {
        setAuditLogs(logsResponse.data.data || []);
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs d\'audit:', error);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setDateRange({ start: '', end: '' });
  };

  const handleDateRangeChange = (range: { start: string; end: string }) => {
    setDateRange(range);
  };

  const handleExport = () => {
    // Logique d'export des logs d'audit
    // Implementation à venir
  };

  const filteredLogs = (Array.isArray(auditLogs) ? auditLogs : []).filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      log.userName.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.module.toLowerCase().includes(searchLower) ||
      log.details.toLowerCase().includes(searchLower)
    );

    // Filtres
    const actionFilter = activeFilters.action;
    const moduleFilter = activeFilters.module;
    const userRoleFilter = activeFilters.userRole;
    const successFilter = activeFilters.success;

    const matchesAction = !actionFilter || actionFilter === 'tous' || log.action === actionFilter;
    const matchesModule = !moduleFilter || moduleFilter === 'tous' || log.module === moduleFilter;
    const matchesUserRole = !userRoleFilter || userRoleFilter === 'tous' || log.userRole === userRoleFilter;
    const matchesSuccess = !successFilter || successFilter === 'tous' || log.success === (successFilter === 'true');

    // Filtre de date
    let matchesDateRange = true;
    if (dateRange.start && dateRange.end) {
      const logDate = new Date(log.timestamp);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Inclure toute la journée de fin
      
      matchesDateRange = logDate >= startDate && logDate <= endDate;
    }

    return matchesSearch && matchesAction && matchesModule && matchesUserRole && matchesSuccess && matchesDateRange;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus className="w-4 h-4 text-green-600" />;
      case 'UPDATE': return <Edit className="w-4 h-4 text-blue-600" />;
      case 'DELETE': return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'LOGIN': return <LogIn className="w-4 h-4 text-purple-600" />;
      case 'LOGOUT': return <LogOut className="w-4 h-4 text-gray-600" />;
      case 'VIEW': return <Eye className="w-4 h-4 text-yellow-600" />;
      case 'EXPORT': return <Download className="w-4 h-4 text-orange-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'danger';
      case 'LOGIN': return 'purple';
      case 'LOGOUT': return 'default';
      case 'VIEW': return 'warning';
      case 'EXPORT': return 'info';
      default: return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'danger';
      case 'agence': return 'info';
      case 'agent': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Audit & Sécurité</h1>
            <p className="text-gray-600">Suivi des actions et activités des utilisateurs</p>
          </div>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button 
                onClick={fetchAuditData}
                className="mt-3 btn-secondary"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Audit & Sécurité</h1>
          <p className="text-gray-600">Suivi des actions et activités des utilisateurs</p>
        </div>
        <button 
          onClick={handleExport}
          className="btn-primary"
        >
          <Download className="w-4 h-4 mr-2" />
          Exporter les logs
        </button>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total actions"
          value={stats.totalLogs}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Actions réussies"
          value={stats.successCount}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Actions échouées"
          value={stats.failureCount}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Temps moyen"
          value={`${stats.avgDuration} ms`}
          icon={Clock}
          color="purple"
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
        placeholder="Rechercher dans les logs..."
        showDateFilter={true}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
      />

      {/* Liste des logs */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Horodatage</TableHeaderCell>
              <TableHeaderCell>Utilisateur</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
              <TableHeaderCell>Module</TableHeaderCell>
              <TableHeaderCell>Détails</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(filteredLogs) ? filteredLogs : []).map((log, index) => (
              <TableRow key={log.id || `log-${index}`}>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(log.timestamp).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.userName}</p>
                      <Badge variant={getRoleColor(log.userRole)} size="sm">
                        {log.userRole}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {getActionIcon(log.action)}
                    <Badge variant={getActionColor(log.action)} size="sm" className="ml-2">
                      {log.action}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900 capitalize">{log.module}</span>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-900 line-clamp-1">{log.details}</p>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={log.success ? 'success' : 'danger'}
                    size="sm"
                  >
                    {log.success ? 'Succès' : 'Échec'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => {
                      setSelectedLog(log);
                      setShowDetailModal(true);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(Array.isArray(filteredLogs) ? filteredLogs : []).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun log d'audit trouvé</p>
          </div>
        )}
      </Card>

      {/* Modal détails log */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails du log d'audit"
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horodatage
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedLog.timestamp).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Utilisateur
                  </label>
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedLog.userName}</p>
                      <Badge variant={getRoleColor(selectedLog.userRole)}>
                        {selectedLog.userRole}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action
                  </label>
                  <div className="flex items-center">
                    {getActionIcon(selectedLog.action)}
                    <Badge variant={getActionColor(selectedLog.action)} className="ml-2">
                      {selectedLog.action}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module
                  </label>
                  <p className="text-sm text-gray-900 capitalize">{selectedLog.module}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <Badge variant={selectedLog.success ? 'success' : 'danger'}>
                    {selectedLog.success ? 'Succès' : 'Échec'}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedLog.duration} ms
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse IP
                  </label>
                  <p className="text-sm text-gray-900 font-mono">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ressource affectée
                  </label>
                  <p className="text-sm text-gray-900 font-mono">
                    {selectedLog.affectedResource || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Détails
              </label>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900">{selectedLog.details}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Agent
              </label>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <p className="text-xs text-gray-600 font-mono">{selectedLog.userAgent}</p>
              </div>
            </div>

            {(selectedLog.oldValue || selectedLog.newValue) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Changements
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLog.oldValue && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Ancienne valeur</h4>
                      <pre className="text-xs text-red-700 overflow-auto max-h-40">
                        {JSON.stringify(selectedLog.oldValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.newValue && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Nouvelle valeur</h4>
                      <pre className="text-xs text-green-700 overflow-auto max-h-40">
                        {JSON.stringify(selectedLog.newValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditPage;