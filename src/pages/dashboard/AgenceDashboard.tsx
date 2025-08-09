import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Receipt, 
  Wallet, 
  TrendingUp, 
  Calendar,
  Euro,
  FileText,
  CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { dashboardAPI } from '../../services/api';

const AgenceDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    facturesEnAttente: 0,
    chiffreAffaireMois: 0,
    soldeCaisse: 0,
    facturesImpayees: 0,
    bonCommandeEnCours: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getAgenceStats();
      
      if (response.data.success) {
        const data = response.data.data;
        setStats({
          totalClients: data.totalClients,
          facturesEnAttente: data.facturesEnAttente,
          chiffreAffaireMois: data.chiffreAffaireMois,
          soldeCaisse: data.soldeCaisse,
          facturesImpayees: data.facturesImpayees || 0,
          bonCommandeEnCours: data.bonCommandeEnCours || 0
        });
        setRecentActivities(data.recentActivities);
      } else {
        throw new Error(response.data.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/clients'
    },
    {
      title: 'Factures en Attente',
      value: stats.facturesEnAttente,
      icon: Receipt,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      link: '/factures'
    },
    {
      title: 'CA du Mois',
      value: `${(stats.chiffreAffaireMois || 0).toLocaleString()} DA`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/situation'
    },
    {
      title: 'Solde Caisse',
      value: `${(stats.soldeCaisse || 0).toLocaleString()} DA`,
      icon: Wallet,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/caisse'
    }
  ];

  const quickActions = [
    {
      title: 'Nouvelle Facture',
      description: 'Créer une facture client',
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/factures/nouveau'
    },
    {
      title: 'Nouveau Client',
      description: 'Ajouter un client',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/clients/nouveau'
    },
    {
      title: 'Opération Caisse',
      description: 'Enregistrer une opération',
      icon: Wallet,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/caisse'
    },
    {
      title: 'Devis',
      description: 'Créer un devis',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/pre-factures/nouveau'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Tableau de Bord Agence</h1>
        <p className="text-gray-600">Vue d'ensemble de votre activité</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(Array.isArray(statCards) ? statCards : []).map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.link} className="card group hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activités récentes */}
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activités Récentes</h2>
          
          <div className="space-y-4">
            {(Array.isArray(recentActivities) ? recentActivities : []).map((activity, index) => (
              <div key={activity.id || `activity-${index}`} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'facture' ? 'bg-blue-100' :
                  activity.type === 'paiement' ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  {activity.type === 'facture' && <Receipt className="w-4 h-4 text-blue-600" />}
                  {activity.type === 'paiement' && <Euro className="w-4 h-4 text-green-600" />}
                  {activity.type === 'commande' && <FileText className="w-4 h-4 text-orange-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleString('fr-FR')}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {(activity.montant || 0).toLocaleString()} DA
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h2>
          <div className="space-y-3">
            {(Array.isArray(quickActions) ? quickActions : []).map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className={`p-2 rounded-lg ${action.bgColor}`}>
                    <Icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      {action.title}
                    </h3>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alertes et notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertes</h2>
          <div className="space-y-3">
            {stats.facturesImpayees > 0 && (
              <Link
                to="/creances"
                className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <CreditCard className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {stats.facturesImpayees} facture(s) impayée(s)
                  </p>
                  <p className="text-xs text-red-600">Nécessite votre attention</p>
                </div>
              </Link>
            )}
            {stats.bonCommandeEnCours > 0 && (
              <Link
                to="/pre-factures"
                className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <FileText className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {stats.bonCommandeEnCours} devis en cours
                  </p>
                  <p className="text-xs text-yellow-600">À convertir en factures</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Raccourcis</h2>
          <div className="space-y-2">
            <Link
              to="/vitrine"
              className="block text-blue-600 hover:text-blue-700 text-sm font-medium py-1"
            >
              → Gérer ma vitrine publique
            </Link>
            <Link
              to="/packages"
              className="block text-blue-600 hover:text-blue-700 text-sm font-medium py-1"
            >
              → Créer un nouveau package
            </Link>
            <Link
              to="/agents"
              className="block text-blue-600 hover:text-blue-700 text-sm font-medium py-1"
            >
              → Gérer mes agents
            </Link>
            <Link
              to="/parametres"
              className="block text-blue-600 hover:text-blue-700 text-sm font-medium py-1"
            >
              → Paramètres de l'agence
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenceDashboard;