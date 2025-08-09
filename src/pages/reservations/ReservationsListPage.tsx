import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  CheckSquare
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';
import Card from '../../components/ui/Card';

interface Reservation {
  _id: string;
  packageId: {
    _id: string;
    nom: string;
    prix: number;
    duree: string;
    pays: string;
    image?: string;
  };
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  nombrePlaces: number;
  commentaire?: string;
  statut: 'en_attente' | 'confirmee' | 'annulee' | 'terminee';
  dateReservation: string;
  dateConfirmation?: string;
  montantTotal: number;
  notesInterne?: string;
  source: 'vitrine_public' | 'admin' | 'autre';
}

const ReservationsListPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    fetchReservations();
    fetchStats();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reservations');
      if (response.data && response.data.success) {
        setReservations(response.data.data || []);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/reservations/stats');
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleStatusUpdate = async (reservationId: string, newStatus: string, notesInterne?: string) => {
    setActionLoading(true);
    try {
      const response = await axios.put(`/api/reservations/${reservationId}/status`, {
        statut: newStatus,
        notesInterne
      });
      
      if (response.data.success) {
        await fetchReservations();
        await fetchStats();
        alert('Statut mis à jour avec succès');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (reservationId: string) => {
    setActionLoading(true);
    try {
      const response = await axios.delete(`/api/reservations/${reservationId}`);
      
      if (response.data.success) {
        await fetchReservations();
        await fetchStats();
        setShowDeleteModal(false);
        setSelectedReservation(null);
        alert('Réservation supprimée avec succès');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const statusConfig = {
      en_attente: { variant: 'warning' as const, icon: Clock, text: 'En attente' },
      confirmee: { variant: 'success' as const, icon: CheckCircle, text: 'Confirmée' },
      annulee: { variant: 'danger' as const, icon: XCircle, text: 'Annulée' },
      terminee: { variant: 'default' as const, icon: CheckSquare, text: 'Terminée' }
    };
    
    const config = statusConfig[statut as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const filteredReservations = reservations.filter(reservation => {
    const searchLower = searchTerm.toLowerCase();
    return (
      reservation.nom.toLowerCase().includes(searchLower) ||
      reservation.prenom.toLowerCase().includes(searchLower) ||
      reservation.telephone.includes(searchLower) ||
      reservation.packageId.nom.toLowerCase().includes(searchLower)
    );
  });

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
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Gestion des Réservations</h1>
          <p className="text-gray-600">Suivre et gérer toutes vos réservations</p>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total réservations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReservations}</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.stats.find((s: any) => s._id === 'confirmee')?.count || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.stats.find((s: any) => s._id === 'en_attente')?.count || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalMontant.toLocaleString('fr-FR')} DZD
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une réservation..."
                className="w-full pl-10 input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Liste des réservations */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Package</TableHeaderCell>
                <TableHeaderCell>Places</TableHeaderCell>
                <TableHeaderCell>Montant</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Statut</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => (
                <TableRow key={reservation._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{reservation.nom} {reservation.prenom}</div>
                      <div className="text-sm text-gray-500">{reservation.telephone}</div>
                      {reservation.email && (
                        <div className="text-sm text-gray-500">{reservation.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{reservation.packageId.nom}</div>
                      <div className="text-sm text-gray-500">{reservation.packageId.pays}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-gray-400" />
                      {reservation.nombrePlaces}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {reservation.montantTotal.toLocaleString('fr-FR')} DZD
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(reservation.dateReservation).toLocaleDateString('fr-FR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(reservation.statut)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setShowDetailModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {hasPermission('reservations', 'modifier') && (
                        <button
                          onClick={() => {
                            const newStatus = reservation.statut === 'en_attente' ? 'confirmee' : 'en_attente';
                            handleStatusUpdate(reservation._id, newStatus);
                          }}
                          disabled={actionLoading}
                          className={`p-2 rounded-full ${
                            reservation.statut === 'en_attente' 
                              ? 'text-green-600 hover:bg-green-100' 
                              : 'text-yellow-600 hover:bg-yellow-100'
                          }`}
                          title={reservation.statut === 'en_attente' ? 'Confirmer' : 'Remettre en attente'}
                        >
                          {reservation.statut === 'en_attente' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </button>
                      )}

                      {hasPermission('reservations', 'supprimer') && (
                        <button
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredReservations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune réservation trouvée</p>
          </div>
        )}
      </Card>

      {/* Modal détails réservation */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails de la réservation"
        size="lg"
      >
        {selectedReservation && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedReservation.nom} {selectedReservation.prenom}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <p className="text-gray-900">{selectedReservation.telephone}</p>
                </div>
                {selectedReservation.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{selectedReservation.email}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{selectedReservation.packageId.nom}</p>
                  <p className="text-gray-600">{selectedReservation.packageId.pays} - {selectedReservation.packageId.duree}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de places
                  </label>
                  <p className="text-gray-900">{selectedReservation.nombrePlaces}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant total
                  </label>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedReservation.montantTotal.toLocaleString('fr-FR')} DZD
                  </p>
                </div>
              </div>
            </div>

            {selectedReservation.commentaire && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire du client
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReservation.commentaire}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedReservation.statut)}
                <span className="text-sm text-gray-500">
                  Réservé le {new Date(selectedReservation.dateReservation).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {selectedReservation.statut === 'en_attente' && (
                <button
                  onClick={() => handleStatusUpdate(selectedReservation._id, 'confirmee')}
                  disabled={actionLoading}
                  className="btn-primary"
                >
                  {actionLoading ? <LoadingSpinner size="sm" className="mr-2" /> : 'Confirmer la réservation'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
      >
        {selectedReservation && (
          <div>
            <p>
              Êtes-vous sûr de vouloir supprimer la réservation de 
              <strong> "{selectedReservation.nom} {selectedReservation.prenom}"</strong> ? 
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(selectedReservation._id)}
                disabled={actionLoading}
                className="btn-danger"
              >
                {actionLoading ? <LoadingSpinner size="sm" /> : 'Supprimer'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReservationsListPage;