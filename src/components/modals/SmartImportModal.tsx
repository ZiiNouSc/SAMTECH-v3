import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Typography,
  Card,
  CardBody,
  Input,
  Textarea,
  Alert,
  Progress,
  Chip,
  IconButton,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
} from '@material-tailwind/react';
import {
  CloudArrowUpIcon,
  EnvelopeIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { smartImportService, EmailContent, ImportResult, DetectionResult } from '../../services/smartImportService';
import { useAuth } from '../../contexts/AuthContext';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: 'billets' | 'hotel' | 'visa' | 'assurance';
  onImportSuccess: (result: ImportResult) => void;
}

const SmartImportModal: React.FC<SmartImportModalProps> = ({
  isOpen,
  onClose,
  module,
  onImportSuccess,
}) => {
  const { user, currentAgence } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState('email');
  const [loading, setLoading] = useState(false);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  // États pour l'import par email
  const [emailData, setEmailData] = useState({
    subject: '',
    sender: '',
    body: '',
    attachments: [] as File[]
  });
  
  // États pour l'import manuel
  const [manualData, setManualData] = useState({
    title: '',
    description: '',
    files: [] as File[]
  });

  const moduleLabels = {
    billets: 'Billets d\'avion',
    hotel: 'Réservations d\'hôtel',
    visa: 'Demandes de visa',
    assurance: 'Assurances voyage'
  };

  const moduleIcons = {
    billets: '✈️',
    hotel: '🏨',
    visa: '🛂',
    assurance: '🛡️'
  };

  const handleFileSelect = (files: FileList | null, type: 'email' | 'manual') => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    if (type === 'email') {
      setEmailData(prev => ({ ...prev, attachments: fileArray }));
    } else {
      setManualData(prev => ({ ...prev, files: fileArray }));
    }
  };

  const simulateEmailParsing = async (): Promise<EmailContent> => {
    // Simulation de la récupération d'email depuis Gmail API
    // Dans la vraie implémentation, ceci ferait appel au service de récupération d'emails
    return {
      id: `email_${Date.now()}`,
      subject: emailData.subject,
      body: emailData.body,
      sender: emailData.sender,
      date: new Date(),
      attachments: emailData.attachments.map(file => ({
        name: file.name,
        content: '', // Le contenu serait lu ici
        type: file.type,
        size: file.size
      }))
    };
  };

  const createManualEmail = (): EmailContent => {
    return {
      id: `manual_${Date.now()}`,
      subject: manualData.title || `Import manuel - ${moduleLabels[module]}`,
      body: manualData.description,
      sender: user?.email || '',
      date: new Date(),
      attachments: manualData.files.map(file => ({
        name: file.name,
        content: '',
        type: file.type,
        size: file.size
      }))
    };
  };

  const handleDetectContent = async () => {
    setLoading(true);
    try {
      const email = activeTab === 'email' 
        ? await simulateEmailParsing()
        : createManualEmail();
      
      const detectionResult = smartImportService.detectContentType(email);
      setDetection(detectionResult);
    } catch (error) {
      console.error('Erreur lors de la détection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!user || !currentAgence) return;
    
    setLoading(true);
    try {
      const email = activeTab === 'email' 
        ? await simulateEmailParsing()
        : createManualEmail();
      
      const result = await smartImportService.importEmail(
        email,
        module,
        user._id,
        currentAgence.id
      );
      
      setImportResult(result);
      
      if (result.success) {
        onImportSuccess(result);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setImportResult({
        success: false,
        originalModule: module,
        finalModule: module,
        reclassified: false,
        message: 'Erreur lors de l\'import: ' + (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmailData({ subject: '', sender: '', body: '', attachments: [] });
    setManualData({ title: '', description: '', files: [] });
    setDetection(null);
    setImportResult(null);
    setActiveTab('email');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'green';
    if (confidence >= 60) return 'orange';
    if (confidence >= 40) return 'red';
    return 'gray';
  };

  const getModuleIcon = (moduleType: string) => {
    return moduleIcons[moduleType as keyof typeof moduleIcons] || '📄';
  };

  return (
    <Dialog open={isOpen} handler={handleClose} size="lg" className="bg-white">
      <DialogHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{moduleIcons[module]}</span>
          <div>
            <Typography variant="h5">
              Import intelligent - {moduleLabels[module]}
            </Typography>
            <Typography variant="small" color="gray">
              Détection automatique du type de contenu
            </Typography>
          </div>
        </div>
        <IconButton variant="text" size="sm" onClick={handleClose}>
          <XMarkIcon className="h-5 w-5" />
        </IconButton>
      </DialogHeader>

      <DialogBody className="space-y-6">
        {/* Tabs pour choisir le mode d'import */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as string)}>
          <TabsHeader>
            <Tab key="email" value="email">
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4" />
                Import Email
              </div>
            </Tab>
            <Tab key="manual" value="manual">
              <div className="flex items-center gap-2">
                <DocumentArrowUpIcon className="h-4 w-4" />
                Import Manuel
              </div>
            </Tab>
          </TabsHeader>
          
          <TabsBody>
            {/* Tab Import Email */}
            <TabPanel key="email" value="email" className="space-y-4">
              <Alert color="blue" icon={<InformationCircleIcon className="h-6 w-6" />}>
                <Typography variant="small">
                  Collez ici le contenu d'un email reçu pour l'analyser automatiquement.
                </Typography>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Expéditeur"
                  value={emailData.sender}
                  onChange={(e) => setEmailData(prev => ({ ...prev, sender: e.target.value }))}
                  placeholder="exemple@compagnie.com"
                />
                <Input
                  label="Sujet de l'email"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Confirmation de réservation..."
                />
              </div>
              
              <Textarea
                label="Contenu de l'email"
                value={emailData.body}
                onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                rows={6}
                placeholder="Collez ici le contenu complet de l'email..."
              />
              
              <div>
                <Typography variant="small" className="mb-2 font-medium">
                  Pièces jointes (PDF, images...)
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => handleFileSelect(e.target.files, 'email')}
                  className="hidden"
                />
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <CloudArrowUpIcon className="h-5 w-5" />
                  Sélectionner des fichiers
                </Button>
                {emailData.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {emailData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabPanel>

            {/* Tab Import Manuel */}
            <TabPanel key="manual" value="manual" className="space-y-4">
              <Alert color="amber" icon={<ExclamationTriangleIcon className="h-6 w-6" />}>
                <Typography variant="small">
                  Créez manuellement une entrée avec vos propres fichiers et descriptions.
                </Typography>
              </Alert>
              
              <Input
                label="Titre"
                value={manualData.title}
                onChange={(e) => setManualData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Réservation Air France du 15/01/2024"
              />
              
              <Textarea
                label="Description"
                value={manualData.description}
                onChange={(e) => setManualData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Décrivez le contenu, ajoutez des détails..."
              />
              
              <div>
                <Typography variant="small" className="mb-2 font-medium">
                  Fichiers à importer
                </Typography>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => handleFileSelect(e.target.files, 'manual')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {manualData.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {manualData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabPanel>
          </TabsBody>
        </Tabs>

        {/* Bouton de détection */}
        <div className="flex justify-center">
          <Button
            onClick={handleDetectContent}
            disabled={loading || (activeTab === 'email' && !emailData.subject && !emailData.body)}
            className="flex items-center gap-2"
            color="blue"
          >
            <EyeIcon className="h-4 w-4" />
            {loading ? 'Analyse en cours...' : 'Analyser le contenu'}
          </Button>
        </div>

        {/* Résultats de la détection */}
        {detection && (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <Typography variant="h6">Résultat de l'analyse</Typography>
                <Chip
                  value={`${detection.confidence.toFixed(1)}% de confiance`}
                  color={getConfidenceColor(detection.confidence)}
                  size="sm"
                />
              </div>

              {detection.moduleType !== 'unknown' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getModuleIcon(detection.moduleType)}</span>
                    <Typography variant="small">
                      Contenu détecté: <strong>{moduleLabels[detection.moduleType as keyof typeof moduleLabels]}</strong>
                    </Typography>
                  </div>

                  {detection.moduleType !== module && (
                    <Alert color="orange" icon={<ExclamationTriangleIcon className="h-6 w-6" />}>
                      <Typography variant="small">
                        ⚠️ Ce contenu sera automatiquement reclassifié vers le module <strong>{moduleLabels[detection.moduleType as keyof typeof moduleLabels]}</strong>
                      </Typography>
                    </Alert>
                  )}

                  <div>
                    <Typography variant="small" className="font-medium mb-2">
                      Indicateurs trouvés:
                    </Typography>
                    <div className="space-y-1">
                      {detection.indicators.slice(0, 5).map((indicator, index) => (
                        <Typography key={index} variant="small" className="text-gray-600">
                          • {indicator}
                        </Typography>
                      ))}
                      {detection.indicators.length > 5 && (
                        <Typography variant="small" className="text-gray-500 italic">
                          ... et {detection.indicators.length - 5} autres indicateurs
                        </Typography>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Alert color="gray" icon={<InformationCircleIcon className="h-6 w-6" />}>
                  <Typography variant="small">
                    Aucun type spécifique détecté. L'import se fera dans le module courant: <strong>{moduleLabels[module]}</strong>
                  </Typography>
                </Alert>
              )}
            </CardBody>
          </Card>
        )}

        {/* Résultat de l'import */}
        {importResult && (
          <Alert 
            color={importResult.success ? 'green' : 'red'} 
            icon={importResult.success ? <CheckCircleIcon className="h-6 w-6" /> : <ExclamationTriangleIcon className="h-6 w-6" />}
          >
            <Typography variant="small">
              {importResult.message}
            </Typography>
            {importResult.reclassified && (
              <Typography variant="small" className="mt-1 font-medium">
                📂 Reclassifié: {moduleLabels[importResult.originalModule as keyof typeof moduleLabels]} → {moduleLabels[importResult.finalModule as keyof typeof moduleLabels]}
              </Typography>
            )}
          </Alert>
        )}

        {/* Barre de progression */}
        {loading && (
          <div className="space-y-2">
            <Progress value={50} color="blue" />
            <Typography variant="small" className="text-center text-gray-600">
              Import en cours...
            </Typography>
          </div>
        )}
      </DialogBody>

      <DialogFooter className="space-x-2">
        <Button variant="outlined" onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleImport}
          disabled={loading || !detection || !!importResult?.success}
          loading={loading}
        >
          {detection?.reclassified ? 'Importer (avec reclassement)' : 'Importer'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default SmartImportModal; 