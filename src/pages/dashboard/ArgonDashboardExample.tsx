import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Card,
  CardBody,
  Select,
  Option,
} from '@material-tailwind/react';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { 
  StatCard, 
  ChartCard, 
  InfoCard, 
  DashboardGrid, 
  PageHeader 
} from '../../components/ui/ArgonDashboard';
import ArgonTable from '../../components/ui/ArgonTable';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ArgonDashboardExample: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(true);

  // Données de démonstration
  const statsData = [
    {
      title: "Chiffre d'affaires",
      value: 2456789,
      icon: CurrencyDollarIcon,
      color: 'green' as const,
      trend: { value: 12.5, type: 'increase' as const, period: 'vs mois dernier' },
      footer: 'Total mensuel'
    },
    {
      title: 'Clients actifs',
      value: 1234,
      icon: UserGroupIcon,
      color: 'blue' as const,
      trend: { value: 8.2, type: 'increase' as const, period: 'ce mois' },
      footer: 'Clients enregistrés'
    },
    {
      title: 'Factures',
      value: 856,
      icon: DocumentTextIcon,
      color: 'purple' as const,
      trend: { value: 2.1, type: 'decrease' as const, period: 'vs mois dernier' },
      footer: 'Factures émises'
    },
    {
      title: 'Bénéfices',
      value: 345678,
      icon: ChartBarIcon,
      color: 'orange' as const,
      trend: { value: 15.3, type: 'increase' as const, period: 'ce trimestre' },
      footer: 'Marge brute'
    }
  ];

  const recentInvoices = [
    {
      id: 1,
      numero: 'FAC-2024-001',
      client: 'SARL Techno',
      montant: 125000,
      statut: 'Payée',
      date: '2024-01-15'
    },
    {
      id: 2,
      numero: 'FAC-2024-002',
      client: 'Entreprise ABC',
      montant: 89500,
      statut: 'En attente',
      date: '2024-01-14'
    },
    {
      id: 3,
      numero: 'FAC-2024-003',
      client: 'SNC Commerce',
      montant: 67800,
      statut: 'Brouillon',
      date: '2024-01-13'
    }
  ];

  const chartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Chiffre d\'affaires',
        data: [65000, 78000, 82000, 91000, 88000, 95000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const doughnutData = {
    labels: ['Factures payées', 'En attente', 'Brouillon'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(249, 115, 22)',
          'rgb(156, 163, 175)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const tableColumns = [
    { key: 'numero', label: 'N° Facture' },
    { key: 'client', label: 'Client' },
    { 
      key: 'montant', 
      label: 'Montant',
      render: (value: number) => `${value.toLocaleString('fr-FR')} DA`
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (value: string) => {
        const colors = {
          'Payée': 'green',
          'En attente': 'orange',
          'Brouillon': 'gray'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs bg-${colors[value as keyof typeof colors]}-100 text-${colors[value as keyof typeof colors]}-800`}>
            {value}
          </span>
        );
      }
    },
    { key: 'date', label: 'Date' }
  ];

  useEffect(() => {
    // Simulation du chargement
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de votre activité"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Tableau de bord' }
        ]}
        actions={
          <>
            <Select
              value={dateRange}
              onChange={(value) => setDateRange(value || '30')}
              label="Période"
            >
              <Option value="7">7 derniers jours</Option>
              <Option value="30">30 derniers jours</Option>
              <Option value="90">3 derniers mois</Option>
              <Option value="365">Année</Option>
            </Select>
            <Button size="sm" className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Nouvelle facture
            </Button>
          </>
        }
      />

      {/* Statistiques principales */}
      <DashboardGrid cols={4}>
        {statsData.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            footer={stat.footer}
          />
        ))}
      </DashboardGrid>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Évolution du chiffre d'affaires"
            subtitle="Tendance sur les 6 derniers mois"
            actions={
              <Button variant="text" size="sm">
                Voir détails
              </Button>
            }
          >
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          </ChartCard>
        </div>
        
        <div>
          <ChartCard
            title="Répartition des factures"
            subtitle="Par statut"
          >
            <div className="h-64 flex items-center justify-center">
              <div className="w-48 h-48">
                <Doughnut 
                  data={doughnutData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          padding: 20,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Tableaux et informations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ArgonTable
            title="Factures récentes"
            subtitle="Dernières factures créées"
            columns={tableColumns}
            data={recentInvoices}
            loading={loading}
            searchable={false}
            actions={{
              view: (row) => console.log('Voir', row),
              edit: (row) => console.log('Modifier', row),
            }}
            headerActions={
              <Button size="sm" variant="outlined">
                Voir toutes
              </Button>
            }
          />
        </div>

        <div className="space-y-6">
          <InfoCard
            title="Tâches urgentes"
            subtitle="3 tâches en attente"
            icon={CalendarIcon}
            color="red"
            actions={
              <Button size="sm" variant="text">
                Voir tout
              </Button>
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <Typography variant="small" className="font-medium">
                    Relance client XYZ
                  </Typography>
                  <Typography variant="small" color="gray">
                    Échéance: Aujourd'hui
                  </Typography>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <Typography variant="small" className="font-medium">
                    Validation facture #001
                  </Typography>
                  <Typography variant="small" color="gray">
                    Échéance: Demain
                  </Typography>
                </div>
              </div>
            </div>
          </InfoCard>

          <InfoCard
            title="Notifications"
            subtitle="2 nouvelles notifications"
            color="blue"
          >
            <div className="space-y-3">
              <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                <Typography variant="small" className="font-medium">
                  Nouveau client enregistré
                </Typography>
                <Typography variant="small" color="gray">
                  Il y a 2 heures
                </Typography>
              </div>
              <div className="p-3 border-l-4 border-green-500 bg-green-50">
                <Typography variant="small" className="font-medium">
                  Facture payée
                </Typography>
                <Typography variant="small" color="gray">
                  Il y a 5 heures
                </Typography>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
};

export default ArgonDashboardExample; 