import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Upload, 
  Eye, 
  Trash2, 
  Plus,
  Search,
  Filter,
  Folder,
  File,
  Image,
  FileSpreadsheet,
  Calendar,
  User
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
import { documentsAPI } from '../../services/api';

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'table' | 'grid' | 'list'>('grid');
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentData, setDocumentData] = useState({
    titre: '',
    description: '',
    categorie: 'autre'
  });

  const filterOptions = [
    {
      id: 'type',
      label: 'Type de fichier',
      options: [
        { value: 'pdf', label: 'PDF' },
        { value: 'doc', label: 'Document' },
        { value: 'excel', label: 'Excel' },
        { value: 'image', label: 'Image' },
        { value: 'autre', label: 'Autre' }
      ]
    },
    {
      id: 'categorie',
      label: 'Catégorie',
      options: [
        { value: 'contrat', label: 'Contrat' },
        { value: 'facture', label: 'Facture' },
        { value: 'devis', label: 'Devis' },
        { value: 'photo', label: 'Photo' },
        { value: 'passeport', label: 'Passeport' },
        { value: 'autre', label: 'Autre' }
      ]
    }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.getAll();
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('fichier', selectedFile);
    formData.append('titre', documentData.titre);
    formData.append('description', documentData.description);
    formData.append('categorie', documentData.categorie);

    try {
      setActionLoading(true);
      const response = await documentsAPI.create(formData);
      setDocuments(prev => [response.data, ...prev]);
      setShowUploadModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!documentId) {
      console.error('Document ID is undefined');
      return;
    }
    
    try {
      setActionLoading(true);
      await documentsAPI.delete(documentId);
      setDocuments(prev => (Array.isArray(prev) ? prev : []).filter(doc => doc.id !== documentId));
      setShowDetailModal(false);
      setSelectedDocument(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression: ' + ((error as any).response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const filteredDocuments = (Array.isArray(documents) ? documents : []).filter(document => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      document.nom.toLowerCase().includes(searchLower) ||
      (document.clientNom && document.clientNom.toLowerCase().includes(searchLower)) ||
      (document.description && document.description.toLowerCase().includes(searchLower))
    );

    const typeFilter = activeFilters.type;
    const categorieFilter = activeFilters.categorie;

    const matchesType = !typeFilter || typeFilter === 'tous' || document.type === typeFilter;
    const matchesCategorie = !categorieFilter || categorieFilter === 'tous' || document.categorie === categorieFilter;

    return matchesSearch && matchesType && matchesCategorie;
  });

  const stats = {
    totalDocuments: (Array.isArray(documents) ? documents : []).length,
    tailleTotal: (Array.isArray(documents) ? documents : []).reduce((sum, doc) => sum + doc.taille, 0),
    documentsClient: (Array.isArray(documents) ? documents : []).filter(d => d.clientId).length,
    documentsRecents: (Array.isArray(documents) ? documents : []).filter(d => 
      new Date(d.dateCreation) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-8 h-8 text-red-600" />;
      case 'doc': return <FileText className="w-8 h-8 text-blue-600" />;
      case 'excel': return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
      case 'image': return <Image className="w-8 h-8 text-purple-600" />;
      default: return <File className="w-8 h-8 text-gray-600" />;
    }
  };

  const getFileIconSmall = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-600" />;
      case 'doc': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'excel': return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      case 'image': return <Image className="w-5 h-5 text-purple-600" />;
      default: return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const renderDocumentCard = (document: any) => (
    <Card key={document.id} hover className="h-full">
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center bg-gray-50 rounded-lg">
          {getFileIcon(document.type)}
        </div>
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
          {document.nom}
        </h3>
        <Badge variant="default" size="sm">
          {document.categorie}
        </Badge>
      </div>

      <div className="space-y-2 mb-4 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <span>Taille:</span>
          <span>{formatFileSize(document.taille)}</span>
        </div>
        {document.clientNom && (
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            <span className="truncate">{document.clientNom}</span>
          </div>
        )}
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          <span>{new Date(document.dateCreation).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          onClick={() => {
            setSelectedDocument(document);
            setShowDetailModal(true);
          }}
          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
          title="Voir les détails"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          className="p-1 text-green-600 hover:bg-green-100 rounded"
          title="Télécharger"
        >
          <Download className="w-4 h-4" />
        </button>
        {document.id && (
          <button
            onClick={() => handleDeleteDocument(document.id)}
            disabled={actionLoading}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Gestion des Documents</h1>
          <p className="text-gray-600">Organiser et gérer tous vos documents</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Télécharger un document
        </button>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total documents"
          value={stats.totalDocuments}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Espace utilisé"
          value={formatFileSize(stats.tailleTotal)}
          icon={Folder}
          color="purple"
        />
        <StatCard
          title="Documents clients"
          value={stats.documentsClient}
          icon={User}
          color="green"
        />
        <StatCard
          title="Ajoutés cette semaine"
          value={stats.documentsRecents}
          icon={Calendar}
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
        placeholder="Rechercher un document..."
      />

      {/* Contrôles de vue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {(Array.isArray(filteredDocuments) ? filteredDocuments : []).length} document{(Array.isArray(filteredDocuments) ? filteredDocuments : []).length > 1 ? 's' : ''} trouvé{(Array.isArray(filteredDocuments) ? filteredDocuments : []).length > 1 ? 's' : ''}
          </span>
        </div>
        <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Contenu principal */}
      {currentView === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Document</TableHeaderCell>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Catégorie</TableHeaderCell>
                <TableHeaderCell>Taille</TableHeaderCell>
                <TableHeaderCell>Date création</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(filteredDocuments) ? filteredDocuments : []).map((document, index) => (
                <TableRow key={document.id || (document as any)._id || `document-${index}`}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="mr-3">
                        {getFileIconSmall(document.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">
                          {document.nom}
                        </p>
                        {document.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {document.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {document.clientNom ? (
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{document.clientNom}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" size="sm">
                      {document.categorie}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-900">
                      {formatFileSize(document.taille)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-gray-900">
                        {new Date(document.dateCreation).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(document.dateCreation).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDocument(document);
                          setShowDetailModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {document.id && (
                        <button
                          onClick={() => handleDeleteDocument(document.id)}
                          disabled={actionLoading}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
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
        </Card>
      )}

      {currentView === 'grid' && (
        <GridView columns={4}>
          {(Array.isArray(filteredDocuments) ? filteredDocuments : []).map(renderDocumentCard)}
        </GridView>
      )}

      {/* Modal détails document */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails du document"
        size="lg"
      >
        {selectedDocument && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-gray-50 rounded-lg">
                {getFileIcon(selectedDocument.type)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedDocument.nom}
              </h3>
              <Badge variant="default">
                {selectedDocument.categorie}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de fichier
                  </label>
                  <p className="text-sm text-gray-900 uppercase">{selectedDocument.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taille
                  </label>
                  <p className="text-sm text-gray-900">{formatFileSize(selectedDocument.taille)}</p>
                </div>
                {selectedDocument.clientNom && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client associé
                    </label>
                    <p className="text-sm text-gray-900">{selectedDocument.clientNom}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de création
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedDocument.dateCreation).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dernière modification
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedDocument.dateModification).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {selectedDocument.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  
                  <p className="text-sm text-gray-900">{selectedDocument.description}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button className="btn-secondary">
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </button>
              <button className="btn-primary">
                <Eye className="w-4 h-4 mr-2" />
                Ouvrir
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal upload */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Télécharger un document"
        size="lg"
      >
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Télécharger vos documents
            </h3>
            <p className="text-gray-600 mb-6">
              Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
            </p>
            <input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="btn-primary cursor-pointer"
            >
              Sélectionner des fichiers
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select className="input-field">
                <option value="autre">Autre</option>
                <option value="contrat">Contrat</option>
                <option value="facture">Facture</option>
                <option value="devis">Devis</option>
                <option value="photo">Photo</option>
                <option value="passeport">Passeport</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client associé (optionnel)
              </label>
              <select className="input-field">
                <option value="">Aucun client</option>
                <option value="1">Martin Dubois</option>
                <option value="2">Sophie Martin</option>
                <option value="3">Entreprise ABC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnelle)
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Description du document..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowUploadModal(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button 
              onClick={() => {
                // Simulate upload
                const mockDocument = {
                  nom: "Document_Test.pdf",
                  type: "pdf",
                  taille: 245760,
                  categorie: "autre",
                  dateCreation: new Date().toISOString(),
                  dateModification: new Date().toISOString(),
                  url: "/documents/document_test.pdf",
                  description: "Document de test"
                };
                
                handleUpload();
              }}
              disabled={actionLoading}
              className="btn-primary"
            >
              {actionLoading ? <LoadingSpinner size="sm" className="mr-2" /> : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Télécharger
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentsPage;