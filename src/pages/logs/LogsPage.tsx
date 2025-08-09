import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Download,
  RefreshCw
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  action: string;
  description: string;
  userId?: string;
  userName?: string;
  ipAddress: string;
  userAgent?: string;
  details?: any;
}

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('tous');
  const [dateFilter, setDateFilter] = useState<string>('7j');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [levelFilter, dateFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - à remplacer par un vrai appel API
      setLogs([
        {
          id: '1',
          timestamp: '2024-01-15T14:30:00Z',
          level: 'info',
          action: 'LOGIN',
          description: 'Connexion utilisateur réussie',
          userId: '1',
          userName: 'Sophie Martin',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          details: { loginMethod: 'email', sessionId: 'sess_123456' }
        },
        {
          id: '2',
          timestamp: '2024-01-15T14:25:00Z',
          level: 'success',
          action: 'FACTURE_CREATED',
          description: 'Nouvelle facture créée: FAC-2024-001',
          userId: '2',
          userName: 'Jean Dubois',
          ipAddress: '192.168.1.101',
          details: { factureId: 'FAC-2024-001', montant: 1200.00, clientId: '1' }
        },
        {
          id: '3',
          timestamp: '2024-01-15T14:20:00Z',
          level: 'warning',
          action: 'FAILED_LOGIN',
          description: 'Tentative de connexion échouée',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          details: { email: 'test@example.com', reason: 'invalid_password', attempts: 3 }
        },
        {
          id: '4',
          timestamp: '2024-01-15T14:15:00Z',
          level: 'error',
          action: 'PAYMENT_FAILED',
          description: 'Échec du traitement du paiement',
          userId: '3',
          userName: 'Marie Leroy',
          ipAddress: '192.168.1.103',
          details: { 
            factureId: 'FAC-2024-002', 
            montant: 850.00, 
            errorCode: 'CARD_DECLINED',
            errorMessage: 'Carte bancaire refusée'
          }
        },
        {
          id: '5',
          timestamp: '2024-01-15T14:10:00Z',
          level: 'info',
          action: 'CLIENT_CREATED',
          description: 'Nouveau client ajouté',
          userId: '1',
          userName: 'Sophie Martin',
          ipAddress: '192.168.1.100',
          details: { clientId: '5', clientName: 'Entreprise XYZ' }
        },
        {
          id: '6',
          timestamp: '2024-01-15T14:05:00Z',
          level: 'warning',
          action: 'BACKUP_DELAYED',
          description: 'Sauvegarde automatique retardée',
          ipAddress: 'system',
          details: { 
            scheduledTime: '2024-01-15T14:00:00Z',
            actualTime: '2024-01-15T14:05:00Z',
            reason: 'high_system_load'
          }
        },
        {
          id: '7',
          timestamp: '2024-01-15T13:45:00Z',
          level: 'success',
          action: 'PACKAGE_PUBLISHED',
          description: 'Package publié sur la vitrine',
          userId: '2',
          userName: 'Jean Dubois',
          ipAddress: '192.168.1.101',
          details: { packageId: '3', packageName: 'Séjour Rome 4 jours' }
        },
        {
          id: '8',
          timestamp: '2024-01-15T13:30:00Z',
          level: 'error',
          action: 'EMAIL_FAILED',
          description: 'Échec d\'envoi d\'email',
          ipAddress: 'system',
          details: { 
            recipient: 'client@example.com',
            subject: 'Confirmation de réservation',
            errorCode: 'SMTP_ERROR',
            retryCount: 3
          }
        }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Logique d'export des logs
    // Implementation à venir
  };

  const filteredLogs = (Array.isArray(logs) ? logs : []).filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.userName && log.userName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = levelFilter === 'tous' || log.level === levelFilter;
    
    // Filtrage par date
    const logDate = new Date(log.timestamp);
    const now = new Date();
    let matchesDate = true;
    
    switch (dateFilter) {
      case '1j':
        matchesDate = (now.getTime() - logDate.getTime()) <= 24 * 60 * 60 * 1000;
        break;
      case '7j':
        matchesDate = (now.getTime() - logDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        break;
      case '30j':
        matchesDate = (now.getTime() - logDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        break;
    }
    
    return matchesSearch && matchesLevel && matchesDate;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      default: return 'info';
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
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Logs Système</h1>
          <p className="text-gray-600">Historique des actions et événements</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchLogs}
            className="btn-secondary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          <button 
            onClick={handleExport}
            className="btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </button>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Info</p>
              <p className="text-2xl font-bold text-gray-900">
                {(Array.isArray(logs) ? logs : []).filter(l => l.level === 'info').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Succès</p>
              <p className="text-2xl font-bold text-gray-900">
                {(Array.isArray(logs) ? logs : []).filter(l => l.level === 'success').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avertissements</p>
              <p className="text-2xl font-bold text-gray-900">
                {(Array.isArray(logs) ? logs : []).filter(l => l.level === 'warning').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Erreurs</p>
              <p className="text-2xl font-bold text-gray-900">
                {(Array.isArray(logs) ? logs : []).filter(l => l.level === 'error').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher dans les logs..."
                className="w-full pl-10 input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="input-field w-auto"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="tous">Tous les niveaux</option>
              <option value="info">Info</option>
              <option value="success">Succès</option>
              <option value="warning">Avertissement</option>
              <option value="error">Erreur</option>
            </select>
            <select
              className="input-field w-auto"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="1j">Dernières 24h</option>
              <option value="7j">7 derniers jours</option>
              <option value="30j">30 derniers jours</option>
              <option value="tous">Toutes les dates</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des logs */}
      <div className="card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Niveau</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Utilisateur</TableHeaderCell>
              <TableHeaderCell>Date/Heure</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(filteredLogs) ? filteredLogs : []).map((log, index) => (
              <TableRow key={log.id || `log-${index}`}>
                <TableCell>
                  <div key={index} className="flex items-center">
                    {getLevelIcon(log.level)}
                    <Badge variant={getLevelColor(log.level)} size="sm" className="ml-2">
                      {log.level.toUpperCase()}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {log.action}
                  </span>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {log.description}
                  </p>
                </TableCell>
                <TableCell>
                  {log.userName ? (
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{log.userName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 italic">Système</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  </div>
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
                    <Info className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(Array.isArray(filteredLogs) ? filteredLogs : []).length === 0 && (
          <div className="text-center py-8">
            <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun log trouvé</p>
          </div>
        )}
      </div>

      {/* Modal détails log */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails du log"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau
                  </label>
                  <div className="flex items-center">
                    {getLevelIcon(selectedLog.level)}
                    <Badge variant={getLevelColor(selectedLog.level)} className="ml-2">
                      {selectedLog.level.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action
                  </label>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Utilisateur
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedLog.userName || 'Système'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date et heure
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedLog.timestamp).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse IP
                  </label>
                  <p className="text-sm text-gray-900 font-mono">
                    {selectedLog.ipAddress}
                  </p>
                </div>
                {selectedLog.userId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Utilisateur
                    </label>
                    <p className="text-sm text-gray-900 font-mono">
                      {selectedLog.userId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                {selectedLog.description}
              </p>
            </div>

            {selectedLog.userAgent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Agent
                </label>
                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg font-mono break-all">
                  {selectedLog.userAgent}
                </p>
              </div>
            )}

            {selectedLog.details && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Détails techniques
                </label>
                <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-auto max-h-40">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LogsPage;