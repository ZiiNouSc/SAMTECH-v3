import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Euro,
  FileText,
  Plus,
  Eye,
  RotateCcw,
  XCircle,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  User
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Client, Facture, PreFacture } from '../../types';
import { clientsAPI, facturesAPI, preFactureAPI, caisseAPI } from '../../services/api';
import { formatMontantCurrency } from '../../utils/formatters';

const ClientDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [bonsCommande, setBonsCommande] = useState<PreFacture[]>([]);
  const [operationsCaisse, setOperationsCaisse] = useState<any[]>([]);
  const [historique, setHistorique] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('infos');

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch client data
      const clientResponse = await clientsAPI.getById(id!);
      setClient(clientResponse.data.data);
      
      // Fetch factures
      const facturesResponse = await facturesAPI.getAll();
      const clientFactures = (facturesResponse.data.data || []).filter(
        (facture: any) => {
          // Gérer les différents formats d'ID
          const factureClientId = facture.clientId?._id || facture.clientId?.id || facture.clientId;
          const clientIdStr = id;
          return factureClientId?.toString() === clientIdStr?.toString();
        }
      );
      setFactures(clientFactures);
      
      // Fetch bons de commande
      const bonsCommandeResponse = await preFactureAPI.getAll();
      const clientBonsCommande = (bonsCommandeResponse.data.data || []).filter(
        (bon: any) => {
          // Gérer les différents formats d'ID
          const bonClientId = bon.clientId?._id || bon.clientId?.id || bon.clientId;
          const clientIdStr = id;
          return bonClientId?.toString() === clientIdStr?.toString();
        }
      );
      setBonsCommande(clientBonsCommande);

      // Fetch operations de caisse liées au client
      try {
        const operationsResponse = await caisseAPI.getOperations({ clientId: id, limit: 100 });
        if (operationsResponse.data.success) {
          setOperationsCaisse(operationsResponse.data.data.operations || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des opérations de caisse:', error);
        setOperationsCaisse([]);
      }

      // Fetch historique complet du client
      try {
        const historiqueResponse = await clientsAPI.getHistory(id!);
        if (historiqueResponse.data.success) {
          setHistorique(historiqueResponse.data.data.historique || []);
          setStats(historiqueResponse.data.data.stats || {});
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
        setHistorique([]);
        setStats({});
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des données client:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'infos', label: 'Informations', count: null },
    { id: 'factures', label: 'Factures', count: (Array.isArray(factures) ? factures : []).length },
    { id: 'pre-factures', label: 'Devis', count: (Array.isArray(bonsCommande) ? bonsCommande : []).length },
    { id: 'historique', label: 'Historique', count: historique.length }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Client non trouvé</p>
        <button
          onClick={() => navigate('/clients')}
          className="btn-primary mt-4"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'infos':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {client.entreprise || `${client.prenom} ${client.nom}`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de client
                  </label>
                  <Badge 
                    variant={
                      client.typeClient === 'entreprise' ? 'info' :
                      client.typeClient === 'partenaire' ? 'warning' : 'default'
                    }
                  >
                    {client.typeClient === 'particulier' ? 'Particulier' :
                     client.typeClient === 'entreprise' ? 'Entreprise' : 'Partenaire'}
                  </Badge>
                </div>

                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <a href={`mailto:${client.email}`} className="text-blue-600 hover:text-blue-700">
                      {client.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <a href={`tel:${client.telephone}`} className="text-blue-600 hover:text-blue-700">
                      {client.telephone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adresse</label>
                    <p className="text-gray-900">{client.adresse}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Euro className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Solde</label>
                    <Badge 
                      variant={
                        client.solde > 0 ? 'success' :
                        client.solde < 0 ? 'danger' : 'default'
                      }
                      size="lg"
                    >
                      {formatMontantCurrency(client.solde || 0)}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client depuis</label>
                    <p className="text-gray-900">
                      {new Date(client.dateCreation).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Actions rapides</h3>
                  <div className="space-y-3">
                    <Link
                      to={`/factures/nouveau?clientId=${client.id}`}
                      className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle facture
                    </Link>
                    <Link
                      to={`/pre-factures/nouveau?clientId=${client.id}`}
                      className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau devis
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'factures':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Factures ({(Array.isArray(factures) ? factures : []).length})
              </h3>
              <Link
                to={`/factures/nouveau?clientId=${client.id}`}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle facture
              </Link>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Numéro</TableHeaderCell>
                  <TableHeaderCell>Date émission</TableHeaderCell>
                  <TableHeaderCell>Échéance</TableHeaderCell>
                  <TableHeaderCell>Montant TTC</TableHeaderCell>
                  <TableHeaderCell>Statut</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(factures) ? factures : []).map((facture, index) => (
                  <TableRow key={facture.id || `facture-${index}`}>
                    <TableCell>
                      <span className="font-medium">{facture.numero}</span>
                    </TableCell>
                    <TableCell>
                      {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatMontantCurrency(facture.montantTTC || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          facture.statut === 'payee' ? 'success' :
                          facture.statut === 'en_retard' ? 'danger' :
                          facture.statut === 'envoyee' ? 'info' : 'default'
                        }
                      >
                        {facture.statut === 'payee' ? 'Payée' :
                         facture.statut === 'en_retard' ? 'En retard' :
                         facture.statut === 'envoyee' ? 'Envoyée' : 'Brouillon'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/factures/${facture.id}`}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Voir la facture"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {(Array.isArray(factures) ? factures : []).length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune facture pour ce client</p>
              </div>
            )}
          </div>
        );

      case 'pre-factures':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Devis ({(Array.isArray(bonsCommande) ? bonsCommande : []).length})
              </h3>
              <Link
                to={`/pre-factures/nouveau?clientId=${client.id}`}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau devis
              </Link>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Numéro</TableHeaderCell>
                  <TableHeaderCell>Date création</TableHeaderCell>
                  <TableHeaderCell>Montant TTC</TableHeaderCell>
                  <TableHeaderCell>Statut</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(bonsCommande) ? bonsCommande : []).map((bon, index) => (
                  <TableRow key={bon.id || `bon-${index}`}>
                    <TableCell>
                      <span className="font-medium">{bon.numero}</span>
                    </TableCell>
                    <TableCell>
                      {new Date(bon.dateCreation).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatMontantCurrency(bon.montantTTC || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          bon.statut === 'accepte' ? 'success' :
                          bon.statut === 'refuse' ? 'danger' :
                          bon.statut === 'envoye' ? 'info' :
                          bon.statut === 'facture' ? 'success' : 'default'
                        }
                      >
                        {bon.statut === 'accepte' ? 'Accepté' :
                         bon.statut === 'refuse' ? 'Refusé' :
                         bon.statut === 'envoye' ? 'Envoyé' :
                         bon.statut === 'facture' ? 'Facturé' : 'Brouillon'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/pre-factures/${bon.id}`}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Voir le devis"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {(Array.isArray(bonsCommande) ? bonsCommande : []).length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun devis pour ce client</p>
              </div>
            )}
          </div>
        );

      case 'historique':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Historique complet des interactions</h3>
            
            <div className="space-y-3">
              {/* Historique des factures */}
              {factures.map((facture, index) => (
                <div key={`facture-${facture.id || index}`} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-medium text-gray-900">
                    Facture {facture.numero} {facture.statut === 'payee' ? 'payée' : facture.statut === 'envoyee' ? 'envoyée' : 'créée'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(facture.dateEmission).toLocaleDateString('fr-FR')} à {new Date(facture.dateEmission).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Montant: {formatMontantCurrency(facture.montantTTC || 0)}
                    {(facture.montantPaye || 0) > 0 && (
                      <span className="ml-2">
                        (Payé: {formatMontantCurrency(facture.montantPaye || 0)})
                      </span>
                    )}
                  </p>
                </div>
              ))}

              {/* Historique des devis */}
              {bonsCommande.map((bon, index) => (
                <div key={`bon-${bon.id || index}`} className="border-l-4 border-purple-500 pl-4 py-2">
                  <p className="font-medium text-gray-900">
                    Devis {bon.numero} {bon.statut === 'accepte' ? 'accepté' : bon.statut === 'refuse' ? 'refusé' : bon.statut === 'envoye' ? 'envoyé' : bon.statut === 'facture' ? 'transformé en facture' : 'créé'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(bon.dateCreation).toLocaleDateString('fr-FR')} à {new Date(bon.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Montant: {formatMontantCurrency(bon.montantTTC || 0)}
                    {bon.statut === 'facture' && (
                      <span className="ml-2 text-green-600">
                        ✓ Converti en facture
                      </span>
                    )}
                  </p>
                </div>
              ))}

              {/* Historique des opérations de caisse */}
              {operationsCaisse.map((operation, index) => (
                <div key={`operation-${operation._id || index}`} className={`border-l-4 ${operation.type === 'entree' ? 'border-green-500' : 'border-red-500'} pl-4 py-2`}>
                  <div className="flex items-center">
                    {operation.type === 'entree' ? (
                      <Euro className="w-4 h-4 text-green-600 mr-2" />
                    ) : (
                      <RotateCcw className="w-4 h-4 text-red-600 mr-2" />
                    )}
                    <p className="font-medium text-gray-900">
                      {operation.description}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(operation.date).toLocaleDateString('fr-FR')} à {new Date(operation.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {operation.type === 'entree' ? '+' : '-'}
                    {formatMontantCurrency(operation.montant || 0)}
                    {operation.reference && (
                      <span className="ml-2">
                        (Réf: {operation.reference})
                      </span>
                    )}
                  </p>
                </div>
              ))}

              {/* Historique des annulations */}
              {operationsCaisse
                .filter(op => op.description?.includes('ANNULATION') || op.type_operation === 'annulation')
                .map((operation, index) => (
                  <div key={`annulation-${operation._id || index}`} className="border-l-4 border-orange-500 pl-4 py-2">
                    <div className="flex items-center">
                      <XCircle className="w-4 h-4 text-orange-600 mr-2" />
                      <p className="font-medium text-gray-900">
                        Annulation: {operation.description?.replace('ANNULATION: ', '')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(operation.date).toLocaleDateString('fr-FR')} à {new Date(operation.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-500">
                      Montant annulé: {formatMontantCurrency(operation.montant || 0)}
                    </p>
                  </div>
                ))}

              {/* Historique des actions sur les devis */}
              {bonsCommande.filter(bon => bon.statut !== 'brouillon').map((bon, index) => {
                const actions = [];
                
                if (bon.statut === 'envoye') {
                  actions.push({
                    type: 'envoye',
                    message: `Devis ${bon.numero} envoyé au client`,
                    date: bon.dateCreation,
                    color: 'border-blue-500'
                  });
                }
                
                if (bon.statut === 'accepte') {
                  actions.push({
                    type: 'accepte',
                    message: `Devis ${bon.numero} accepté par le client`,
                    date: bon.dateCreation,
                    color: 'border-green-500'
                  });
                }
                
                if (bon.statut === 'refuse') {
                  actions.push({
                    type: 'refuse',
                    message: `Devis ${bon.numero} refusé par le client`,
                    date: bon.dateCreation,
                    color: 'border-red-500'
                  });
                }
                
                if (bon.statut === 'facture') {
                  actions.push({
                    type: 'converti',
                    message: `Devis ${bon.numero} transformé en facture`,
                    date: bon.dateCreation,
                    color: 'border-purple-500'
                  });
                }
                
                return actions.map((action, actionIndex) => (
                  <div key={`${bon.id}-${action.type}-${actionIndex}`} className={`border-l-4 ${action.color} pl-4 py-2`}>
                    <p className="font-medium text-gray-900">{action.message}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(action.date).toLocaleDateString('fr-FR')} à {new Date(action.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ));
              })}

              {/* Historique des paiements */}
              {factures.filter(f => (f.montantPaye || 0) > 0).map((facture, index) => (
                <div key={`paiement-${facture.id || index}`} className="border-l-4 border-green-500 pl-4 py-2">
                  <p className="font-medium text-gray-900">
                    Paiement reçu pour la facture {facture.numero}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(facture.dateEmission).toLocaleDateString('fr-FR')} à {new Date(facture.dateEmission).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Montant payé: {formatMontantCurrency(facture.montantPaye || 0)}
                  </p>
                </div>
              ))}

              {/* Création du client */}
              <div key="creation-client" className="border-l-4 border-gray-500 pl-4 py-2">
                <p className="font-medium text-gray-900">Client créé</p>
                <p className="text-sm text-gray-600">
                  {new Date(client.dateCreation).toLocaleDateString('fr-FR')} à {new Date(client.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Message si aucun historique */}
              {factures.length === 0 && bonsCommande.length === 0 && operationsCaisse.length === 0 && (
                <div key="no-history" className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun historique disponible pour ce client</p>
                </div>
              )}
            </div>

            {/* Statistiques résumées */}
            {(factures.length > 0 || bonsCommande.length > 0 || operationsCaisse.length > 0) && (
              <div key="stats-summary" className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Résumé des interactions</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Factures totales:</span>
                    <span className="ml-2 font-medium">{factures.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Devis:</span>
                    <span className="ml-2 font-medium">{bonsCommande.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Factures payées:</span>
                    <span className="ml-2 font-medium">{factures.filter(f => f.statut === 'payee').length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Devis acceptés:</span>
                    <span className="ml-2 font-medium">{bonsCommande.filter(b => b.statut === 'accepte').length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {client.entreprise || `${client.prenom} ${client.nom}`}
            </h1>
            <p className="text-gray-600">Détails du client</p>
          </div>
        </div>
        <Link
          to={`/clients/${client.id}/modifier`}
          className="btn-primary"
        >
          <Edit className="w-4 h-4 mr-2" />
          Modifier
        </Link>
      </div>

      {/* Résumé rapide */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Euro className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Solde</p>
              <p className={`text-xl font-bold ${
                client.solde > 0 ? 'text-green-600' :
                client.solde < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {formatMontantCurrency(client.solde || 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Factures</p>
              <p className="text-xl font-bold text-gray-900">{(Array.isArray(factures) ? factures : []).length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Devis</p>
              <p className="text-xl font-bold text-gray-900">{(Array.isArray(bonsCommande) ? bonsCommande : []).length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Client depuis</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.floor((new Date().getTime() - new Date(client.dateCreation).getTime()) / (1000 * 60 * 60 * 24))} jours
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(Array.isArray(tabs) ? tabs : []).map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu de l'onglet */}
      <div className="card">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ClientDetailPage;