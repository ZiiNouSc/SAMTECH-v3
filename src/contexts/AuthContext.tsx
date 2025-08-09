import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { User, Agence } from '../types';

interface AuthContextType {
  user: User | null;
  currentAgence: Agence | null;
  userAgences: Agence[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchAgence: (agenceId: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentAgence, setCurrentAgence] = useState<Agence | null>(null);
  const [userAgences, setUserAgences] = useState<Agence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check token on startup
    const savedUser = localStorage.getItem('samtech_user');
    const savedAgenceId = localStorage.getItem('samtech_current_agence');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // If user is an agency admin or agent, fetch their agencies
        if (userData.role === 'agence' || userData.role === 'agent') {
          fetchUserAgences(userData).then(agences => {
            setUserAgences(agences);
            
            // Set current agency
            if (savedAgenceId && agences.some(a => a.id === savedAgenceId)) {
              const currentAgence = agences.find(a => a.id === savedAgenceId) || null;
              setCurrentAgence(currentAgence);
            } else if ((Array.isArray(agences) ? agences : []).length > 0) {
              setCurrentAgence(agences[0]);
              localStorage.setItem('samtech_current_agence', agences[0].id);
            }
          });
        }
      } catch (error) {
        localStorage.removeItem('samtech_user');
        localStorage.removeItem('samtech_current_agence');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('samtech_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      if (userData.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      }
    }
  }, []);

  const fetchUserAgences = async (userData: User): Promise<Agence[]> => {
    // Si userData.agences existe et contient modulesActifs, on l'utilise directement
    if (userData.agences && Array.isArray(userData.agences) && userData.agences.length > 0 && userData.agences[0].modulesActifs) {
      return userData.agences;
    }
    // Sinon, fallback sur l'API (pour les cas legacy)
    try {
      if (!userData || !userData.token) return [];
      const response = await axios.get('/api/auth/agences', {
        headers: { 'Authorization': `Bearer ${userData.token}` }
      });
      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || 'Failed to fetch user agencies');
      }
    } catch (error) {
      return [];
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Call backend API
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.data && response.data.success) {
        const userFromBackend = response.data.user;
        if (!userFromBackend || typeof userFromBackend !== 'object') {
          alert("Erreur critique: L'utilisateur retourné par le backend est absent ou invalide. Contactez l'administrateur.");
          return;
        }
        let userId = undefined;
        if ('id' in userFromBackend && userFromBackend.id) {
          userId = userFromBackend.id;
        } else if ('_id' in userFromBackend && userFromBackend._id) {
          userId = userFromBackend._id;
        }
        if (userId && typeof userId !== 'string') {
          userId = userId.toString();
        }
        if (!userId) {
          alert("Erreur critique: L'utilisateur retourné par le backend n'a pas d'identifiant (id ou _id). Contactez l'administrateur.");
          return;
        }
        const userData = {
          ...userFromBackend,
          id: userId,
          token: response.data.token // Include token in user data
        };
        setUser(userData);
        localStorage.setItem('samtech_user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        
        // Set user agencies
        if (userData.agences && Array.isArray(userData.agences) && userData.agences.length > 0) {
          setUserAgences(userData.agences);

          let current = userData.agences[0];
          if (userData.agenceId) {
            const found = userData.agences.find((a: any) => a.id === userData.agenceId || a._id === userData.agenceId);
            if (found) current = found;
          }
          setCurrentAgence(current);
          localStorage.setItem('samtech_current_agence', current.id || current._id);
        } else {
          setUserAgences([]);
          setCurrentAgence(null);
          localStorage.removeItem('samtech_current_agence');
        }
      } else {
        throw new Error(response.data.message || 'Invalid credentials');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Call backend API (optional for logout)
    axios.post('/api/auth/logout').catch(err => console.error('Error during logout:', err));
    
    setUser(null);
    setCurrentAgence(null);
    setUserAgences([]);
    localStorage.removeItem('samtech_user');
    localStorage.removeItem('samtech_current_agence');
  };

  const switchAgence = (agenceId: string) => {
    const agence = userAgences.find(a => a.id === agenceId);
    if (agence) {
      setCurrentAgence(agence);
      localStorage.setItem('samtech_current_agence', agenceId);
    }
  };

  // Fonction pour vérifier si l'utilisateur a accès à une agence spécifique
  const hasAccessToAgence = (agenceId: string): boolean => {
    if (!user) return false;
    
    // Superadmin a accès à toutes les agences
    if (user.role === 'superadmin') return true;
    
    // Vérifier si l'utilisateur a accès à cette agence
    return userAgences.some(agence => agence._id === agenceId);
  };

  const value = {
    user,
    currentAgence,
    userAgences,
    login,
    logout,
    switchAgence,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};