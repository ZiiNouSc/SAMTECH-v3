import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Search, LogOut, User, Settings, Menu, ChevronDown, Building2, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
// import { notificationsAPI } from '../../services/api';

interface HeaderProps {
  onMenuToggle?: () => void;
}

// interface Notification {
//   id: string;
//   titre: string;
//   message: string;
//   statut: 'envoye' | 'en_attente' | 'echec' | 'lu';
//   dateCreation: string;
//   type: 'email' | 'sms' | 'push' | 'systeme';
// }

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout, switchAgence, currentAgence, userAgences } = useAuth();
  const navigate = useNavigate();
  // const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAgencesMenu, setShowAgencesMenu] = useState(false);
  // const [notifications, setNotifications] = useState<Notification[]>([]);
  // const [loadingNotifications, setLoadingNotifications] = useState(false);
  // const [apiAvailable, setApiAvailable] = useState(true); // Pour éviter les appels répétés
  // const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const agencesMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    setShowUserMenu(false);
    navigate('/parametres');
  };

  const handleSwitchAgence = (agenceId: string) => {
    if (agenceId) {
      switchAgence(agenceId);
      setShowAgencesMenu(false);
    }
  };

  // const fetchNotifications = useCallback(async () => {
  //   // Ne pas appeler l'API si elle n'est pas disponible
  //   if (!apiAvailable) {
  //     return;
  //   }

  //   try {
  //     setLoadingNotifications(true);
      
  //     let response;
      
  //     // Choisir l'endpoint selon le rôle
  //     if (user?.role === 'superadmin') {
  //       response = await notificationsAPI.getAll();
  //     } else if (user?.role === 'agence') {
  //       response = await notificationsAPI.getAgencyNotifications();
  //     } else {
  //       // Pour les agents
  //       response = await notificationsAPI.getUserNotifications();
  //     }
      
  //     // Gérer différents formats de réponse
  //     if (response.data && (response.data.success || Array.isArray(response.data))) {
  //       const data = response.data.success ? response.data.data : response.data;
  //       setNotifications(Array.isArray(data) ? data : []);
  //     }
  //   } catch (error: any) {
  //     // Si l'API retourne 404, marquer comme non disponible
  //     if (error.response?.status === 404) {
  //       setApiAvailable(false);
  //       setNotifications([]);
  //       return;
  //     }
      
  //     // Ne pas afficher d'erreur dans la console pour les 404 (API non implémentée)
  //     if (error.response?.status !== 404) {
  //       console.error('Erreur lors du chargement des notifications:', error);
  //     }
      
  //     // Ne pas afficher d'erreur dans la navbar, juste vider les notifications
  //     // L'API n'est pas encore implémentée, c'est normal
  //     setNotifications([]);
  //   } finally {
  //     setLoadingNotifications(false);
  //   }
  // }, [user?.role, apiAvailable]);

  // // Charger les notifications au montage et toutes les 60 secondes
  // useEffect(() => {
  //   // Ne pas appeler l'API si l'utilisateur n'est pas connecté
  //   if (!user) {
  //     setNotifications([]);
  //     setApiAvailable(true); // Réinitialiser l'état de l'API
  //     return;
  //   }
    
  //   // Réinitialiser l'état de l'API pour le nouvel utilisateur
  //   setApiAvailable(true);
  //   fetchNotifications();
    
  //   // Rafraîchir moins souvent si l'API n'est pas disponible
  //   const interval = setInterval(() => {
  //     fetchNotifications();
  //   }, 60000); // Rafraîchir toutes les 60 secondes
    
  //   return () => clearInterval(interval);
  // }, [user, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
      //   setShowNotifications(false);
      // }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (agencesMenuRef.current && !agencesMenuRef.current.contains(event.target as Node)) {
        setShowAgencesMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // // Calculer les notifications non lues
  // const unreadCount = notifications.filter(n => n.statut !== 'lu').length;

  // // Fonction pour formater le temps relatif
  // const getRelativeTime = (dateString: string) => {
  //   const date = new Date(dateString);
  //   const now = new Date();
  //   const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
  //   if (diffInMinutes < 1) return 'À l\'instant';
  //   if (diffInMinutes < 60) return `${diffInMinutes} min`;
  //   if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
  //   return `${Math.floor(diffInMinutes / 1440)}j`;
  // };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 space-x-4">
          {/* Menu mobile */}
          <div className="lg:hidden">
            <button
              onClick={onMenuToggle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher dans SamTech..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
            />
          </div>

          {/* Agency Selector - Only show for agency admins or agents with multiple agencies */}
          {(user?.role === 'agence' || user?.role === 'agent') && (Array.isArray(userAgences) ? userAgences : []).length > 1 && (
            <div className="relative ml-4" ref={agencesMenuRef}>
              <button 
                onClick={() => setShowAgencesMenu(!showAgencesMenu)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Building2 className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 hidden md:block">
                  {currentAgence?.nom || userAgences[0]?.nom || 'Sélectionner une agence'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown menu agences */}
              {showAgencesMenu && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-slide-up">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-medium text-gray-900">Changer d'agence</p>
                  </div>
                  <div className="py-2">
                    {(Array.isArray(userAgences) ? userAgences : []).map(agence => (
                      <button 
                        key={agence.id}
                        onClick={() => handleSwitchAgence(agence.id)}
                        className={`w-full flex items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          (currentAgence?.id || userAgences[0]?.id) === agence.id 
                            ? 'text-blue-600 font-medium' 
                            : 'text-gray-700'
                        }`}
                      >
                        <Building2 className="w-4 h-4 mr-3" />
                        {agence.nom}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications - COMMENTÉ TEMPORAIREMENT */}
          {/* <div className="relative" ref={notificationsRef}>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-slide-up">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">{unreadCount} non lues</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Chargement...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-gray-500">Aucune notification</p>
                  </div>
                ) : (
                  notifications.map((notification, index) =>
                    <div 
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                        notification.statut !== 'lu' ? 'border-blue-500 bg-blue-50/30' : 'border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            notification.statut !== 'lu' ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.titre}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">{getRelativeTime(notification.dateCreation)}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="px-4 py-2 border-t border-gray-100">
                <button 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notifications');
                  }}
                >
                  Voir toutes les notifications
                </button>
              </div>
            </div>
          </div> */}

          {/* Menu utilisateur */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="font-medium text-gray-900 text-sm">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-medium">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {/* Dropdown menu utilisateur */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-slide-up">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-medium text-gray-900">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2 capitalize mt-2">
                    {user?.role}
                  </span>
                </div>
                
                <div className="py-2">
                  {user?.role === 'agence' && (
                    <button 
                      onClick={handleProfileClick}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Mon profil
                    </button>
                  )}
                  
                  <button 
                    onClick={handleSettingsClick}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Paramètres
                  </button>
                </div>
                
                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;