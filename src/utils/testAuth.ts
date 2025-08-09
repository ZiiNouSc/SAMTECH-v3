// Script utilitaire pour tester l'authentification
export const testAuth = async () => {
  try {
    // Test 1: Vérifier si l'utilisateur est stocké dans localStorage
    const savedUser = localStorage.getItem('samtech_user');
    
    if (savedUser) {
      const userData = JSON.parse(savedUser);
    }

    // Test 2: Tester une requête API simple
    const response = await fetch('/api/dashboard/agence/stats', {
      headers: {
        'Authorization': savedUser ? `Bearer ${JSON.parse(savedUser).token}` : ''
      }
    });
    
    return {
      success: response.ok,
      status: response.status,
      hasUser: !!savedUser,
      hasToken: savedUser ? !!JSON.parse(savedUser).token : false
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

// Fonction pour forcer la connexion en mode développement
export const forceDevLogin = () => {
  const devUser = {
    id: '60d0fe4f5311236168a109ca',
    email: 'superadmin@samtech.com',
    nom: 'Admin',
    prenom: 'Super',
    role: 'superadmin',
    token: 'dev-token-123',
    statut: 'actif'
  };
  
  localStorage.setItem('samtech_user', JSON.stringify(devUser));
  
  // Recharger la page pour appliquer les changements
  window.location.reload();
};

// Fonction pour se connecter avec le compte SCZ AGENCY
export const loginAsSCZ = async () => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'scz@scz.com',
        password: 'demo123'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const userData = {
        ...data.user,
        token: data.token
      };
      
      localStorage.setItem('samtech_user', JSON.stringify(userData));
      
      // Recharger la page pour appliquer les changements
      window.location.reload();
    } else {
    }
  } catch (error) {
  }
}; 