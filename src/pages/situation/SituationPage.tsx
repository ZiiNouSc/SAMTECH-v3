import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { dashboardAPI, facturesAPI } from '../../services/api';
import { formatMontantCurrency } from '../../utils/formatters';
import { Link } from 'react-router-dom';

interface FinancialData {
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

const SituationPage: React.FC = () => {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('mois');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchFinancialData();
  }, [selectedPeriod, selectedYear]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      // 1. Récupérer les stats globales
      const dashboardRes = await dashboardAPI.getStats();
      const dashboard = dashboardRes.data.data;
      // 2. Récupérer toutes les factures pour les analyses détaillées
      const facturesRes = await facturesAPI.getAll();
      const factures = facturesRes.data.data || [];

      // Calcul ventes par mois
      const ventesParMois: { mois: string; montant: number }[] = [];
      const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      for (let i = 0; i < 12; i++) {
        const facturesMois = factures.filter((f: any) => new Date(f.dateEmission).getMonth() === i && f.statut === 'payee');
        const montant = facturesMois.reduce((sum: number, f: any) => sum + (f.montantTTC || 0), 0);
        ventesParMois.push({ mois: moisLabels[i], montant });
      }

      // Top clients
      const clientMap: Record<string, { nom: string; montant: number }> = {};
      factures.filter((f: any) => f.statut === 'payee').forEach((f: any) => {
        const nom = f.client?.entreprise || f.client?.nom || 'Client inconnu';
        if (!clientMap[nom]) clientMap[nom] = { nom, montant: 0 };
        clientMap[nom].montant += f.montantTTC || 0;
      });
      const topClientsArr = Object.values(clientMap).sort((a, b) => b.montant - a.montant);
      const totalVentes = topClientsArr.reduce((sum, c) => sum + c.montant, 0);
      const topClients = topClientsArr.slice(0, 4).map(c => ({
        nom: c.nom,
        montant: c.montant,
        pourcentage: totalVentes ? (c.montant / totalVentes) * 100 : 0
      }));
      if (topClientsArr.length > 4) {
        const autresMontant = topClientsArr.slice(4).reduce((sum, c) => sum + c.montant, 0);
        topClients.push({ nom: 'Autres', montant: autresMontant, pourcentage: totalVentes ? (autresMontant / totalVentes) * 100 : 0 });
      }

      // Répartition des ventes par type d'article
      const repartitionMap: Record<string, number> = {};
      factures.filter((f: any) => f.statut === 'payee').forEach((f: any) => {
        (f.articles || []).forEach((a: any) => {
          const cat = a.designation || 'Autre';
          if (!repartitionMap[cat]) repartitionMap[cat] = 0;
          repartitionMap[cat] += a.montant || 0;
        });
      });
      const totalRepartition = Object.values(repartitionMap).reduce((sum, v) => sum + v, 0);
      const repartitionVentes = Object.entries(repartitionMap).map(([categorie, montant]) => ({
        categorie,
        montant,
        pourcentage: totalRepartition ? (montant / totalRepartition) * 100 : 0
      }));

      setData({
        chiffreAffaires: {
          moisActuel: dashboard.chiffreAffaireMois || 0,
          moisPrecedent: 0, // À calculer si besoin
          evolution: 0 // À calculer si besoin
        },
        benefices: {
          moisActuel: 0, // À calculer si tu as les dépenses
          moisPrecedent: 0,
          evolution: 0
        },
        depenses: {
          moisActuel: 0, // À calculer si tu as les dépenses
          moisPrecedent: 0,
          evolution: 0
        },
        creances: {
          total: dashboard.facturesImpayees || 0,
          enRetard: 0 // À calculer si tu veux
        },
        ventesParMois,
        topClients,
        repartitionVentes
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données financières:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Logique d'export des données financières
    // Implementation à venir
  };

  const formatCurrency = (amount: number) => {
    return (typeof amount === 'number' ? amount : 0).toLocaleString('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    });
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
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
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Situation</h1>
          <p className="text-gray-600">Analyse de la situation financière</p>
        </div>
        <Link to="/situation/nouveau" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle Analyse
        </Link>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.chiffreAffaires.moisActuel)}
              </p>
              <div className="flex items-center mt-2">
                {data.chiffreAffaires.evolution >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  data.chiffreAffaires.evolution >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(data.chiffreAffaires.evolution)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bénéfices</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.benefices.moisActuel)}
              </p>
              <div className="flex items-center mt-2">
                {data.benefices.evolution >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  data.benefices.evolution >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(data.benefices.evolution)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dépenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.depenses.moisActuel)}
              </p>
              <div className="flex items-center mt-2">
                {data.depenses.evolution >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-600 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  data.depenses.evolution >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatPercentage(data.depenses.evolution)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-red-100">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Créances</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.creances.total)}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-red-600 font-medium">
                  {formatCurrency(data.creances.enRetard)}
                </span>
                <span className="text-sm text-gray-500 ml-1">en retard</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des ventes */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Évolution des Ventes</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {(data.ventesParMois || []).map((item, index) => {
              const maxValue = Math.max(...(data.ventesParMois || []).map(v => v.montant));
              const percentage = (item.montant / maxValue) * 100;
              
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-12 text-sm font-medium text-gray-600">
                    {item.mois}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(item.montant)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top clients */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Top Clients</h2>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {(data.topClients || []).map((client, index) => (
              <div key={`client-${index}`} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-yellow-500' :
                    index === 3 ? 'bg-purple-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-900">
                    {client.nom}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(client.montant)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {client.pourcentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Répartition des ventes par catégorie */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Répartition des Ventes par Catégorie
        </h2>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Catégorie</TableHeaderCell>
              <TableHeaderCell>Montant</TableHeaderCell>
              <TableHeaderCell>Pourcentage</TableHeaderCell>
              <TableHeaderCell>Évolution</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data.repartitionVentes || []).map((item, index) => (
              <TableRow key={`vente-${index}`}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' :
                      index === 3 ? 'bg-purple-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium text-gray-900">
                      {item.categorie}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {formatCurrency(item.montant)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.pourcentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {item.pourcentage.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      +{(Math.random() * 20).toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SituationPage;