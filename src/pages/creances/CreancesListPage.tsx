import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Euro
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Facture } from '../../types';
import { creancesAPI } from '../../services/api';
import { Bar } from 'react-chartjs-2';
import { formatMontantCurrency } from '../../utils/formatters';

const CreancesListPage: React.FC = () => {
  const [creances, setCreances] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCreance, setSelectedCreance] = useState<Facture | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRelanceModal, setShowRelanceModal] = useState(false);
  const [relanceMessage, setRelanceMessage] = useState('');
  const [stats, setStats] = useState({
    totalCreances: 0,
    totalFactures: 0,
    avgDaysLate: 0
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');

  useEffect(() => {
    fetchCreances();
    fetchStats();
  }, []);

  const fetchCreances = async () => {
    try {
      setLoading(true);
      const response = await creancesAPI.getAll();
      
      if (response.data.success) {
        setCreances(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load unpaid invoices');
      }
    } catch (error) {
      console.error('Error loading unpaid invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await creancesAPI.getStats();
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load stats');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const calculateDaysLate = (dateEcheance: string) => {
    const today = new Date();
    const echeance = new Date(dateEcheance);
    const diffTime = today.getTime() - echeance.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSendReminder = async (creanceId: string) => {
    if (!creanceId) {
      console.error('Creance ID is undefined');
      return;
    }
    
    if (!relanceMessage.trim()) {
      alert('Veuillez saisir un message de relance');
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await creancesAPI.sendReminder(creanceId, relanceMessage);
      
      if (response.data.success) {
        alert('Relance envoyée avec succès');
        setShowRelanceModal(false);
        setRelanceMessage('');
      } else {
        throw new Error(response.data.message || 'Failed to send reminder');
      }
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      alert('Une erreur est survenue lors de l\'envoi de la relance: ' + (error.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const prepareRelanceMessage = (creance: Facture) => {
    const message = `Madame, Monsieur,

Nous vous rappelons que la facture ${creance.numero} d'un montant de ${formatMontantCurrency(creance.montantTTC || 0)} est échue depuis le ${new Date(creance.dateEcheance).toLocaleDateString('fr-FR')}.

Nous vous remercions de bien vouloir procéder au règlement dans les plus brefs délais.

Cordialement,
L'équipe SamTech`;
    
    setRelanceMessage(message);
    setSelectedCreance(creance);
    setShowRelanceModal(true);
  };

  const getResteAPayer = (creance: Facture) => {
    const totalRegle = (creance.reglements || []).reduce((sum, reg) => sum + reg.montant, 0);
    return Math.max((creance.montantTTC || 0) - totalRegle, 0);
  };
  const getStatut = (creance: Facture) => {
    const reste = getResteAPayer(creance);
    const today = new Date();
    const echeance = new Date(creance.dateEcheance);
    if (reste === 0) return 'réglée';
    if (echeance < today && reste > 0) return 'en retard'; // même partielle
    return 'partielle';
  };

  const today = new Date();
  // Correction du filtrage : afficher toutes les factures en retard (reste à payer > 0 ET date d'échéance < aujourd'hui), même partiellement payées
  const filteredCreances = (Array.isArray(creances) ? creances : [])
    .filter(creance => {
      // Recherche
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = (
        creance.numero.toLowerCase().includes(searchLower) ||
        (creance.client?.entreprise || `${creance.client?.prenom || ''} ${creance.client?.nom || ''}`)
          .toLowerCase().includes(searchLower)
      );
      // Filtre client
      const matchClient = clientFilter === 'all' || creance.client?._id === clientFilter;
      // Filtre statut
      const statut = getStatut(creance);
      const matchStatut = statutFilter === 'all' || statut === statutFilter;
      // Factures en retard (reste à payer > 0 ET date d'échéance < aujourd'hui)
      const echeance = new Date(creance.dateEcheance);
      const reste = getResteAPayer(creance);
      const isOverdue = echeance < today && reste > 0;
      if (filter === 'all') {
        return matchSearch && matchClient && isOverdue;
      }
      return matchSearch && matchClient && matchStatut;
    });

  // Adapter le total des créances à filteredCreances
  const totalCreances = filteredCreances.reduce((sum, c) => sum + (c.montantTTC || 0), 0);

  // Calcul pour le graphique barres (adapté à la vue filtrée)
  const totalRegle = filteredCreances.reduce(
    (sum, c) => sum + ((c.reglements || []).reduce((s, r) => s + r.montant, 0)), 0
  );
  const totalRestant = filteredCreances.reduce(
    (sum, c) => sum + (c.resteAPayer || 0), 0
  );
  const barData = {
    labels: ['Règlements', 'Créances en retard'],
    datasets: [
      {
        label: 'Montant',
        data: [totalRegle, totalRestant],
        backgroundColor: ['#22c55e', '#ef4444'],
      },
    ],
  };
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true }
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
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Règlement & Créances</h1>
          <p className="text-gray-600">Suivi des factures impayées, relances et règlements</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total des créances</p>
          <p className="text-2xl font-bold text-red-600">
            {(typeof totalCreances === 'number' ? totalCreances : 0).toLocaleString('fr-FR', { 
              style: 'currency', 
              currency: 'EUR' 
            })}
          </p>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Factures en retard</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFactures}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Retard moyen</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgDaysLate} jours
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Euro className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Montant moyen</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.totalCreances / (stats.totalFactures || 1)).toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Affichage du graphique barres après les stats */}
      <div className="card flex justify-center my-6" style={{ maxWidth: 500, margin: '0 auto' }}>
        <Bar data={barData} options={barOptions} height={180} />
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une créance..."
                className="w-full pl-10 input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 input-field"
              >
                <option value="all">Toutes</option>
                <option value="overdue">En retard</option>
                <option value="upcoming">À venir</option>
                <option value="unpaid">Non soldées</option>
              </select>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="input-field">
                <option value="all">Tous les clients</option>
                {Array.from(
                  new Set(
                    creances
                      .map(c => c.client && c.client._id)
                      .filter(id => !!id)
                  )
                ).map(id => {
                  const client = creances.find(c => c.client && c.client._id === id)?.client;
                  return client ? (
                    <option key={String(id)} value={id}>
                      {client.entreprise || `${client.prenom} ${client.nom}`}
                    </option>
                  ) : null;
                })}
              </select>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)} className="w-full pl-10 input-field">
                <option value="all">Tous les statuts</option>
                <option value="en retard">En retard</option>
                <option value="partielle">Partielle</option>
                <option value="réglée">Réglée</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des créances */}
      <div className="card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Facture</TableHeaderCell>
              <TableHeaderCell>Client</TableHeaderCell>
              <TableHeaderCell>Date échéance</TableHeaderCell>
              <TableHeaderCell>Retard</TableHeaderCell>
              <TableHeaderCell>Montant TTC</TableHeaderCell>
              <TableHeaderCell>Reste à payer</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(filteredCreances) ? filteredCreances : []).map((creance, index) => {
              const daysLate = calculateDaysLate(creance.dateEcheance);
              return (
                <TableRow key={creance.id || (creance as any)._id || `creance-${index}`}>
                  <TableCell>
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                      <span className="font-medium text-gray-900">
                        {creance.numero}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {creance.client?.entreprise || `${creance.client?.prenom || ''} ${creance.client?.nom || ''}`}
                      </p>
                      <p className="text-sm text-gray-500">{creance.client?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-red-600 font-medium">
                      {new Date(creance.dateEcheance).toLocaleDateString('fr-FR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="danger">
                      {daysLate} jour{daysLate > 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-red-600">
                      {(creance.montantTTC || 0).toLocaleString('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-blue-600">
                      {formatMontantCurrency(getResteAPayer(creance))}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatut(creance) === 'en retard' && <Badge variant="danger">En retard</Badge>}
                    {getStatut(creance) === 'partielle' && <Badge variant="warning">Partielle</Badge>}
                    {getStatut(creance) === 'réglée' && <Badge variant="success">Réglée</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCreance(creance);
                          setShowDetailModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Voir les détails"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                      
                      {creance.id && (
                        <button
                          onClick={() => prepareRelanceMessage(creance)}
                          disabled={actionLoading}
                          className="p-1 text-orange-600 hover:bg-orange-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Envoyer une relance"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      )}

                      <a
                        href={`tel:${creance.client?.telephone}`}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Appeler le client"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {(Array.isArray(filteredCreances) ? filteredCreances : []).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune créance trouvée</p>
          </div>
        )}
      </div>

      {/* Modal détails créance */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails de la créance"
        size="lg"
      >
        {selectedCreance && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de facture
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{selectedCreance.numero}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedCreance.client?.entreprise || `${selectedCreance.client?.prenom || ''} ${selectedCreance.client?.nom || ''}`}
                  </p>
                  <p className="text-sm text-gray-500">{selectedCreance.client?.email}</p>
                  <p className="text-sm text-gray-500">{selectedCreance.client?.telephone}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'échéance
                  </label>
                  <p className="text-sm text-red-600 font-medium">
                    {new Date(selectedCreance.dateEcheance).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retard
                  </label>
                  <Badge variant="danger">
                    {calculateDaysLate(selectedCreance.dateEcheance)} jour(s)
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant dû
                  </label>
                  <p className="text-lg font-semibold text-red-600">
                    {(selectedCreance.montantTTC || 0).toLocaleString('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {selectedCreance.id && (
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    prepareRelanceMessage(selectedCreance);
                  }}
                  disabled={actionLoading}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer une relance
                </button>
              )}
              <a
                href={`tel:${selectedCreance.client?.telephone}`}
                className="btn-primary"
              >
                <Phone className="w-4 h-4 mr-2" />
                Appeler le client
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal relance */}
      <Modal
        isOpen={showRelanceModal}
        onClose={() => setShowRelanceModal(false)}
        title="Envoyer une relance"
        size="lg"
      >
        {selectedCreance && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">
                Relance pour la facture {selectedCreance.numero}
              </h3>
              <p className="text-sm text-yellow-700">
                Client: {selectedCreance.client?.entreprise || `${selectedCreance.client?.prenom || ''} ${selectedCreance.client?.nom || ''}`}
              </p>
              <p className="text-sm text-yellow-700">
                Montant: {(selectedCreance.montantTTC || 0).toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR' 
                })}
              </p>
              <p className="text-sm text-yellow-700">
                Retard: {calculateDaysLate(selectedCreance.dateEcheance)} jour(s)
              </p>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message de relance
              </label>
              <textarea
                id="message"
                rows={6}
                className="input-field"
                value={relanceMessage}
                onChange={(e) => setRelanceMessage(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRelanceModal(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => selectedCreance.id && handleSendReminder(selectedCreance.id)}
                disabled={!relanceMessage.trim() || actionLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Envoyer la relance
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CreancesListPage;