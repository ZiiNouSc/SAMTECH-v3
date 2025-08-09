const AuditLog = require('../models/auditModel');

// Middleware pour logger automatiquement les actions d'audit
const auditMiddleware = (action, module, details = '') => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    // Intercepter la réponse pour calculer la durée
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // Créer le log d'audit de manière asynchrone (ne pas bloquer la réponse)
      createAuditLog(req, action, module, details, duration, res.statusCode < 400)
        .catch(error => console.error('Erreur lors de la création du log d\'audit:', error));
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Fonction pour créer un log d'audit
const createAuditLog = async (req, action, module, details, duration, success) => {
  try {
    if (!req.user) {
      console.warn('Tentative de création de log d\'audit sans utilisateur authentifié');
      return;
    }

    const logData = {
      userId: req.user._id,
      userName: req.user.nom + ' ' + req.user.prenom,
      userRole: req.user.role,
      action,
      module,
      details: details || `${action} sur ${module}`,
      ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      success,
      duration,
      affectedResource: req.params.id ? `${module}:${req.params.id}` : null,
      metadata: {
        method: req.method,
        url: req.originalUrl,
        statusCode: req.statusCode
      }
    };

    // Ajouter les données de changement pour les actions UPDATE
    if (action === 'UPDATE' && req.body && Object.keys(req.body).length > 0) {
      logData.newValue = req.body;
    }

    // Ajouter les données de création pour les actions CREATE
    if (action === 'CREATE' && req.body && Object.keys(req.body).length > 0) {
      logData.newValue = req.body;
    }

    await AuditLog.createLog(logData);
  } catch (error) {
    console.error('Erreur lors de la création du log d\'audit:', error);
  }
};

// Fonction utilitaire pour logger manuellement
const logAuditEvent = async (req, action, module, details, success = true, duration = 0, oldValue = null, newValue = null) => {
  try {
    if (!req.user) {
      console.warn('Tentative de création de log d\'audit sans utilisateur authentifié');
      return;
    }

    const logData = {
      userId: req.user._id,
      userName: req.user.nom + ' ' + req.user.prenom,
      userRole: req.user.role,
      action,
      module,
      details,
      ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      success,
      duration,
      oldValue,
      newValue
    };

    await AuditLog.createLog(logData);
  } catch (error) {
    console.error('Erreur lors de la création du log d\'audit manuel:', error);
  }
};

// Fonction pour logger les connexions/déconnexions
const logAuthEvent = async (req, action, success, errorMessage = null) => {
  try {
    const logData = {
      userId: req.user?._id || null,
      userName: req.user ? `${req.user.nom} ${req.user.prenom}` : 'Utilisateur inconnu',
      userRole: req.user?.role || 'guest',
      action,
      module: 'auth',
      details: action === 'LOGIN' ? 'Tentative de connexion' : 'Déconnexion',
      ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      success,
      errorMessage
    };

    await AuditLog.createLog(logData);
  } catch (error) {
    console.error('Erreur lors de la création du log d\'authentification:', error);
  }
};

module.exports = {
  auditMiddleware,
  createAuditLog,
  logAuditEvent,
  logAuthEvent
}; 