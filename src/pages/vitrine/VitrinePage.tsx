import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Eye, 
  EyeOff, 
  Edit, 
  Save,
  Upload,
  Palette,
  Settings,
  Share2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { profileAPI } from '../../services/api';

interface VitrineConfig {
  isActive: boolean;
  domainName: string;
  title: string;
  description: string;
  slogan?: string;
  logo: string;
  bannerImage: string;
  primaryColor: string;
  secondaryColor: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    hours: string;
  };
  aboutText: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  // Sections configurables
  featuresSection: {
    enabled: boolean;
    title: string;
    features: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  statsSection: {
    enabled: boolean;
    stats: Array<{
      number: string;
      label: string;
    }>;
  };
  testimonialsSection: {
    enabled: boolean;
    title: string;
    testimonials: Array<{
      name: string;
      role: string;
      content: string;
      rating: number;
    }>;
  };
  slug?: string;
}

const VitrinePage: React.FC = () => {
  const { isLoading: authLoading, currentAgence } = useAuth();
  const [config, setConfig] = useState<VitrineConfig>({
    isActive: true,
    domainName: '',
    title: '',
    description: '',
    slogan: '',
    logo: '',
    bannerImage: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    contactInfo: {
      phone: '',
      email: '',
      address: '',
      hours: ''
    },
    aboutText: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: ''
    },
    // Sections configurables
    featuresSection: {
      enabled: true,
      title: 'Nos Services',
      features: [
        { icon: '🏖️', title: 'Voyages personnalisés', description: 'Des voyages adaptés à vos besoins et à votre budget.' },
        { icon: '✈️', title: 'Transports', description: 'Des options de transport confortables et fiables.' },
        { icon: '🏨', title: 'Hébergements', description: 'Des hébergements de qualité pour votre séjour.' },
        { icon: '🛡️', title: 'Assurance voyage', description: 'Protection complète pour votre tranquillité d\'esprit.' }
      ]
    },
    statsSection: {
      enabled: true,
      stats: [
        { number: '100+', label: 'Destinations' },
        { number: '500+', label: 'Clients satisfaits' },
        { number: '10+', label: 'Années d\'expérience' }
      ]
    },
    testimonialsSection: {
      enabled: true,
      title: 'Témoignages',
      testimonials: [
        { name: 'Jean Dupont', role: 'Client fidèle', content: 'Excellent service et très professionnel. Je recommande vivement.', rating: 5 },
        { name: 'Marie Martin', role: 'Agence de voyage', content: 'Une équipe à l\'écoute et des offres attractives. Merci !', rating: 4 }
      ]
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // États pour l'upload de logo et bannière
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoTemp, setLogoTemp] = useState<string | null>(null);
  const [logoSaving, setLogoSaving] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerTemp, setBannerTemp] = useState<string | null>(null);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [profileLogoUrl, setProfileLogoUrl] = useState<string>('');

  // Fonction simplifiée pour gérer les changements de contenu
  const handleContentChange = (content: string) => {
    setConfig(prev => ({ ...prev, aboutText: content }));
  };

  useEffect(() => {
    if (authLoading) return;
    fetchVitrineConfig();
  }, [authLoading]);

  // Synchroniser le logo quand la config change
  useEffect(() => {
    if (config && !config.logo && profileLogoUrl) {
      console.log('Setting logo from profile:', profileLogoUrl); // Debug
      setConfig(prev => ({ ...prev, logo: profileLogoUrl }));
    }
  }, [config, profileLogoUrl]);

  const fetchVitrineConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/vitrine');
      if (response.data.success) {
        const vitrineConfig = response.data.data;
        console.log('Vitrine config:', vitrineConfig); // Debug
        
        // Fusionner avec les valeurs par défaut pour les nouvelles sections
        const mergedConfig = {
          ...config, // Valeurs par défaut
          ...vitrineConfig, // Configuration existante
          // S'assurer que les nouvelles sections sont initialisées
          featuresSection: {
            enabled: true,
            title: 'Nos Services',
            features: [
              { icon: '🏖️', title: 'Voyages personnalisés', description: 'Des voyages adaptés à vos besoins et à votre budget.' },
              { icon: '✈️', title: 'Transports', description: 'Des options de transport confortables et fiables.' },
              { icon: '🏨', title: 'Hébergements', description: 'Des hébergements de qualité pour votre séjour.' },
              { icon: '🛡️', title: 'Assurance voyage', description: 'Protection complète pour votre tranquillité d\'esprit.' }
            ]
          },
          statsSection: {
            enabled: true,
            stats: [
              { number: '100+', label: 'Destinations' },
              { number: '500+', label: 'Clients satisfaits' },
              { number: '10+', label: 'Années d\'expérience' }
            ]
          },
          testimonialsSection: {
            enabled: true,
            title: 'Témoignages',
            testimonials: [
              { name: 'Jean Dupont', role: 'Client fidèle', content: 'Excellent service et très professionnel. Je recommande vivement.', rating: 5 },
              { name: 'Marie Martin', role: 'Agence de voyage', content: 'Une équipe à l\'écoute et des offres attractives. Merci !', rating: 4 }
            ]
          }
        };
        
        // Fusionner les sections existantes si elles existent
        if (vitrineConfig.featuresSection) {
          mergedConfig.featuresSection = { ...mergedConfig.featuresSection, ...vitrineConfig.featuresSection };
        }
        if (vitrineConfig.statsSection) {
          mergedConfig.statsSection = { ...mergedConfig.statsSection, ...vitrineConfig.statsSection };
        }
        if (vitrineConfig.testimonialsSection) {
          mergedConfig.testimonialsSection = { ...mergedConfig.testimonialsSection, ...vitrineConfig.testimonialsSection };
        }
        
        setConfig(mergedConfig);
        
        // Si pas de logo dans la vitrine, récupérer celui du profil
        if (!mergedConfig.logo) {
          await fetchProfileLogo();
        }
      } else {
        throw new Error(response.data.message || 'Failed to load vitrine config');
      }
    } catch (error) {
      console.error('Error loading vitrine config:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileLogo = async () => {
    try {
      const response = await profileAPI.getProfile();
      console.log('Profile response:', response); // Debug
      
      // Récupérer le logo depuis la réponse de l'agence
      const logoUrl = response.data?.data?.logoUrl || response.data?.logoUrl || '';
      console.log('Logo URL from profile:', logoUrl); // Debug
      setProfileLogoUrl(logoUrl);
    } catch (error) {
      console.error('Error loading profile logo:', error);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximum : 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide');
        return;
      }
      setLogoFile(file);
      setLogoTemp(URL.createObjectURL(file));
    }
  };

  const handleLogoSave = async () => {
    if (!logoFile) return;
    setLogoSaving(true);
    try {
      const response = await profileAPI.uploadLogo(logoFile);
      setProfileLogoUrl(response.data.logoUrl);
      setLogoTemp(null);
      setLogoFile(null);
      alert('Logo enregistré avec succès !');
      // Mettre à jour la config de la vitrine avec le nouveau logo
      setConfig(prev => ({ ...prev, logo: response.data.logoUrl }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'upload du logo');
    } finally {
      setLogoSaving(false);
    }
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximum : 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide');
        return;
      }
      setBannerFile(file);
      setBannerTemp(URL.createObjectURL(file));
    }
  };

  const handleBannerSave = async () => {
    if (!bannerFile) return;
    setBannerSaving(true);
    try {
      const formData = new FormData();
      formData.append('banner', bannerFile);
      
      const response = await axios.post('/api/vitrine/banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        setConfig(prev => ({ ...prev, bannerImage: response.data.bannerUrl }));
        setBannerTemp(null);
        setBannerFile(null);
        alert('Bannière enregistrée avec succès !');
      } else {
        throw new Error(response.data.message || 'Failed to upload banner');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'upload de la bannière');
    } finally {
      setBannerSaving(false);
    }
  };

  const useProfileLogo = async () => {
    if (config && profileLogoUrl) {
      const updatedConfig = { ...config, logo: profileLogoUrl };
      setConfig(updatedConfig);
      
      // Sauvegarder automatiquement la configuration
      try {
        const response = await axios.put('/api/vitrine', updatedConfig);
        if (response.data.success) {
          alert('Logo du profil utilisé pour la vitrine et sauvegardé !');
        } else {
          throw new Error(response.data.message || 'Failed to save vitrine config');
        }
      } catch (error) {
        console.error('Error saving vitrine config:', error);
        alert('Erreur lors de la sauvegarde de la configuration');
      }
    } else {
      alert('Aucun logo de profil disponible. Veuillez d\'abord uploader un logo dans votre profil.');
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    setIsSaving(true);
    try {
      const response = await axios.put('/api/vitrine', config);
      
      if (response.data.success) {
        alert('Configuration de la vitrine sauvegardée avec succès');
      } else {
        throw new Error(response.data.message || 'Failed to save vitrine config');
      }
    } catch (error) {
      console.error('Error saving vitrine config:', error);
      alert('Une erreur est survenue lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!config) return;
    
    try {
      const response = await axios.put('/api/vitrine/toggle');
      
      if (response.data.success) {
        setConfig(prev => ({ ...prev, isActive: !prev.isActive }));
      } else {
        throw new Error(response.data.message || 'Failed to toggle vitrine status');
      }
    } catch (error) {
      console.error('Error toggling vitrine status:', error);
      alert('Une erreur est survenue lors du changement de statut');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleContactInfoChange = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, [field]: value }
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  };

  // Fonctions pour ajouter/supprimer des éléments dynamiquement
  const addFeature = () => {
    const currentFeatures = config.featuresSection?.features || [];
    if (currentFeatures.length < 4) {
      const newFeature = { icon: '✨', title: 'Nouveau service', description: 'Description du service' };
      const newFeatures = [...currentFeatures, newFeature];
      handleInputChange('featuresSection', { ...config.featuresSection, features: newFeatures });
    }
  };

  const removeFeature = (index: number) => {
    const currentFeatures = config.featuresSection?.features || [];
    const newFeatures = currentFeatures.filter((_, i) => i !== index);
    handleInputChange('featuresSection', { ...config.featuresSection, features: newFeatures });
  };

  const addStat = () => {
    const currentStats = config.statsSection?.stats || [];
    if (currentStats.length < 3) {
      const newStat = { number: '0+', label: 'Nouvelle statistique' };
      const newStats = [...currentStats, newStat];
      handleInputChange('statsSection', { ...config.statsSection, stats: newStats });
    }
  };

  const removeStat = (index: number) => {
    const currentStats = config.statsSection?.stats || [];
    const newStats = currentStats.filter((_, i) => i !== index);
    handleInputChange('statsSection', { ...config.statsSection, stats: newStats });
  };

  const addTestimonial = () => {
    const currentTestimonials = config.testimonialsSection?.testimonials || [];
    if (currentTestimonials.length < 2) {
      const newTestimonial = { 
        name: 'Nouveau client', 
        role: 'Client', 
        content: 'Témoignage du client...', 
        rating: 5    };
      const newTestimonials = [...currentTestimonials, newTestimonial];
      handleInputChange('testimonialsSection', { ...config.testimonialsSection, testimonials: newTestimonials });
    }
  };

  const removeTestimonial = (index: number) => {
    const currentTestimonials = config.testimonialsSection?.testimonials || [];
    const newTestimonials = currentTestimonials.filter((_, i) => i !== index);
    handleInputChange('testimonialsSection', { ...config.testimonialsSection, testimonials: newTestimonials });
  };

  // Fonctions pour la barre d'outils HTML
  const insertHTMLTag = (tag: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let insertText = '';
    if (tag === 'br') {
      insertText = '<br>';
    } else if (tag === 'h2' || tag === 'h3') {
      insertText = `<${tag}>${selectedText || placeholder}</${tag}>`;
    } else {
      insertText = `<${tag}>${selectedText || placeholder}</${tag}>`;
    }

    const newText = text.substring(0, start) + insertText + text.substring(end);
    handleInputChange('aboutText', newText);

    // Focus et positionner le curseur
    setTimeout(() => {
      textarea.focus();
      if (tag === 'br') {
        textarea.setSelectionRange(start + insertText.length, start + insertText.length);
      } else if (selectedText) {
        textarea.setSelectionRange(start, start + insertText.length);
      } else {
        const tagLength = tag.length + 2;
        textarea.setSelectionRange(start + tagLength, start + tagLength + placeholder.length);
      }
    }, 0);
  };

  const insertLink = () => {
    const url = prompt('Entrez l\'URL du lien :', 'https://');
    if (!url) return;

    const text = prompt('Entrez le texte du lien :', 'Cliquez ici');
    if (!text) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = textarea.value.substring(start, end);

    const linkHTML = `<a href="${url}" target="_blank">${selectedText || text}</a>`;
    const newText = currentText.substring(0, start) + linkHTML + currentText.substring(end);
    handleInputChange('aboutText', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + linkHTML.length);
    }, 0);
  };

  const insertImage = () => {
    const url = prompt('Entrez l\'URL de l\'image :', 'https://');
    if (!url) return;

    const alt = prompt('Entrez le texte alternatif de l\'image :', 'Description de l\'image');
    if (!alt) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;

    const imageHTML = `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">`;
    const newText = currentText.substring(0, start) + imageHTML + currentText.substring(start);
    handleInputChange('aboutText', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + imageHTML.length, start + imageHTML.length);
    }, 0);
  };

  const insertEmail = () => {
    const email = prompt('Entrez l\'adresse email :', 'contact@example.com');
    if (!email) return;

    const text = prompt('Entrez le texte à afficher :', email);
    if (!text) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;

    const emailHTML = `<a href="mailto:${email}">${text}</a>`;
    const newText = currentText.substring(0, start) + emailHTML + currentText.substring(start);
    handleInputChange('aboutText', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emailHTML.length, start + emailHTML.length);
    }, 0);
  };

  const insertPhone = () => {
    const phone = prompt('Entrez le numéro de téléphone :', '+213 123 456 789');
    if (!phone) return;

    const text = prompt('Entrez le texte à afficher :', phone);
    if (!text) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;

    const phoneHTML = `<a href="tel:${phone.replace(/\s/g, '')}">${text}</a>`;
    const newText = currentText.substring(0, start) + phoneHTML + currentText.substring(start);
    handleInputChange('aboutText', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + phoneHTML.length, start + phoneHTML.length);
    }, 0);
  };

  const insertList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;

    const listHTML = `<ul>
  <li>Premier élément</li>
  <li>Deuxième élément</li>
  <li>Troisième élément</li>
</ul>`;
    const newText = currentText.substring(0, start) + listHTML + currentText.substring(start);
    handleInputChange('aboutText', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + listHTML.length, start + listHTML.length);
    }, 0);
  };

  const insertNumberedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;

    const listHTML = `<ol>
  <li>Premier élément</li>
  <li>Deuxième élément</li>
  <li>Troisième élément</li>
</ol>`;
    const newText = currentText.substring(0, start) + listHTML + currentText.substring(start);
    handleInputChange('aboutText', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + listHTML.length, start + listHTML.length);
    }, 0);
  };

  const insertQuote = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = textarea.value.substring(start, end);

    const quoteHTML = `<blockquote style="border-left: 4px solid #3B82F6; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6B7280;">
  ${selectedText || 'Votre citation ici...'}
</blockquote>`;
    const newText = currentText.substring(0, start) + quoteHTML + currentText.substring(end);
    handleInputChange('aboutText', newText);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, start + quoteHTML.length);
      } else {
        const quoteStart = start + quoteHTML.indexOf('Votre citation ici...');
        textarea.setSelectionRange(quoteStart, quoteStart + 'Votre citation ici...'.length);
      }
    }, 0);
  };

  const insertDivider = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;

    const dividerHTML = `<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">`;
    const newText = currentText.substring(0, start) + dividerHTML + currentText.substring(start);
    handleInputChange('aboutText', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + dividerHTML.length, start + dividerHTML.length);
    }, 0);
  };

  const insertTable = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;

    const tableHTML = `
<table>
  <tr>
    <th>Colonne 1</th>
    <th>Colonne 2</th>
  </tr>
  <tr>
    <td>Ligne 1, Colonne 1</td>
    <td>Ligne 1, Colonne 2</td>
  </tr>
  <tr>
    <td>Ligne 2, Colonne 1</td>
    <td>Ligne 2, Colonne 2</td>
  </tr>
</table>
`;
    const newText = currentText.substring(0, start) + tableHTML + currentText.substring(start);
    handleInputChange('aboutText', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tableHTML.length, start + tableHTML.length);
    }, 0);
  };

  const insertButton = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;

    const buttonHTML = `<button style="padding: 8px 12px; background-color: #4F46E5; color: white; border: none; border-radius: 6px; cursor: pointer;">Bouton</button>`;
    const newText = currentText.substring(0, start) + buttonHTML + currentText.substring(start);
    handleInputChange('aboutText', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + buttonHTML.length, start + buttonHTML.length);
    }, 0);
  };

  const insertBadge = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;

    const badgeHTML = `<span style="padding: 4px 8px; background-color: #E0E7FF; color: #4F46E5; border-radius: 6px; font-size: 0.875rem; font-weight: 600;">Badge</span>`;
    const newText = currentText.substring(0, start) + badgeHTML + currentText.substring(start);
    handleInputChange('aboutText', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + badgeHTML.length, start + badgeHTML.length);
    }, 0);
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'content', label: 'Contenu', icon: Edit },
    { id: 'sections', label: 'Sections', icon: Globe },
    { id: 'contact', label: 'Contact', icon: Share2 }
  ];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erreur lors du chargement de la configuration</p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-medium text-blue-900">Statut de la vitrine</h3>
                <p className="text-sm text-blue-700">
                  {config.isActive ? 'Votre vitrine est en ligne' : 'Votre vitrine est hors ligne'}
                </p>
              </div>
              <button
                onClick={handleToggleActive}
                className={`btn-${config.isActive ? 'danger' : 'primary'}`}
              >
                {config.isActive ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Activer
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lien public
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field flex-1"
                  value={config.slug || ''}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="ex: mon-agence"
                />
                <button
                  onClick={() => window.open(`/site/${config.slug || 'mon-agence'}`, '_blank')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Voir
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre du site
              </label>
              <input
                type="text"
                className="input-field"
                value={config.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slogan de l'agence
              </label>
              <input
                type="text"
                className="input-field"
                value={config.slogan || ''}
                onChange={(e) => handleInputChange('slogan', e.target.value)}
                placeholder="ex: Votre partenaire de confiance pour des voyages inoubliables"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={config.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>
        );

      case 'design':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              <div className="space-y-4">
                {/* Logo actuel */}
                <div className="flex items-center space-x-4">
                  <img
                    src={config.logo || profileLogoUrl || '/placeholder-logo.svg'}
                    alt="Logo actuel"
                    className="w-20 h-20 object-contain border rounded-lg bg-gray-50"
                    onError={(e) => {
                      console.log('Logo error, trying fallback:', e.currentTarget.src);
                      if (e.currentTarget.src !== '/placeholder-logo.svg') {
                        e.currentTarget.src = '/placeholder-logo.svg';
                      }
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      {config.logo ? 'Logo actuel de la vitrine' : 'Logo du profil (utilisé par défaut)'}
                    </p>
                    {config.logo && (
                    <p className="text-xs text-gray-500 mt-1">
                        Logo configuré pour la vitrine
                    </p>
                    )}
                    {profileLogoUrl && !config.logo && (
                      <button
                        onClick={useProfileLogo}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Utiliser le logo du profil
                      </button>
                    )}
                    {config.logo && config.logo !== profileLogoUrl && (
                      <button
                        onClick={useProfileLogo}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Remplacer par le logo du profil
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload nouveau logo */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    {logoTemp ? (
                      <div className="space-y-4">
                        <img
                          src={logoTemp}
                          alt="Aperçu logo"
                          className="mx-auto h-20 w-auto max-w-full object-contain"
                        />
                        <p className="text-sm text-gray-600">Aperçu du nouveau logo</p>
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={handleLogoSave}
                            disabled={logoSaving}
                            className="btn-primary flex items-center gap-2"
                          >
                            {logoSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {logoSaving ? 'Enregistrement...' : 'Enregistrer le logo'}
                          </button>
                          <button
                            onClick={() => {
                              setLogoTemp(null);
                              setLogoFile(null);
                            }}
                            className="btn-secondary"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div>
                          <label htmlFor="logo-upload" className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-700 font-medium">
                              Cliquez pour télécharger un nouveau logo
                            </span>
                          </label>
                          <input
                            id="logo-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, SVG jusqu'à 2MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image de bannière
              </label>
              <div className="space-y-4">
                {/* Bannière actuelle */}
                {config.bannerImage && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Bannière actuelle</p>
                    <img
                      src={config.bannerImage}
                      alt="Bannière actuelle"
                      className="w-full h-32 object-cover border rounded-lg"
                      onError={(e) => {
                        console.log('Banner error:', e.currentTarget.src);
                      e.currentTarget.style.display = 'none';
                    }}
                    />
                    <p className="text-xs text-gray-500">
                      Bannière configurée pour la vitrine
                    </p>
                  </div>
                )}

                {/* Upload nouvelle bannière */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    {bannerTemp ? (
                      <div className="space-y-4">
                        <img
                          src={bannerTemp}
                          alt="Aperçu bannière"
                          className="mx-auto w-full h-32 object-cover rounded-lg"
                        />
                        <p className="text-sm text-gray-600">Aperçu de la nouvelle bannière</p>
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={handleBannerSave}
                            disabled={bannerSaving}
                            className="btn-primary flex items-center gap-2"
                          >
                            {bannerSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {bannerSaving ? 'Enregistrement...' : 'Enregistrer la bannière'}
                          </button>
                          <button
                            onClick={() => {
                              setBannerTemp(null);
                              setBannerFile(null);
                            }}
                            className="btn-secondary"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div>
                          <label htmlFor="banner-upload" className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-700 font-medium">
                              Cliquez pour télécharger une bannière
                            </span>
                          </label>
                          <input
                            id="banner-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleBannerUpload}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG jusqu'à 5MB - Format recommandé : 1200x400px
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur principale
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="w-12 h-10 border rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="input-field flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur secondaire
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="w-12 h-10 border rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="input-field flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Aperçu des couleurs</h4>
              <div className="flex space-x-4">
                <div 
                  className="w-16 h-16 rounded-lg border"
                  style={{ backgroundColor: config.primaryColor }}
                />
                <div 
                  className="w-16 h-16 rounded-lg border"
                  style={{ backgroundColor: config.secondaryColor }}
                />
              </div>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texte "À propos" <span className="text-xs text-gray-500">(HTML autorisé)</span>
              </label>
              
              {/* Barre d'outils HTML */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-gray-600 mr-2">Formatage :</span>
                  
                  <button
                    type="button"
                    onClick={() => insertHTMLTag('strong', 'Texte en gras')}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Gras"
                  >
                    <strong>B</strong>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertHTMLTag('em', 'Texte en italique')}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Italique"
                  >
                    <em>I</em>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertHTMLTag('u', 'Texte souligné')}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Souligné"
                  >
                    <u>S</u>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertHTMLTag('mark', 'Texte surligné')}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Surligné"
                  >
                    <mark>M</mark>
                  </button>
                  
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  
                  <button
                    type="button"
                    onClick={() => insertHTMLTag('h1', 'Titre principal')}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Titre principal"
                  >
                    H1
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertHTMLTag('h2', 'Titre principal')}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Titre principal"
                  >
                    H2
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertHTMLTag('h3', 'Sous-titre')}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Sous-titre"
                  >
                    H3
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertHTMLTag('br', '')}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Saut de ligne"
                  >
                    ↵
                  </button>
                  
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  
                  <button
                    type="button"
                    onClick={() => insertLink()}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Insérer un lien"
                  >
                    🔗
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertImage()}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Insérer une image"
                  >
                    🖼️
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertEmail()}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Insérer un email"
                  >
                    ✉️
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertPhone()}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Insérer un téléphone"
                  >
                    📞
                  </button>
                  
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  
                  <button
                    type="button"
                    onClick={() => insertList()}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Liste à puces"
                  >
                    • Liste
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertNumberedList()}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Liste numérotée"
                  >
                    1. Liste
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertQuote()}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Citation"
                  >
                    💬
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertDivider()}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Séparateur"
                  >
                    ➖
                  </button>
                  
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  
                  <button
                    type="button"
                    onClick={() => insertTable()}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Tableau"
                  >
                    📊
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertButton()}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Bouton"
                  >
                    🔘
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertBadge()}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Badge"
                  >
                    🏷️
                  </button>
                </div>
              </div>
              
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-2">
                  Utilisez les boutons ci-dessus ou tapez directement les balises HTML :<br/>
                  <code className="bg-gray-100 px-1 rounded">&lt;strong&gt;gras&lt;/strong&gt;</code>, 
                  <code className="bg-gray-100 px-1 rounded">&lt;em&gt;italique&lt;/em&gt;</code>, 
                  <code className="bg-gray-100 px-1 rounded">&lt;a href="..."&gt;lien&lt;/a&gt;</code>
                </p>
              </div>
              
              {/* Zone d'édition avec basculement édition/aperçu */}
              <div className="space-y-4">
                {/* Bouton de basculement */}
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Texte "À propos" <span className="text-xs text-gray-500">(HTML autorisé)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
                  >
                    {showPreview ? (
                      <>
                        <Edit className="w-3 h-3" />
                        Mode édition
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        Aperçu
                      </>
                    )}
                  </button>
                </div>
                
                {/* Zone d'édition ou aperçu */}
                {showPreview ? (
                  <div className="border border-gray-300 rounded-lg p-4 bg-white min-h-[400px] max-h-[600px] overflow-y-auto">
                    <div 
                      className="prose prose-sm max-w-none"
                      style={{
                        '--tw-prose-body': '#374151',
                        '--tw-prose-headings': '#111827',
                        '--tw-prose-links': '#3B82F6',
                        '--tw-prose-bold': '#111827',
                        '--tw-prose-counters': '#6B7280',
                        '--tw-prose-bullets': '#D1D5DB',
                        '--tw-prose-hr': '#E5E7EB',
                        '--tw-prose-quotes': '#111827',
                        '--tw-prose-quote-borders': '#E5E7EB',
                        '--tw-prose-captions': '#6B7280',
                        '--tw-prose-code': '#111827',
                        '--tw-prose-pre-code': '#E5E7EB',
                        '--tw-prose-pre-bg': '#1F2937',
                        '--tw-prose-th-borders': '#D1D5DB',
                        '--tw-prose-td-borders': '#E5E7EB'
                      } as React.CSSProperties}
                      dangerouslySetInnerHTML={{ 
                        __html: config.aboutText || '<em class="text-gray-400">Aperçu en temps réel...</em>' 
                      }}
                    />
                  </div>
                ) : (
              <textarea
                    ref={textareaRef}
                    className="input-field font-mono text-sm w-full"
                    rows={20}
                value={config.aboutText}
                onChange={(e) => handleInputChange('aboutText', e.target.value)}
                    placeholder="Décrivez votre agence, votre histoire, vos valeurs...&#10;&#10;Utilisez les boutons ci-dessus pour formater votre texte facilement !"
                  />
                )}
              </div>
              
              {/* Boutons d'action */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('aboutText', '')}
                  className="px-3 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors"
                >
                  Effacer tout
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const textarea = textareaRef.current;
                    if (textarea) {
                      textarea.select();
                      document.execCommand('copy');
                      alert('Texte copié dans le presse-papiers !');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                >
                  Copier le contenu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const textarea = textareaRef.current;
                    if (textarea) {
                      const html = textarea.value;
                      navigator.clipboard.writeText(html);
                      alert('Code HTML copié dans le presse-papiers !');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-green-50 text-green-600 border border-green-200 rounded hover:bg-green-100 transition-colors"
                >
                  Copier le code HTML
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const textarea = textareaRef.current;
                    if (textarea) {
                      const text = textarea.value;
                      const plainText = text.replace(/<[^>]*>/g, '');
                      navigator.clipboard.writeText(plainText);
                      alert('Texte copié dans le presse-papiers !');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-purple-50 text-purple-600 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                >
                  Copier le texte brut
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Réseaux sociaux</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    value={config.socialLinks.facebook}
                    onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                    placeholder="https://facebook.com/votre-page"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    value={config.socialLinks.instagram}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/votre-compte"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    value={config.socialLinks.twitter}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/votre-compte"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'sections':
        return (
          <div className="space-y-8">
            {/* Section Services/Fonctionnalités */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Section Services</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.featuresSection?.enabled || false}
                    onChange={(e) => handleInputChange('featuresSection', { ...config.featuresSection, enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Afficher cette section</span>
                </label>
              </div>
              {config.featuresSection?.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre de la section
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={config.featuresSection?.title || ''}
                      onChange={(e) => handleInputChange('featuresSection', { ...config.featuresSection, title: e.target.value })}
                      placeholder="Nos Services"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Services (4 maximum)
                    </label>
                    <div className="space-y-3">
                      {(config.featuresSection?.features || []).slice(0, 4).map((feature, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-600">Service {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="text-red-50 hover:text-red-700 text-sm"
                              title="Supprimer ce service"
                            >
                              🗑️
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                              type="text"
                              className="input-field"
                              value={feature.icon || ''}
                              onChange={(e) => {
                                const newFeatures = [...(config.featuresSection?.features || [])];
                                newFeatures[index] = { ...feature, icon: e.target.value };
                                handleInputChange('featuresSection', { ...config.featuresSection, features: newFeatures });
                              }}
                              placeholder="🏖️"
                            />
                            <input
                              type="text"
                              className="input-field"
                              value={feature.title || ''}
                              onChange={(e) => {
                                const newFeatures = [...(config.featuresSection?.features || [])];
                                newFeatures[index] = { ...feature, title: e.target.value };
                                handleInputChange('featuresSection', { ...config.featuresSection, features: newFeatures });
                              }}
                              placeholder="Titre du service"
                            />
                            <input
                              type="text"
                              className="input-field"
                              value={feature.description || ''}
                              onChange={(e) => {
                                const newFeatures = [...(config.featuresSection?.features || [])];
                                newFeatures[index] = { ...feature, description: e.target.value };
                                handleInputChange('featuresSection', { ...config.featuresSection, features: newFeatures });
                              }}
                              placeholder="Description courte"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {(config.featuresSection?.features || []).length < 4 && (
                      <button
                        type="button"
                        onClick={addFeature}
                        className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        + Ajouter un service
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section Statistiques */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Section Statistiques</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.statsSection?.enabled || false}
                    onChange={(e) => handleInputChange('statsSection', { ...config.statsSection, enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Afficher cette section</span>
                </label>
              </div>
              {config.statsSection?.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statistiques (3 maximum)
                  </label>
                  <div className="space-y-3">
                    {(config.statsSection?.stats || []).map((stat, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600">Statistique {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeStat(index)}
                            className="text-red-50 hover:text-red-700 text-sm"
                            title="Supprimer cette statistique"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            className="input-field"
                            value={stat.number || ''}
                            onChange={(e) => {
                              const newStats = [...(config.statsSection?.stats || [])];
                              newStats[index] = { ...stat, number: e.target.value };
                              handleInputChange('statsSection', { ...config.statsSection, stats: newStats });
                            }}
                            placeholder="100+"
                          />
                          <input
                            type="text"
                            className="input-field"
                            value={stat.label || ''}
                            onChange={(e) => {
                              const newStats = [...(config.statsSection?.stats || [])];
                              newStats[index] = { ...stat, label: e.target.value };
                              handleInputChange('statsSection', { ...config.statsSection, stats: newStats });
                            }}
                            placeholder="Clients satisfaits"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {(config.statsSection?.stats || []).length < 3 && (
                    <button
                      type="button"
                      onClick={addStat}
                      className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      + Ajouter une statistique
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Section Témoignages */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Section Témoignages</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.testimonialsSection?.enabled || false}
                    onChange={(e) => handleInputChange('testimonialsSection', { ...config.testimonialsSection, enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Afficher cette section</span>
                </label>
              </div>
              {config.testimonialsSection?.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre de la section
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={config.testimonialsSection?.title || ''}
                      onChange={(e) => handleInputChange('testimonialsSection', { ...config.testimonialsSection, title: e.target.value })}
                      placeholder="Témoignages de nos clients"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Témoignages (2 maximum)
                    </label>
                    <div className="space-y-4">
                      {(config.testimonialsSection?.testimonials || []).map((testimonial, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-600">Témoignage {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeTestimonial(index)}
                              className="text-red-50 hover:text-red-700 text-sm"
                              title="Supprimer ce témoignage"
                            >
                              🗑️
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              className="input-field"
                              value={testimonial.name || ''}
                              onChange={(e) => {
                                const newTestimonials = [...(config.testimonialsSection?.testimonials || [])];
                                newTestimonials[index] = { ...testimonial, name: e.target.value };
                                handleInputChange('testimonialsSection', { ...config.testimonialsSection, testimonials: newTestimonials });
                              }}
                              placeholder="Nom du client"
                            />
                            <input
                              type="text"
                              className="input-field"
                              value={testimonial.role || ''}
                              onChange={(e) => {
                                const newTestimonials = [...(config.testimonialsSection?.testimonials || [])];
                                newTestimonials[index] = { ...testimonial, role: e.target.value };
                                handleInputChange('testimonialsSection', { ...config.testimonialsSection, testimonials: newTestimonials });
                              }}
                              placeholder="Rôle/Fonction"
                            />
                          </div>
                          <div className="mt-3">
                            <textarea
                              className="input-field"
                              rows={3}
                              value={testimonial.content || ''}
                              onChange={(e) => {
                                const newTestimonials = [...(config.testimonialsSection?.testimonials || [])];
                                newTestimonials[index] = { ...testimonial, content: e.target.value };
                                handleInputChange('testimonialsSection', { ...config.testimonialsSection, testimonials: newTestimonials });
                              }}
                              placeholder="Témoignage du client..."
                            />
                          </div>
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Note (1-5)
                            </label>
                            <select
                              className="input-field"
                              value={testimonial.rating || 5}
                              onChange={(e) => {
                                const newTestimonials = [...(config.testimonialsSection?.testimonials || [])];
                                newTestimonials[index] = { ...testimonial, rating: parseInt(e.target.value) };
                                handleInputChange('testimonialsSection', { ...config.testimonialsSection, testimonials: newTestimonials });
                              }}
                            >
                              {[1, 2, 3, 4, 5].map(rating => (
                                <option key={rating} value={rating}>{rating} étoile{rating > 1 ? 's' : ''}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                    {(config.testimonialsSection?.testimonials || []).length < 2 && (
                      <button
                        type="button"
                        onClick={addTestimonial}
                        className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        + Ajouter un témoignage
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                className="input-field"
                value={config.contactInfo.phone}
                onChange={(e) => handleContactInfoChange('phone', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="input-field"
                value={config.contactInfo.email}
                onChange={(e) => handleContactInfoChange('email', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={config.contactInfo.address}
                onChange={(e) => handleContactInfoChange('address', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horaires d'ouverture
              </label>
              <input
                type="text"
                className="input-field"
                value={config.contactInfo.hours}
                onChange={(e) => handleContactInfoChange('hours', e.target.value)}
                placeholder="Lun-Ven: 9h-18h, Sam: 9h-12h"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Vitrine Publique</h1>
          <p className="text-gray-600">Gérer votre site web public</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center"
          >
            {isSaving ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer
          </button>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation des onglets */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {(Array.isArray(tabs) ? tabs : []).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu de l'onglet */}
        <div className="lg:col-span-3">
          <div className="card">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitrinePage;