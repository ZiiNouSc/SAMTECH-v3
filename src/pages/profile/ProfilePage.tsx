import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Upload, 
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  Globe,
  FileText,
  CreditCard,
  User,
  Lock,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  AlertCircle,
  Settings,
  Shield,
  Link as LinkIcon,
  Unlink,
  Send
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { authAPI, agencesAPI, profileAPI } from '../../services/api';

interface ProfileData {
  // Informations de l'agence
  nom: string;
  typeActivite: string;
  pays: string;
  wilaya: string;
  adresse: string;
  siteWeb: string;
  numeroRC: string;
  numeroNIF: string;
  numeroNIS: string;
  articleImposition: string;
  email: string;
  telephone: string;
  ibanRIB: string;
  logo: File | null;
  logoUrl: string;
  // Données Gmail
  gmailConnected: boolean;
  gmailEmail: string | null;
}

interface UserData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const { user, currentAgence } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'personal' : 'agence');
  
  const [profileData, setProfileData] = useState<ProfileData>({
    nom: '',
    typeActivite: '',
    pays: '',
    wilaya: '',
    adresse: '',
    siteWeb: '',
    numeroRC: '',
    numeroNIF: '',
    numeroNIS: '',
    articleImposition: '',
    email: '',
    telephone: '',
    ibanRIB: '',
    logo: null,
    logoUrl: '',
    gmailConnected: false,
    gmailEmail: null
  });

  const [userData, setUserData] = useState<UserData>({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || ''
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoTemp, setLogoTemp] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoSaving, setLogoSaving] = useState(false);

  // Liste des wilayas algériennes
  const wilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira',
    'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda',
    'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', "M'Sila", 'Mascara', 'Ouargla',
    'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
    'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar',
    'Ouled Djellal', 'Béni Abbès', 'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', "El M'Ghair", 'El Meniaa'
  ];

  useEffect(() => {
    // Si le rôle change (connexion/déconnexion), on force l'onglet actif
    setActiveTab(isSuperAdmin ? 'personal' : 'agence');
    if (!isSuperAdmin) {
    loadProfileData();
    } else {
      setProfileData({
        nom: '',
        typeActivite: '',
        pays: '',
        wilaya: '',
        adresse: '',
        siteWeb: '',
        numeroRC: '',
        numeroNIF: '',
        numeroNIS: '',
        articleImposition: '',
        email: '',
        telephone: '',
        ibanRIB: '',
        logo: null,
        logoUrl: '',
        gmailConnected: false,
        gmailEmail: null
      });
      setUserData({
        nom: user?.nom || '',
        prenom: user?.prenom || '',
        email: user?.email || '',
        telephone: user?.telephone || ''
      });
      setLoading(false);
    }
  }, [user, currentAgence, isSuperAdmin]);

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (user && user.role === 'superadmin') {
        response = await profileAPI.getMe();
      } else if (user && user.role === 'agence' && user.agenceId) {
        response = await agencesAPI.getProfile();
      } else {
        response = await profileAPI.getProfile();
      }
      // Correction : on prend les vrais champs de la DB
      const data = response.data?.data || response.data;
        setProfileData(prev => ({
          ...prev,
        nom: data.nom || '',
          typeActivite: data.typeActivite || '',
        pays: data.pays || '',
        wilaya: data.wilaya || '',
          adresse: data.adresse || '',
          siteWeb: data.siteWeb || '',
        numeroRC: data.numeroRC || '',
        numeroNIF: data.numeroNIF || '',
        numeroNIS: data.numeroNIS || '',
          articleImposition: data.articleImposition || '',
          email: data.email || '',
          telephone: data.telephone || '',
        ibanRIB: data.ibanRIB || '',
          logo: null,
          logoUrl: data.logoUrl || data.logo || '',
        gmailConnected: !!data.gmailConnected,
          gmailEmail: data.gmailEmail || null
        }));
      // Mapping pour l'utilisateur (si présent)
      if (data.nom || data.prenom || data.email || data.telephone) {
        setUserData({
          nom: data.nom || '',
          prenom: data.prenom || '',
          email: data.email || '',
          telephone: data.telephone || ''
        });
      }
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setError("Profil non trouvé pour cet utilisateur (superadmin ou agence)");
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Erreur lors du chargement du profil");
      }
    } finally {
    setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleUserDataChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setPasswordSaving(true);
    try {
      await profileAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      alert('Mot de passe modifié avec succès');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Une erreur est survenue lors du changement de mot de passe');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleGmailConnect = async () => {
    setGmailConnecting(true);
    // On mémorise l'état initial
    const initialGmailConnected = profileData.gmailConnected;
    const initialGmailEmail = profileData.gmailEmail;
    try {
      const response = await profileAPI.getGmailAuthUrl();
      if (response.data.success) {
        const popup = window.open(response.data.data.authUrl, '_blank');
        const interval = setInterval(async () => {
          try {
            const profileResponse = await profileAPI.getProfile();
            if (profileResponse.data && profileResponse.data.success) {
              const data = profileResponse.data.data;
              setProfileData(prev => ({
                ...prev,
                gmailConnected: data.gmailConnected || false,
                gmailEmail: data.gmailEmail || null
              }));
              // On ferme la popup SEULEMENT si l'état a changé (connexion effective)
              if (
                (data.gmailConnected && data.gmailEmail && (
                  data.gmailConnected !== initialGmailConnected ||
                  data.gmailEmail !== initialGmailEmail
                ))
              ) {
                clearInterval(interval);
                if (popup) popup.close();
                await loadProfileData();
              }
            }
          } catch (err) {
            clearInterval(interval);
            if (popup) popup.close();
          }
        }, 2000);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'initialisation de la connexion Gmail');
    } finally {
      setGmailConnecting(false);
    }
  };

  const handleGmailDisconnect = async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter Gmail ?')) return;

    try {
      await profileAPI.disconnectGmail();
      setProfileData(prev => ({
        ...prev,
        gmailConnected: false,
        gmailEmail: null
      }));
      alert('Gmail déconnecté avec succès');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la déconnexion Gmail');
    }
  };

  const handleSendTestEmail = async () => {
    if (!profileData.gmailConnected) {
      alert('Veuillez d\'abord connecter votre compte Gmail');
      return;
    }

    const testEmail = prompt('Entrez l\'adresse email pour le test:', user?.email || '');
    if (!testEmail) return;

    setSendingTestEmail(true);
    try {
      await profileAPI.sendEmailViaGmail({
        to: testEmail,
        subject: 'Test d\'envoi depuis SamTech',
        message: `
          <h2>Email de test</h2>
          <p>Ceci est un email de test envoyé depuis votre compte SamTech.</p>
          <p><strong>Agence:</strong> ${profileData.nom}</p>
          <p><strong>Email Gmail connecté:</strong> ${profileData.gmailEmail}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <hr>
          <p><em>Cet email confirme que votre intégration Gmail fonctionne correctement.</em></p>
        `
      });
      
      alert('Email test envoyé avec succès ! Vérifiez la boîte de réception.');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email test');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleRefreshGmailStatus = async () => {
    try {
      await loadProfileData();
      alert('État Gmail mis à jour');
    } catch (error: any) {
      alert('Erreur lors de la mise à jour de l\'état Gmail');
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
      setProfileData(prev => ({ ...prev, logoUrl: response.data.logoUrl }));
      setLogoTemp(null);
      setLogoFile(null);
      alert('Logo enregistré avec succès !');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'upload du logo');
    } finally {
      setLogoSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // S'assurer que tous les champs requis sont présents
      const dataToSend = {
        nom: profileData.nom || '',
        typeActivite: profileData.typeActivite || 'agence-voyage',
        pays: profileData.pays || 'Algérie',
        wilaya: profileData.wilaya || '',
        adresse: profileData.adresse || '',
        siteWeb: profileData.siteWeb || '',
        numeroRC: profileData.numeroRC || '',
        numeroNIF: profileData.numeroNIF || '',
        numeroNIS: profileData.numeroNIS || '',
        articleImposition: profileData.articleImposition || '',
        email: profileData.email || '',
        telephone: profileData.telephone || '',
        ibanRIB: profileData.ibanRIB || ''
      };

      // Validation des champs requis
      if (!dataToSend.nom.trim()) {
        alert('Le nom de l\'agence est requis');
        setSaving(false);
        return;
      }

      if (!dataToSend.email.trim()) {
        alert('L\'email est requis');
        setSaving(false);
        return;
      }

      if (!dataToSend.telephone.trim()) {
        alert('Le téléphone est requis');
        setSaving(false);
        return;
      }

      if (!dataToSend.adresse.trim()) {
        alert('L\'adresse est requise');
        setSaving(false);
        return;
      }

      if (userData.email && userData.email.trim()) dataToSend.email = userData.email.trim().toLowerCase();

      const response = await agencesAPI.updateProfile(dataToSend);
      
      alert('Profil de l\'agence mis à jour avec succès');
      
      // Attendre un peu puis recharger les données depuis l'API
      setTimeout(async () => {
        await loadProfileData();
      }, 500);
      
    } catch (error: any) {
      alert(error.response?.data?.message || 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleUserDataSave = async (dataToSend: any) => {
    setSaving(true);
    setError(null);
    try {
      let response;
      if (user && user.role === 'agence' && user.agenceId) {
        response = await agencesAPI.updateProfile(dataToSend);
      } else {
        // Pour superadmin et agent, on utilise /api/auth/profile
        response = await profileAPI.updateProfile(dataToSend);
      }
      // On recharge les données après sauvegarde
        await loadProfileData();
      setSuccess(true);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Erreur lors de la sauvegarde du profil");
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const tabs = isSuperAdmin
    ? [
        { id: 'personal', label: 'Informations personnelles', icon: User },
        { id: 'security', label: 'Sécurité & Gmail', icon: Shield }
      ]
    : [
        { id: 'agence', label: "Informations de l'agence", icon: Building2 },
    { id: 'administrative', label: 'Coordonnées administratives', icon: FileText },
    { id: 'personal', label: 'Informations personnelles', icon: User },
    { id: 'security', label: 'Sécurité & Gmail', icon: Shield },
    { id: 'logo', label: 'Logo', icon: Upload }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const renderTabContent = () => {
    if (isSuperAdmin) {
      switch (activeTab) {
        case 'personal':
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input type="text" className="input-field" value={userData.nom} onChange={e => handleUserDataChange('nom', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input type="text" className="input-field" value={userData.prenom} onChange={e => handleUserDataChange('prenom', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" className="input-field" value={userData.email} onChange={e => handleUserDataChange('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input type="text" className="input-field" value={userData.telephone} onChange={e => handleUserDataChange('telephone', e.target.value)} />
              </div>
              <button className="btn-primary" onClick={() => handleUserDataSave(userData)} disabled={userSaving}>Sauvegarder</button>
            </div>
          );
        case 'security':
          return (
            <div className="space-y-6">
              {/* Section changement de mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                <input type={showPasswords.current ? 'text' : 'password'} className="input-field" value={passwordData.currentPassword} onChange={e => handlePasswordChange('currentPassword', e.target.value)} />
                <button type="button" onClick={() => togglePasswordVisibility('current')}>{showPasswords.current ? 'Cacher' : 'Afficher'}</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                <input type={showPasswords.new ? 'text' : 'password'} className="input-field" value={passwordData.newPassword} onChange={e => handlePasswordChange('newPassword', e.target.value)} />
                <button type="button" onClick={() => togglePasswordVisibility('new')}>{showPasswords.new ? 'Cacher' : 'Afficher'}</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
                <input type={showPasswords.confirm ? 'text' : 'password'} className="input-field" value={passwordData.confirmPassword} onChange={e => handlePasswordChange('confirmPassword', e.target.value)} />
                <button type="button" onClick={() => togglePasswordVisibility('confirm')}>{showPasswords.confirm ? 'Cacher' : 'Afficher'}</button>
              </div>
              <button className="btn-primary" onClick={handlePasswordSave} disabled={passwordSaving}>Changer le mot de passe</button>
            </div>
          );
        default:
          return null;
      }
    }
    switch (activeTab) {
      case 'agence':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Informations de l'agence</h4>
                  <p className="text-sm text-blue-800">
                    Ces informations définissent l'identité de votre agence dans notre système.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l’agence *
              </label>
              <input
                type="text"
                className="input-field"
                value={profileData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                placeholder="Ex: Voyages Évasion SARL"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'activité *
              </label>
              <select
                className="input-field"
                value={profileData.typeActivite}
                onChange={(e) => handleInputChange('typeActivite', e.target.value)}
              >
                <option value="">Sélectionnez votre activité</option>
                <option value="agence-voyage">Agence de voyage</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays *
              </label>
              <input
                type="text"
                className="input-field bg-gray-100"
                value={profileData.pays}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Pré-sélectionné pour l'Algérie</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wilaya *
              </label>
              <select
                className="input-field"
                value={profileData.wilaya}
                onChange={(e) => handleInputChange('wilaya', e.target.value)}
              >
                <option value="">Sélectionnez votre wilaya</option>
                {wilayas.map(wilaya => (
                  <option key={wilaya} value={wilaya}>{wilaya}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse complète *
              </label>
              <textarea
                className="input-field"
                value={profileData.adresse}
                onChange={(e) => handleInputChange('adresse', e.target.value)}
                placeholder="Numéro, rue, quartier, ville..."
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site web (facultatif)
              </label>
              <input
                type="url"
                className="input-field"
                value={profileData.siteWeb}
                onChange={(e) => handleInputChange('siteWeb', e.target.value)}
                placeholder="https://www.votre-agence.com"
              />
            </div>
          </div>
        );

      case 'administrative':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Coordonnées administratives</h4>
                  <p className="text-sm text-blue-800">
                    Ces informations sont nécessaires pour la facturation et la conformité fiscale.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                N° de registre de commerce (RC) *
              </label>
              <input
                type="text"
                className="input-field"
                value={profileData.numeroRC}
                onChange={(e) => handleInputChange('numeroRC', e.target.value)}
                placeholder="11234567 3 25100"
              />
              <p className="text-xs text-gray-500 mt-1">13 chiffres recommandés</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                N° d'identification fiscale (NIF) *
              </label>
              <input
                type="text"
                className="input-field"
                value={profileData.numeroNIF}
                onChange={(e) => handleInputChange('numeroNIF', e.target.value)}
                placeholder="123456789012345"
              />
              <p className="text-xs text-gray-500 mt-1">15 chiffres recommandés</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                N° d'identification statistique (NIS) *
              </label>
              <input
                type="text"
                className="input-field"
                value={profileData.numeroNIS}
                onChange={(e) => handleInputChange('numeroNIS', e.target.value)}
                placeholder="123456789"
              />
              <p className="text-xs text-gray-500 mt-1">9 chiffres recommandés</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article d'imposition (AI) - facultatif
              </label>
              <input
                type="text"
                className="input-field"
                value={profileData.articleImposition}
                onChange={(e) => handleInputChange('articleImposition', e.target.value)}
                placeholder="Article d'imposition"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email professionnel *
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contact@votre-agence.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone professionnel *
                </label>
                <input
                  type="tel"
                  className="input-field"
                  value={profileData.telephone}
                  onChange={(e) => handleInputChange('telephone', e.target.value)}
                  placeholder="+213 123 456 789"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IBAN / RIB (facultatif mais utile pour factures)
              </label>
              <input
                type="text"
                className="input-field"
                value={profileData.ibanRIB}
                onChange={(e) => handleInputChange('ibanRIB', e.target.value)}
                placeholder="DZ 123 456 789 012 345 678 901"
              />
              <p className="text-xs text-gray-500 mt-1">Format IBAN algérien</p>
            </div>
          </div>
        );

      case 'personal':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Informations personnelles</h4>
                  <p className="text-sm text-blue-800">
                    Ces informations définissent votre identité en tant que responsable de l'agence.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={userData.nom}
                  onChange={(e) => handleUserDataChange('nom', e.target.value)}
                  placeholder="Nom du responsable"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={userData.prenom}
                  onChange={(e) => handleUserDataChange('prenom', e.target.value)}
                  placeholder="Prénom du responsable"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email (identifiant de connexion) *
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={userData.email}
                  onChange={(e) => handleUserDataChange('email', e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone mobile *
                </label>
                <input
                  type="tel"
                  className="input-field"
                  value={userData.telephone}
                  onChange={(e) => handleUserDataChange('telephone', e.target.value)}
                  placeholder="+213 123 456 789"
                />
              </div>
            </div>

            {/* Informations du compte (lecture seule) */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900 mb-3">Informations du compte</h3>
              <div className="flex items-center">
                <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Rôle</p>
                  <p className="text-sm text-gray-900">Administrateur de l'agence</p>
                </div>
              </div>
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">ID Utilisateur</p>
                  <p className="text-sm text-gray-900">{user?.id || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Statut</p>
                  <p className="text-sm text-gray-900">
                    {user?.statut === 'actif' ? 'Compte actif' : 
                     user?.statut === 'en_attente' ? 'En attente d\'approbation' :
                     user?.statut === 'suspendu' ? 'Compte suspendu' : 'Statut inconnu'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton de sauvegarde */}
            <div className="flex justify-end">
              <button
                onClick={() => handleUserDataSave(userData)}
                disabled={userSaving}
                className="btn-primary flex items-center"
              >
                {userSaving ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Sauvegarder les informations
              </button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-8">
            {/* Section Gmail */}
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Intégration Gmail</h4>
                    <p className="text-sm text-blue-800">
                      Connectez votre compte Gmail pour envoyer automatiquement les factures et relances.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                {/* Affichage selon connexion Gmail */}
                {(profileData.gmailEmail && profileData.gmailConnected) ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-medium text-green-900 mb-2">
                      Gmail connecté
                    </h3>
                    <p className="text-sm text-green-700 mb-4">
                      {profileData.gmailEmail}
                    </p>
                    <button
                      onClick={handleGmailDisconnect}
                      className="btn-danger flex items-center justify-center mx-auto"
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Déconnecter Gmail
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Connecter Gmail
                    </h3>
                    <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                      Connectez votre compte Gmail pour envoyer automatiquement vos factures 
                      et relances directement depuis SamTech.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={handleGmailConnect}
                        disabled={gmailConnecting}
                        className="btn-primary flex items-center"
                      >
                        {gmailConnecting ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <LinkIcon className="w-4 h-4 mr-2" />
                        )}
                        {gmailConnecting ? 'Connexion...' : 'Connecter Gmail'}
                      </button>
                      <button
                        onClick={handleRefreshGmailStatus}
                        className="btn-secondary flex items-center"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Rafraîchir l'état
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section Mot de passe */}
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Lock className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Sécurité du compte</h4>
                    <p className="text-sm text-blue-800">
                      Modifiez votre mot de passe pour sécuriser votre compte.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Mot de passe actuel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe actuel *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      className="input-field pr-10"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="Votre mot de passe actuel"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      className="input-field pr-10"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="Nouveau mot de passe (min. 8 caractères)"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirmation du nouveau mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      className="input-field pr-10"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Confirmez le nouveau mot de passe"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bouton de sauvegarde */}
                <div className="flex justify-end">
                  <button
                    onClick={handlePasswordSave}
                    disabled={passwordSaving}
                    className="btn-primary flex items-center"
                  >
                    {passwordSaving ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Changer le mot de passe
                  </button>
                </div>
              </div>

              {/* Note d'information */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Sécurité du compte
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>L'autorisation Gmail est sécurisée et limitée à l'envoi d'emails</li>
                        <li>Vous pouvez révoquer l'accès à tout moment</li>
                        <li>Vos emails et données Gmail restent privés</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'logo':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Logo de l'agence</h4>
                  <p className="text-sm text-blue-800">
                    Votre logo apparaîtra sur vos factures et votre vitrine publique.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                {(logoTemp || profileData.logoUrl) ? (
                  <div className="space-y-4">
                    <img
                      src={logoTemp || (profileData.logoUrl ? `http://localhost:8001${profileData.logoUrl}` : '')}
                      alt="Logo preview"
                      className="mx-auto h-24 w-auto max-w-full"
                    />
                    <p className="text-sm text-gray-600">Logo actuel</p>
                    <div className="flex justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => { setLogoTemp(null); setLogoFile(null); setProfileData(prev => ({ ...prev, logoUrl: '' })); }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Supprimer
                      </button>
                      {logoTemp && logoFile && (
                        <button
                          type="button"
                          onClick={handleLogoSave}
                          className="btn-primary btn-sm"
                          disabled={logoSaving}
                        >
                          {logoSaving ? 'Enregistrement...' : 'Enregistrer le logo'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div>
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-700 font-medium">
                          Cliquez pour télécharger
                        </span>
                        <span className="text-gray-600"> ou glissez-déposez</span>
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Conseil :</strong> Utilisez un format carré ou rectangulaire avec un fond transparent pour un meilleur rendu sur vos factures.
              </p>
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
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Profil de l'Agence</h1>
          <p className="text-gray-600">Gérer les informations de votre agence et de votre compte</p>
        </div>
        {(activeTab === 'agence' || activeTab === 'administrative') && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center"
          >
            {saving ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer
          </button>
        )}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation des onglets */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
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

export default ProfilePage;