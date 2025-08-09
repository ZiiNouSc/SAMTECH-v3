import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Filter,
  FileText,
  PieChart,
  Users,
  Euro,
  Plane,
  Building2,
  PackageIcon,
  Car,
  Eye
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { formatMontantCurrency } from '../../utils/formatters';

interface RapportData {
  periode: string;
  chiffreAffaires: {
    moisActuel: number;
    moisPrecedent: number;
    evolution: number;
  };
  benefices: {
    moisActuel: number;
    moisPrecedent: number;
    evolution: number;
  };
  depenses: {
    moisActuel: number;
    moisPrecedent: number;
    evolution: number;
  };
  creances: {
    total: number;
    enRetard: number;
  };
  ventesParMois: Array<{
    mois: string;
    montant: number;
    reservations: number;
  }>;
  topClients: Array<{
    nom: string;
    montant: number;
    pourcentage: number;
  }>;
  repartitionVentes: Array<{
    categorie: string;
    montant: number;
    pourcentage: number;
  }>;
}

const RapportsPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<RapportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('mois');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchRapportData();
  }, [selectedPeriod, selectedYear]);

  const fetchRapportData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - à remplacer par un vrai appel API
      setData({
        periode: `${selectedPeriod} ${selectedYear}`,
        chiffreAffaires: {
          moisActuel: 45230,
          moisPrecedent: 38950,
          evolution: 16.1
        },
        benefices: {
          moisActuel: 12450,
          moisPrecedent: 10200,
          evolution: 22.1
        },
        depenses: {
          moisActuel: 32780,
          moisPrecedent: 28750,
          evolution: 14.0
        },
        creances: {
          total: 8950,
          enRetard: 3200
        },
        ventesParMois: [
          { mois: 'Jan', montant: 32000, reservations: 22 },
          { mois: 'Fév', montant: 28500, reservations: 28 },
          { mois: 'Mar', montant: 35200, reservations: 25 },
          { mois: 'Avr', montant: 41800, reservations: 32 },
          { mois: 'Mai', montant: 38950, reservations: 27 },
          { mois: 'Juin', montant: 45230, reservations: 22 }
        ],
        topClients: [
          { nom: 'Entreprise ABC', montant: 12500, pourcentage: 27.6 },
          { nom: 'Martin Dubois', montant: 8900, pourcentage: 19.7 },
          { nom: 'Sophie Martin', montant: 6750, pourcentage: 14.9 },
          { nom: 'Jean Dupont', montant: 5200, pourcentage: 11.5 },
          { nom: 'Autres', montant: 11880, pourcentage: 26.3 }
        ],
        repartitionVentes: [
          { categorie: 'Packages voyage', montant: 18500, pourcentage: 40.9 },
          { categorie: 'Billets d\'avion', montant: 12800, pourcentage: 28.3 },
          { categorie: 'Hébergement', montant: 8900, pourcentage: 19.7 },
          { categorie: 'Transport', montant: 3200, pourcentage: 7.1 },
          { categorie: 'Autres', montant: 1830, pourcentage: 4.0 }
        ]
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    // Logique d'export en format spécifié
    // Implementation à venir
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erreur lors du chargement des données</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Rapports & Analyses</h1>
          <p className="text-gray-600">Tableaux de bord et analyses de performance</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="input-field w-auto"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="mois">Par mois</option>
              <option value="trimestre">Par trimestre</option>
              <option value="annee">Par année</option>
            </select>
            <select
              className="input-field w-auto"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
              <option value={2022}>2022</option>
            </select>
          </div>
          <button 
            onClick={() => handleExport('excel')}
            className="btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            className="btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </button>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Chiffre d'Affaires"
          value={formatMontantCurrency(data.chiffreAffaires.moisActuel || 0)}
          icon={Euro}
          color="green"
          trend={{
            value: 12.5,
            label: '+12.5%',
            isPositive: true
          }}
        />
        <StatCard
          title="Nombre de Clients"
          value={89}
          icon={Users}
          color="blue"
          trend={{
            value: 8.2,
            label: '+8.2%',
            isPositive: true
          }}
        />
        <StatCard
          title="Réservations"
          value={156}
          icon={Calendar}
          color="purple"
          trend={{
            value: 15.3,
            label: '+15.3%',
            isPositive: true
          }}
        />
        <StatCard
          title="Ticket Moyen"
          value={804}
          icon={TrendingUp}
          color="yellow"
          trend={{
            value: 5.7,
            label: '+5.7%',
            isPositive: true
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Évolution Mensuelle</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {(data.ventesParMois || []).map((item, index) => {
              const maxCA = Math.max(...(data.ventesParMois || []).map(v => v.montant));
              const percentage = (item.montant / maxCA) * 100;
              
              return (
                <div key={`item-${index}`} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.mois}</span>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatMontantCurrency(item.montant || 0)}
                      </p>
                      <p className="text-gray-500">{item.reservations} réservations</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top destinations */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Top Destinations</h2>
            <Plane className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {[
              { destination: 'Rome, Italie', reservations: 23, ca: 28750 },
              { destination: 'Madrid, Espagne', reservations: 18, ca: 22400 },
              { destination: 'Londres, UK', reservations: 15, ca: 31200 },
              { destination: 'Amsterdam, Pays-Bas', reservations: 12, ca: 18600 },
              { destination: 'Barcelone, Espagne', reservations: 10, ca: 15800 }
            ].map((destination, index) => (
              <div key={`destination-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{destination.destination}</p>
                    <p className="text-sm text-gray-500">{destination.reservations} réservations</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatMontantCurrency(destination.ca || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Répartition par type */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Répartition par Type de Réservation</h2>
          <PieChart className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data.repartitionVentes || []).map((type, index) => (
            <div key={`type-${index}`} className="text-center p-4 border border-gray-200 rounded-lg">
              <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                index === 0 ? 'bg-blue-100' :
                index === 1 ? 'bg-green-100' :
                index === 2 ? 'bg-purple-100' : 'bg-orange-100'
              }`}>
                {index === 0 && <PackageIcon className="w-8 h-8 text-blue-600" />}
                {index === 1 && <Plane className="w-8 h-8 text-green-600" />}
                {index === 2 && <Building2 className="w-8 h-8 text-purple-600" />}
                {index === 3 && <Car className="w-8 h-8 text-orange-600" />}
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{type.categorie}</h3>
              <p className="text-2xl font-bold text-gray-900 mb-1">{type.pourcentage}%</p>
              <p className="text-sm text-gray-600">
                {formatMontantCurrency(type.montant || 0)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Rapports prédéfinis */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Rapports Prédéfinis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Rapport Mensuel Complet',
              description: 'Analyse complète des performances du mois',
              icon: FileText,
              color: 'blue'
            },
            {
              title: 'Analyse des Clients',
              description: 'Segmentation et comportement clients',
              icon: Users,
              color: 'green'
            },
            {
              title: 'Performance par Destination',
              description: 'Analyse des destinations les plus rentables',
              icon: Plane,
              color: 'purple'
            },
            {
              title: 'Évolution Trimestrielle',
              description: 'Tendances et évolutions sur 3 mois',
              icon: TrendingUp,
              color: 'orange'
            },
            {
              title: 'Rapport Financier',
              description: 'Analyse détaillée des revenus et marges',
              icon: Euro,
              color: 'yellow'
            },
            {
              title: 'Analyse Comparative',
              description: 'Comparaison avec les périodes précédentes',
              icon: BarChart3,
              color: 'red'
            }
          ].map((rapport, index) => {
            const Icon = rapport.icon;
            return (
              <div key={`rapport-${index}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 bg-${rapport.color}-100`}>
                    <Icon className={`w-5 h-5 text-${rapport.color}-600`} />
                  </div>
                  <h3 className="font-medium text-gray-900">{rapport.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">{rapport.description}</p>
                <div className="flex space-x-2">
                  <button className="btn-secondary text-xs px-3 py-1">
                    <Eye className="w-3 h-3 mr-1" />
                    Voir
                  </button>
                  <button className="btn-primary text-xs px-3 py-1">
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default RapportsPage;