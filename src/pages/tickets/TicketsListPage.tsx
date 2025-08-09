import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Send
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Ticket, TicketReponse } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ticketsAPI } from '../../services/api';

const TicketsListPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [priorityFilter, setPriorityFilter] = useState<string>('tous');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [response, setResponse] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getAll();
      setTickets(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await ticketsAPI.updateStatus(ticketId, newStatus);
      setTickets(prev => (Array.isArray(prev) ? prev : []).map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, statut: newStatus as any, dateMAJ: new Date().toISOString() }
          : ticket
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !response.trim()) return;

    try {
      // Send reply to ticket
      const replyResponse = await ticketsAPI.reply(selectedTicket.id, response);
      
      if (replyResponse.data.success) {
        // Update local state
        setTickets(prev => (Array.isArray(prev) ? prev : []).map(ticket => 
          ticket.id === selectedTicket.id 
            ? { 
                ...ticket, 
                statut: replyResponse.data.statut, 
                dateMAJ: replyResponse.data.dateMAJ,
                reponses: replyResponse.data.reponses
              }
            : ticket
        ));
        
        setResponse('');
        setShowDetailModal(false);
      } else {
        throw new Error(replyResponse.data.message || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error);
    }
  };

  const filteredTickets = (Array.isArray(tickets) ? tickets : []).filter(ticket => {
    const matchesSearch = ticket.sujet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.agence?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'tous' || ticket.statut === statusFilter;
    const matchesPriority = priorityFilter === 'tous' || ticket.priorite === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'ferme':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'en_cours':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'urgente':
        return 'text-red-600 bg-red-100';
      case 'haute':
        return 'text-orange-600 bg-orange-100';
      case 'normale':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Support Tickets</h1>
          <p className="text-gray-600">Gérer les demandes de support des agences</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Ticket
        </button>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total tickets</p>
              <p className="text-2xl font-bold text-gray-900">{(Array.isArray(tickets) ? tickets : []).length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ouverts</p>
              <p className="text-2xl font-bold text-gray-900">
                {(Array.isArray(tickets) ? tickets : []).filter(t => t.statut === 'ouvert').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">
                {(Array.isArray(tickets) ? tickets : []).filter(t => t.statut === 'en_cours').length}
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
              <p className="text-sm font-medium text-gray-600">Fermés</p>
              <p className="text-2xl font-bold text-gray-900">
                {(Array.isArray(tickets) ? tickets : []).filter(t => t.statut === 'ferme').length}
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
                placeholder="Rechercher un ticket..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="tous">Tous les statuts</option>
              <option value="ouvert">Ouvert</option>
              <option value="en_cours">En cours</option>
              <option value="ferme">Fermé</option>
            </select>
            <select
              className="input-field w-auto"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="tous">Toutes priorités</option>
              <option value="faible">Faible</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des tickets */}
      <div className="card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Ticket</TableHeaderCell>
              <TableHeaderCell>Agence</TableHeaderCell>
              <TableHeaderCell>Priorité</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Date création</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(filteredTickets) ? filteredTickets : []).map((ticket, index) => (
              <TableRow key={ticket.id || (ticket as any)._id || `ticket-${index}`}>
                <TableCell>
                  <div className="flex items-start">
                    {getStatusIcon(ticket.statut)}
                    <div className="ml-2">
                      <p className="font-medium text-gray-900">{ticket.sujet}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{ticket.agence?.nom}</p>
                      <p className="text-sm text-gray-500">{ticket.agence?.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priorite)}`}>
                    {(typeof ticket.priorite === 'string' && ticket.priorite.length > 0) 
                      ? ticket.priorite.charAt(0).toUpperCase() + ticket.priorite.slice(1)
                      : 'Normal'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      ticket.statut === 'ferme' ? 'success' :
                      ticket.statut === 'en_cours' ? 'info' : 'warning'
                    }
                  >
                    {ticket.statut === 'ferme' ? 'Fermé' :
                     ticket.statut === 'en_cours' ? 'En cours' : 'Ouvert'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(ticket.dateCreation).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setShowDetailModal(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Voir les détails"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    
                    {ticket.statut === 'ouvert' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'en_cours')}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Prendre en charge"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}

                    {ticket.statut !== 'ferme' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'ferme')}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Fermer le ticket"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(Array.isArray(filteredTickets) ? filteredTickets : []).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun ticket trouvé</p>
          </div>
        )}
      </div>

      {/* Modal détails ticket */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails du ticket"
        size="xl"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sujet
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{selectedTicket.sujet}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agence
                  </label>
                  <p className="text-sm text-gray-900">{selectedTicket.agence?.nom}</p>
                  <p className="text-sm text-gray-500">{selectedTicket.agence?.email}</p>
                  <p className="text-sm text-gray-500">{selectedTicket.agence?.telephone}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorité
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priorite)}`}>
                    {(typeof selectedTicket.priorite === 'string' && selectedTicket.priorite.length > 0) 
                      ? selectedTicket.priorite.charAt(0).toUpperCase() + selectedTicket.priorite.slice(1)
                      : 'Normal'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <Badge 
                    variant={
                      selectedTicket.statut === 'ferme' ? 'success' :
                      selectedTicket.statut === 'en_cours' ? 'info' : 'warning'
                    }
                  >
                    {selectedTicket.statut === 'ferme' ? 'Fermé' :
                     selectedTicket.statut === 'en_cours' ? 'En cours' : 'Ouvert'}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de création
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedTicket.dateCreation).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dernière mise à jour
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedTicket.dateMAJ).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>
            </div>

            {/* Réponses */}
            {selectedTicket.reponses && (selectedTicket.reponses || []).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversation
                </label>
                <div className="space-y-4">
                  {(selectedTicket.reponses || []).map((reponse, index) => (
                    <div key={index} 
                      className={`p-4 rounded-lg ${
                        reponse.userRole === 'superadmin' 
                          ? 'bg-blue-50 ml-8' 
                          : 'bg-gray-50 mr-8'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-900">{reponse.userName}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(reponse.date).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{reponse.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTicket.statut !== 'ferme' && (
              <div>
                <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
                  Réponse
                </label>
                <textarea
                  id="response"
                  rows={4}
                  className="input-field"
                  placeholder="Tapez votre réponse..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              {selectedTicket.statut === 'ouvert' && (
                <button
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'en_cours')}
                  className="btn-secondary"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Prendre en charge
                </button>
              )}
              
              {selectedTicket.statut !== 'ferme' && (
                <>
                  <button
                    onClick={handleSendResponse}
                    disabled={!response.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer la réponse
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'ferme')}
                    className="btn-secondary"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Fermer le ticket
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TicketsListPage;