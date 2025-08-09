import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Input,
  Select,
  Option,
  Chip,
  IconButton,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from '@material-tailwind/react';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowRightIcon,
  CalendarIcon,
  FunnelIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { smartImportService, ImportLog } from '../../services/smartImportService';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/ui/ArgonDashboard';
import ArgonTable from '../../components/ui/ArgonTable';

const ImportHistoryPage: React.FC = () => {
  const { currentAgence } = useAuth();
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ImportLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filtres
  const [filters, setFilters] = useState({
    module: '',
    reclassified: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    reclassified: 0,
    successRate: 0,
    byModule: {} as Record<string, number>
  });

  const moduleLabels = {
    billets: 'Billets d\'avion',
    hotel: 'Réservations d\'hôtel',
    visa: 'Demandes de visa',
    assurance: 'Assurances voyage'
  };

  const moduleIcons = {
    billets: '✈️',
    hotel: '🏨',
    visa: '🛂',
    assurance: '🛡️'
  };

  useEffect(() => {
    fetchImportHistory();
  }, [filters, currentAgence]);

  const fetchImportHistory = async () => {
    if (!currentAgence) return;
    
    setLoading(true);
    try {
      const filterParams = {
        ...(filters.module && { module: filters.module }),
        ...(filters.reclassified && { reclassified: filters.reclassified === 'true' }),
        ...(filters.dateFrom && { dateFrom: new Date(filters.dateFrom) }),
        ...(filters.dateTo && { dateTo: new Date(filters.dateTo) })
      };

      const history = await smartImportService.getImportHistory(currentAgence.id, filterParams);
      
      // Filtrer par recherche textuelle côté client
      let filteredHistory = history;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredHistory = history.filter(log => 
          log.emailId.toLowerCase().includes(searchLower) ||
          log.message.toLowerCase().includes(searchLower) ||
          log.indicators.some(indicator => indicator.toLowerCase().includes(searchLower))
        );
      }

      setLogs(filteredHistory);
      calculateStats(filteredHistory);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logs: ImportLog[]) => {
    const total = logs.length;
    const reclassified = logs.filter(log => log.reclassified).length;
    const successful = logs.filter(log => log.status === 'success').length;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    const byModule = logs.reduce((acc, log) => {
      acc[log.finalModule] = (acc[log.finalModule] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      total,
      reclassified,
      successRate,
      byModule
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      module: '',
      reclassified: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
  };

  const handleViewDetails = (log: ImportLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'pending': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return 'Succès';
      case 'error': return 'Erreur';
      case 'pending': return 'En cours';
      default: return 'Inconnu';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Date/Heure',
      render: (value: Date) => formatDate(value)
    },
    {
      key: 'emailId',
      label: 'Email ID',
      render: (value: string) => (
        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
          {value.substring(0, 12)}...
        </code>
      )
    },
    {
      key: 'originalModule',
      label: 'Module original',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <span>{moduleIcons[value as keyof typeof moduleIcons]}</span>
          <span className="text-sm">{moduleLabels[value as keyof typeof moduleLabels]}</span>
        </div>
      )
    },
    {
      key: 'finalModule',
      label: 'Module final',
      render: (value: string, row: ImportLog) => (
        <div className="flex items-center gap-2">
          <span>{moduleIcons[value as keyof typeof moduleIcons]}</span>
          <span className="text-sm">{moduleLabels[value as keyof typeof moduleLabels]}</span>
          {row.reclassified && (
            <Chip size="sm" value="Reclassé" color="orange" />
          )}
        </div>
      )
    },
    {
      key: 'confidence',
      label: 'Confiance',
      render: (value: number) => (
        <Chip
          size="sm"
          value={`${value.toFixed(1)}%`}
          color={value >= 80 ? 'green' : value >= 60 ? 'orange' : 'red'}
        />
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (value: string) => (
        <Chip
          size="sm"
          value={getStatusLabel(value)}
          color={getStatusColor(value)}
        />
      )
    }
  ];

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="small" className="font-normal text-blue-gray-600">
              {title}
            </Typography>
            <Typography variant="h4" color="blue-gray">
              {value}
            </Typography>
          </div>
          <div className={`p-3 rounded-lg bg-${color}-50`}>
            <Icon className={`h-6 w-6 text-${color}-500`} />
          </div>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historique des imports intelligents"
        subtitle="Suivi des imports automatiques et reclassements"
        breadcrumbs={[
          { label: 'Administration', href: '/admin' },
          { label: 'Historique des imports' }
        ]}
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total imports"
          value={stats.total}
          icon={DocumentTextIcon}
          color="blue"
        />
        <StatCard
          title="Reclassements"
          value={stats.reclassified}
          icon={ArrowRightIcon}
          color="orange"
        />
        <StatCard
          title="Taux de succès"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={ChartBarIcon}
          color="green"
        />
        <StatCard
          title="Modules actifs"
          value={Object.keys(stats.byModule).length}
          icon={FunnelIcon}
          color="purple"
        />
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="flex items-center justify-between">
            <Typography variant="h6">Filtres</Typography>
            <Button size="sm" variant="outlined" onClick={clearFilters}>
              Réinitialiser
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              label="Recherche"
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Email ID, message..."
            />
            
            <Select
              label="Module"
              value={filters.module}
              onChange={(value) => handleFilterChange('module', value || '')}
            >
              <Option value="">Tous les modules</Option>
              <Option value="billets">✈️ Billets d'avion</Option>
              <Option value="hotel">🏨 Hôtels</Option>
              <Option value="visa">🛂 Visas</Option>
              <Option value="assurance">🛡️ Assurances</Option>
            </Select>

            <Select
              label="Reclassement"
              value={filters.reclassified}
              onChange={(value) => handleFilterChange('reclassified', value || '')}
            >
              <Option value="">Tous</Option>
              <Option value="true">Reclassés</Option>
              <Option value="false">Non reclassés</Option>
            </Select>

            <Input
              type="date"
              label="Date début"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />

            <Input
              type="date"
              label="Date fin"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Tableau des logs */}
      <ArgonTable
        title="Historique des imports"
        subtitle={`${logs.length} import(s) trouvé(s)`}
        columns={columns}
        data={logs}
        loading={loading}
        searchable={false}
        actions={{
          view: handleViewDetails
        }}
        emptyMessage="Aucun import trouvé"
      />

      {/* Modal de détail */}
      <Dialog open={showDetailModal} handler={() => setShowDetailModal(false)} size="lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-6 w-6" />
            <div>
              <Typography variant="h5">Détail de l'import</Typography>
              <Typography variant="small" color="gray">
                {selectedLog && formatDate(selectedLog.timestamp)}
              </Typography>
            </div>
          </div>
        </DialogHeader>
        
        <DialogBody className="space-y-4">
          {selectedLog && (
            <>
              {/* Informations générales */}
              <Card>
                <CardBody>
                  <Typography variant="h6" className="mb-3">Informations générales</Typography>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Typography variant="small" className="font-medium">Email ID:</Typography>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs block mt-1">
                        {selectedLog.emailId}
                      </code>
                    </div>
                    <div>
                      <Typography variant="small" className="font-medium">Statut:</Typography>
                      <Chip
                        size="sm"
                        value={getStatusLabel(selectedLog.status)}
                        color={getStatusColor(selectedLog.status)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Typography variant="small" className="font-medium">Module original:</Typography>
                      <div className="flex items-center gap-2 mt-1">
                        <span>{moduleIcons[selectedLog.originalModule as keyof typeof moduleIcons]}</span>
                        <span className="text-sm">{moduleLabels[selectedLog.originalModule as keyof typeof moduleLabels]}</span>
                      </div>
                    </div>
                    <div>
                      <Typography variant="small" className="font-medium">Module final:</Typography>
                      <div className="flex items-center gap-2 mt-1">
                        <span>{moduleIcons[selectedLog.finalModule as keyof typeof moduleIcons]}</span>
                        <span className="text-sm">{moduleLabels[selectedLog.finalModule as keyof typeof moduleLabels]}</span>
                        {selectedLog.reclassified && (
                          <Chip size="sm" value="Reclassé" color="orange" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Analyse de confiance */}
              <Card>
                <CardBody>
                  <Typography variant="h6" className="mb-3">Analyse de confiance</Typography>
                  <div className="mb-3">
                    <Typography variant="small" className="font-medium">
                      Niveau de confiance: {selectedLog.confidence.toFixed(1)}%
                    </Typography>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          selectedLog.confidence >= 80 ? 'bg-green-500' :
                          selectedLog.confidence >= 60 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedLog.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <Typography variant="small" className="font-medium mb-2">
                    Indicateurs détectés ({selectedLog.indicators.length}):
                  </Typography>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedLog.indicators.map((indicator, index) => (
                      <Typography key={index} variant="small" className="text-gray-600">
                        • {indicator}
                      </Typography>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Message et résultat */}
              <Card>
                <CardBody>
                  <Typography variant="h6" className="mb-3">Résultat</Typography>
                  <Typography variant="small" className="text-gray-600">
                    {selectedLog.message}
                  </Typography>
                </CardBody>
              </Card>
            </>
          )}
        </DialogBody>
        
        <DialogFooter>
          <Button variant="outlined" onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ImportHistoryPage; 