import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare,
  TrendingUp,
  Clock,
  Star,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Euro,
  Download,
  Upload,
  FileText
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ViewToggle from '../../components/ui/ViewToggle';
import GridView from '../../components/ui/GridView';
import Card from '../../components/ui/Card';
import SearchFilter from '../../components/ui/SearchFilter';
import StatCard from '../../components/ui/StatCard';
import { crmAPI } from '../../services/api';
import { clientsAPI } from '../../services/api';
import { Client } from '../../types';

interface Contact {
  id: string;
  nom: string;
  prenom: string;
  entreprise?: string;
  email: string;
  telephone: string;
  statut: 'prospect' | 'client' | 'ancien_client';
  source: 'site_web' | 'recommandation' | 'publicite' | 'salon' | 'autre';
  score?: number; // Score optionnel (1-5)
  derniereInteraction: string;
  prochainRappel?: string;
  notes: string;
  interactions: Interaction[];
  dateCreation: string;
  isClient?: boolean; // Ajout de cette propriété pour distinguer les clients des contacts CRM
}

interface Interaction {
  id: string;
  type: 'appel' | 'email' | 'rencontre' | 'devis' | 'vente';
  date: string;
  description: string;
  resultat?: 'positif' | 'neutre' | 'negatif';
}

const CrmPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'table' | 'grid' | 'list'>('table');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [creatingContact, setCreatingContact] = useState(false);
  const [newContact, setNewContact] = useState({
    prenom: '',
    nom: '',
    entreprise: '',
    email: '',
    telephone: '',
    statut: 'prospect' as const,
    source: 'site_web' as const,
    notes: ''
  });

  const filterOptions = [
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'client', label: 'Client' },
        { value: 'prospect', label: 'Prospect' },
        { value: 'ancien_client', label: 'Ancien client' }
      ]
    },
    {
      id: 'type',
      label: 'Type',
      options: [
        { value: 'particulier', label: 'Particulier' },
        { value: 'entreprise', label: 'Entreprise' }
      ]
    },
    {
      id: 'solde',
      label: 'Solde',
      options: [
        { value: 'positif', label: 'Solde positif' },
        { value: 'negatif', label: 'Solde négatif' },
        { value: 'nul', label: 'Solde nul' }
      ]
    }
  ];

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      
      // Récupérer les clients existants
      const clientsResponse = await clientsAPI.getAll();
      const clientsData = clientsResponse.data?.data || clientsResponse.data || [];
      
      // Récupérer les contacts CRM
      let crmContacts = [];
      try {
        const crmResponse = await crmAPI.getAll();
        crmContacts = crmResponse.data?.data || crmResponse.data || [];
        
        // Ajouter les propriétés manquantes aux contacts CRM
        crmContacts = crmContacts.map((contact: any) => ({
          ...contact,
          id: contact._id || contact.id, // Utiliser _id si disponible
          dateCreation: contact.createdAt || contact.dateCreation || new Date().toISOString(),
          derniereInteraction: contact.derniereInteraction || contact.createdAt || new Date().toISOString(),
          interactions: contact.interactions || [
            {
              id: `interaction-${contact._id || contact.id}`,
              type: 'rencontre',
              date: contact.createdAt || new Date().toISOString(),
              description: 'Premier contact - création du prospect',
              resultat: 'positif'
            }
          ],
          isClient: false // Marquer comme contact CRM
        }));
      } catch (error) {
        console.log('API CRM non disponible, utilisation des contacts locaux uniquement');
      }
      
      // Convertir les clients en contacts CRM pour l'affichage
      const clientsAsContacts = (Array.isArray(clientsData) ? clientsData : []).map((client: Client) => {
        // Gérer les dates de manière sécurisée
        const dateCreation = client.dateCreation ? new Date(client.dateCreation) : new Date();
        const derniereInteraction = client.dateCreation ? new Date(client.dateCreation) : new Date();
        
        return {
          id: client.id,
          nom: client.nom,
          prenom: client.prenom || '',
          entreprise: client.entreprise,
          email: client.email,
          telephone: client.telephone,
          statut: 'client' as const, // Tous les clients existants sont des clients
          source: 'site_web' as const, // Valeur par défaut
          score: client.solde > 0 ? 5 : client.solde === 0 ? 3 : 2, // Score basé sur le solde
          derniereInteraction: derniereInteraction.toISOString(), // Utiliser la date de création comme dernière interaction
          prochainRappel: undefined, // Pas de rappel par défaut
          notes: `Client créé le ${dateCreation.toLocaleDateString('fr-FR')}`,
          interactions: [
            {
              id: `interaction-${client.id}`,
              type: 'rencontre' as const,
              date: dateCreation.toISOString(),
              description: 'Premier contact - création du client',
              resultat: 'positif' as const
            }
          ],
          dateCreation: dateCreation.toISOString(),
          isClient: true // Marquer comme client existant
        };
      });
      
      // Combiner les clients et les contacts CRM
      const allContacts = [...clientsAsContacts, ...crmContacts];
      setContacts(allContacts);
    } catch (error: any) {
      console.error('Erreur lors du chargement des contacts CRM:', error);
      // En cas d'erreur, initialiser avec un tableau vide
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const filteredContacts = (Array.isArray(contacts) ? contacts : []).filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      contact.nom.toLowerCase().includes(searchLower) ||
      contact.prenom.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      (contact.entreprise && contact.entreprise.toLowerCase().includes(searchLower))
    );

    const statutFilter = activeFilters.statut;
    const typeFilter = activeFilters.type;
    const soldeFilter = activeFilters.solde;

    const matchesStatut = !statutFilter || statutFilter === 'tous' || contact.statut === statutFilter;
    const matchesType = !typeFilter || typeFilter === 'tous' || 
      (typeFilter === 'entreprise' ? !!contact.entreprise : !contact.entreprise);
    
    // Calculer le solde basé sur le score (approximation)
    const soldeApproximatif = (contact.score || 0) >= 4 ? 100 : (contact.score || 0) >= 3 ? 0 : -50;
    const matchesSolde = !soldeFilter || soldeFilter === 'tous' || 
      (soldeFilter === 'positif' ? soldeApproximatif > 0 :
       soldeFilter === 'negatif' ? soldeApproximatif < 0 :
       soldeFilter === 'nul' ? soldeApproximatif === 0 : true);

    return matchesSearch && matchesStatut && matchesType && matchesSolde;
  });

  const stats = {
    totalContacts: (Array.isArray(contacts) ? contacts : []).length,
    prospects: (Array.isArray(contacts) ? contacts : []).filter(c => c.statut === 'prospect').length,
    clients: (Array.isArray(contacts) ? contacts : []).filter(c => c.isClient).length,
    contactsCRM: (Array.isArray(contacts) ? contacts : []).filter(c => !c.isClient).length,
    particuliers: (Array.isArray(contacts) ? contacts : []).filter(c => !c.entreprise).length,
    entreprises: (Array.isArray(contacts) ? contacts : []).filter(c => !!c.entreprise).length,
    rappelsAujourdhui: (Array.isArray(contacts) ? contacts : []).filter(c => 
      c.prochainRappel && 
      new Date(c.prochainRappel).toDateString() === new Date().toDateString()
    ).length
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'client': return 'success';
      case 'prospect': return 'warning';
      case 'ancien_client': return 'default';
      default: return 'default';
    }
  };

  const renderStars = (score: number, contactId?: string, isClickable: boolean = false, isClient: boolean = false) => {
    const handleStarClick = async (starValue: number) => {
      console.log('⭐ Clic sur étoile:', { starValue, contactId, isClickable, isClient });
      
      // Seuls les contacts CRM (pas les clients) peuvent avoir leur score modifié
      if (contactId && isClickable && !isClient) {
        try {
          console.log('🔄 Mise à jour du score pour le contact CRM:', contactId);
          
          // Mettre à jour localement d'abord pour une réponse immédiate
          setContacts(prev => prev.map(c => 
            c.id === contactId ? { ...c, score: starValue } : c
          ));
          
          // Mettre à jour en base de données
          await crmAPI.updateScore(contactId, starValue);
          console.log('✅ Score mis à jour avec succès');
        } catch (error) {
          console.error('❌ Erreur lors de la mise à jour du score:', error);
          // En cas d'erreur, remettre l'ancien score
          setContacts(prev => prev.map(c => 
            c.id === contactId ? { ...c, score: score } : c
          ));
        }
      } else {
        console.log('🚫 Score non modifiable:', { contactId, isClickable, isClient });
      }
    };

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star, index) => (
          <Star
            key={star}
            className={`w-4 h-4 ${isClickable && !isClient ? 'cursor-pointer hover:text-yellow-300' : ''} ${
              star <= score ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
            onClick={() => handleStarClick(star)}
          />
        ))}
      </div>
    );
  };

  const renderContactCard = (contact: Contact) => (
    <Card key={contact.id} hover className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            {contact.entreprise ? (
              <Building2 className="w-6 h-6 text-blue-600" />
            ) : (
              <Users className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {contact.entreprise || `${contact.prenom} ${contact.nom}`}
            </h3>
            {contact.entreprise && (
              <p className="text-sm text-gray-600">{contact.entreprise}</p>
            )}
            <Badge variant={contact.entreprise ? 'warning' : 'default'} size="sm" className="mt-1">
              {contact.entreprise ? 'Entreprise' : 'Particulier'}
            </Badge>
            {contact.isClient && (
              <Badge variant="success" size="sm" className="mt-1 ml-1">
                Client
              </Badge>
            )}
          </div>
        </div>
        {renderStars(contact.score || 0, contact.id, true, contact.isClient)}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-2" />
          {contact.email}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="w-4 h-4 mr-2" />
          {contact.telephone}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          Créé le: {contact.dateCreation ? new Date(contact.dateCreation).toLocaleDateString('fr-FR') : 'Date inconnue'}
        </div>
      </div>

      {contact.notes && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">{contact.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Score: {contact.score || 'N/A'}/5
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedContact(contact);
              setShowDetailModal(true);
            }}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleCreateContact = async () => {
    try {
      setCreatingContact(true);
      
      // Validation des champs obligatoires
      if (!newContact.prenom || !newContact.nom || !newContact.email || !newContact.telephone) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }
      
      // Créer le contact CRM via l'API
      const contactData = {
        prenom: newContact.prenom,
        nom: newContact.nom,
        entreprise: newContact.entreprise || undefined,
        email: newContact.email,
        telephone: newContact.telephone,
        statut: newContact.statut,
        source: newContact.source,
        score: undefined, // Score vide par défaut
        notes: newContact.notes || ''
      };
      
      await crmAPI.create(contactData);
      
      // Recharger la liste des contacts
      await fetchContacts();
      
      // Fermer le modal et réinitialiser le formulaire
      setShowAddModal(false);
      setNewContact({
        prenom: '',
        nom: '',
        entreprise: '',
        email: '',
        telephone: '',
        statut: 'prospect',
        source: 'site_web',
        notes: ''
      });
      
      alert('Contact CRM créé avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de la création du contact:', error);
      alert(`Erreur lors de la création du contact: ${error.response?.data?.message || error.message}`);
    } finally {
      setCreatingContact(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">CRM - Gestion des Contacts</h1>
          <p className="text-gray-600">Gérer vos prospects et relations clients</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Contact
        </button>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total contacts"
          value={stats.totalContacts}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Clients"
          value={stats.clients}
          icon={Star}
          color="green"
        />
        <StatCard
          title="Contacts CRM"
          value={stats.contactsCRM}
          icon={MessageSquare}
          color="purple"
        />
        <StatCard
          title="Entreprises"
          value={stats.entreprises}
          icon={Building2}
          color="yellow"
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
        placeholder="Rechercher un contact..."
      />

      {/* Contrôles de vue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {(Array.isArray(filteredContacts) ? filteredContacts : []).length} contact{(Array.isArray(filteredContacts) ? filteredContacts : []).length > 1 ? 's' : ''} trouvé{(Array.isArray(filteredContacts) ? filteredContacts : []).length > 1 ? 's' : ''}
          </span>
        </div>
        <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Contenu principal */}
      {currentView === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow key="header">
                <TableHeaderCell>Contact</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Score</TableHeaderCell>
                <TableHeaderCell>Date création</TableHeaderCell>
                <TableHeaderCell>Solde</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(filteredContacts) ? filteredContacts : []).map((contact, index) => (
                <TableRow key={contact.id || `contact-${index}`}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        {contact.entreprise ? (
                          <Building2 className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Users className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {contact.entreprise || `${contact.prenom} ${contact.nom}`}
                        </p>
                        {contact.entreprise && (
                          <p className="text-sm text-gray-500">{contact.entreprise}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{contact.email}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.entreprise ? 'warning' : 'default'}>
                      {contact.entreprise ? 'Entreprise' : 'Particulier'}
                    </Badge>
                    {contact.isClient && (
                      <Badge variant="success" size="sm" className="ml-1">
                        Client
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {renderStars(contact.score || 0, contact.id, true, contact.isClient)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-gray-900">
                        {contact.dateCreation ? new Date(contact.dateCreation).toLocaleDateString('fr-FR') : 'Date inconnue'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {contact.interactions[0]?.type || 'Aucune interaction'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        (contact.score || 0) >= 4 ? 'success' :
                        (contact.score || 0) >= 3 ? 'default' : 'danger'
                      }
                    >
                      {(contact.score || 0) >= 4 ? 'Excellent' :
                       (contact.score || 0) >= 3 ? 'Bon' : 'À améliorer'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedContact(contact);
                          setShowDetailModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Appeler"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                        title="Envoyer un email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {currentView === 'grid' && (
        <GridView columns={3}>
          {(Array.isArray(filteredContacts) ? filteredContacts : []).map(renderContactCard)}
        </GridView>
      )}

      {/* Modal détails contact */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails du contact"
        size="xl"
      >
        {selectedContact && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedContact.prenom} {selectedContact.nom}
                  </p>
                  {selectedContact.entreprise && (
                    <p className="text-sm text-gray-600">{selectedContact.entreprise}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact
                  </label>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedContact.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-900">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedContact.telephone}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <Badge variant={getStatutColor(selectedContact.statut)}>
                    {selectedContact.statut === 'client' ? 'Client' :
                     selectedContact.statut === 'prospect' ? 'Prospect' : 'Ancien client'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Score
                  </label>
                  {renderStars(selectedContact.score || 0, selectedContact.id, true, selectedContact.isClient)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <Badge variant={selectedContact.entreprise ? 'warning' : 'default'}>
                    {selectedContact.entreprise ? 'Entreprise' : 'Particulier'}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de création
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedContact.dateCreation ? new Date(selectedContact.dateCreation).toLocaleDateString('fr-FR') : 'Date inconnue'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Évaluation
                  </label>
                  <Badge 
                    variant={
                      (selectedContact.score || 0) >= 4 ? 'success' :
                      (selectedContact.score || 0) >= 3 ? 'default' : 'danger'
                    }
                  >
                    {(selectedContact.score || 0) >= 4 ? 'Excellent' :
                     (selectedContact.score || 0) >= 3 ? 'Bon' : 'À améliorer'}
                  </Badge>
                </div>
              </div>
            </div>

            {selectedContact.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900">{selectedContact.notes}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Historique des interactions
              </label>
              <div className="space-y-3">
                {(selectedContact.interactions || []).map((interaction, index) => (
                  <div key={interaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {interaction.type === 'appel' && <Phone className="w-4 h-4 text-green-600 mr-2" />}
                        {interaction.type === 'email' && <Mail className="w-4 h-4 text-blue-600 mr-2" />}
                        {interaction.type === 'rencontre' && <Users className="w-4 h-4 text-purple-600 mr-2" />}
                        {interaction.type === 'devis' && <FileText className="w-4 h-4 text-orange-600 mr-2" />}
                        {interaction.type === 'vente' && <TrendingUp className="w-4 h-4 text-green-600 mr-2" />}
                        <span className="font-medium text-gray-900 capitalize">{interaction.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {interaction.resultat && (
                          <Badge 
                            variant={
                              interaction.resultat === 'positif' ? 'success' :
                              interaction.resultat === 'negatif' ? 'danger' : 'default'
                            }
                            size="sm"
                          >
                            {interaction.resultat}
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500">
                          {new Date(interaction.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{interaction.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button className="btn-secondary">
                <Phone className="w-4 h-4 mr-2" />
                Appeler
              </button>
              <button className="btn-secondary">
                <Mail className="w-4 h-4 mr-2" />
                Envoyer un email
              </button>
              <button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle interaction
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal ajout contact */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nouveau contact"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={newContact.prenom}
                onChange={(e) => setNewContact(prev => ({ ...prev, prenom: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={newContact.nom}
                onChange={(e) => setNewContact(prev => ({ ...prev, nom: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entreprise
            </label>
            <input 
              type="text" 
              className="input-field" 
              value={newContact.entreprise}
              onChange={(e) => setNewContact(prev => ({ ...prev, entreprise: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input 
                type="email" 
                className="input-field" 
                value={newContact.email}
                onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input 
                type="tel" 
                className="input-field" 
                value={newContact.telephone}
                onChange={(e) => setNewContact(prev => ({ ...prev, telephone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut *
              </label>
              <select 
                className="input-field"
                value={newContact.statut}
                onChange={(e) => setNewContact(prev => ({ ...prev, statut: e.target.value as any }))}
              >
                <option value="prospect">Prospect</option>
                <option value="client">Client</option>
                <option value="ancien_client">Ancien client</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source *
              </label>
              <select 
                className="input-field"
                value={newContact.source}
                onChange={(e) => setNewContact(prev => ({ ...prev, source: e.target.value as any }))}
              >
                <option value="site_web">Site web</option>
                <option value="recommandation">Recommandation</option>
                <option value="publicite">Publicité</option>
                <option value="salon">Salon</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea 
              className="input-field" 
              rows={3}
              value={newContact.notes}
              onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowAddModal(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button 
              onClick={handleCreateContact}
              disabled={creatingContact}
              className="btn-primary"
            >
              {creatingContact ? 'Création...' : 'Créer le contact'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CrmPage;