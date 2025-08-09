const asyncHandler = require('express-async-handler');
const { google } = require('googleapis');
const Agence = require('../models/agenceModel');
const User = require('../models/userModel');
const AuditLog = require('../models/auditModel');
const { buildImageUrl } = require('../utils/urlHelper');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuration OAuth2 pour Gmail
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Fonction utilitaire pour créer un log d'audit
const createAuditLog = async (userId, userName, userRole, action, details, req, affectedResource = null) => {
  try {
    await AuditLog.createLog({
      userId,
      userName,
      userRole,
      action,
      module: 'profile',
      details,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      affectedResource
    });
  } catch (error) {
    console.error('Erreur lors de la création du log d\'audit:', error);
  }
};

// Multer config pour upload logo agence
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    let agenceId = req.user?.agenceId;
    const agence = await Agence.findById(agenceId);
    const dossier = path.join(__dirname, '../uploads/agences/', agence ? (agence.nom?.replace(/\s+/g, '_') || agenceId) : agenceId);
    fs.mkdirSync(dossier, { recursive: true });
    cb(null, dossier);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, 'logo' + ext);
  }
});
const upload = multer({ storage });

// @desc    Get profile
// @route   GET /api/profile
// @access  Private/Agency
const getProfile = asyncHandler(async (req, res) => {
  // In a real app, get agenceId from authenticated user
  let agenceId = req.user?.agenceId;
  
  // En mode développement, si pas d'agenceId, essayer de récupérer l'utilisateur complet
  if (!agenceId && process.env.NODE_ENV === 'development') {
    // Récupérer l'utilisateur complet depuis la base de données
    const user = await User.findById(req.user._id);
    if (user && user.agenceId) {
      agenceId = user.agenceId;
    } else {
      // Si toujours pas d'agenceId, prendre la première agence (fallback)
      const firstAgence = await Agence.findOne();
      if (firstAgence) {
        agenceId = firstAgence._id;
      }
    }
  }
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const agence = await Agence.findById(agenceId);
  
  if (!agence) {
    return res.status(404).json({
      success: false,
      message: 'Agence non trouvée'
    });
  }
  
  // Parse address components
  const addressParts = agence.adresse ? agence.adresse.split(',') : [];
  const adresse = addressParts[0] ? addressParts[0].trim() : '';
  const villeCodePostal = addressParts[1] ? addressParts[1].trim() : '';
  const pays = addressParts[2] ? addressParts[2].trim() : '';
  
  // Extract ville and code postal
  const villeCodePostalParts = villeCodePostal.split(' ');
  const codePostal = villeCodePostalParts[0] || '';
  const ville = villeCodePostalParts.slice(1).join(' ') || '';
  
  // Create profile data from agence (only real data, no defaults)
  const profileData = {
    nom: agence.nom || '',
    typeActivite: agence.typeActivite || '',
    pays: agence.pays || '',
    wilaya: agence.wilaya || '',
    adresse: agence.adresse || '',
    siteWeb: agence.siteWeb || '',
    numeroRC: agence.numeroRC || '',
    numeroNIF: agence.numeroNIF || '',
    numeroNIS: agence.numeroNIS || '',
    articleImposition: agence.articleImposition || '',
    email: agence.email || '',
    telephone: agence.telephone || '',
    ibanRIB: agence.ibanRIB || '',
    logo: agence.logoUrl ? buildImageUrl(agence.logoUrl) : null,
    logoUrl: agence.logoUrl ? buildImageUrl(agence.logoUrl) : '',
    gmailConnected: !!(agence.gmailToken && agence.gmailRefreshToken),
    gmailEmail: agence.gmailEmail || null
  };
  
  res.status(200).json({
    success: true,
    data: profileData
  });
});

// @desc    Get Gmail authorization URL
// @route   GET /api/profile/gmail/auth-url
// @access  Private
const getGmailAuthUrl = asyncHandler(async (req, res) => {
  console.log('getGmailAuthUrl - req.user:', req.user);
  console.log('getGmailAuthUrl - req.user._id:', req.user?._id);
  
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié'
    });
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    state: req.user._id.toString(), // Convertir en string pour être sûr
    prompt: 'select_account consent' // <-- Ajouté pour forcer le choix du compte et l'autorisation
  });

  console.log('getGmailAuthUrl - authUrl:', authUrl);

  res.status(200).json({
    success: true,
    data: { authUrl }
  });
});

// @desc    Handle Gmail OAuth callback
// @route   GET /api/profile/gmail/callback
// @access  Public (Google redirige ici)
const handleGmailCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Code d\'autorisation manquant'
    });
  }

  if (!state) {
    return res.status(400).json({
      success: false,
      message: 'État d\'autorisation manquant'
    });
  }

  try {
    // Récupérer l'utilisateur à partir du state (qui contient l'ID utilisateur)
    const user = await User.findById(state);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Échanger le code contre des tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Obtenir les informations de l'utilisateur Gmail
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Mettre à jour l'agence avec les tokens Gmail
    const agenceId = user.agenceId;
    const agence = await Agence.findById(agenceId);
    
    if (!agence) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      });
    }

    agence.gmailToken = tokens.access_token;
    agence.gmailRefreshToken = tokens.refresh_token;
    agence.gmailEmail = userInfo.data.email;
    agence.gmailConnected = true;
    await agence.save();

    // Log d'audit
    await createAuditLog(
      user._id,
      user.nom + ' ' + user.prenom,
      user.role,
      'CONNECT',
      `Connexion Gmail réussie pour l'email: ${userInfo.data.email}`,
      req,
      `agence:${agenceId}`
    );

    // Renvoyer une page HTML qui notifie la fenêtre parent et ferme l'onglet
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GMAIL_CONNECTED', email: '${userInfo.data.email}' }, '*');
              window.close();
            } else {
              document.write('Connexion Gmail réussie. Vous pouvez fermer cette fenêtre.');
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Erreur lors de la connexion Gmail:', error);
    
    // Log d'audit pour l'erreur (si on a pu récupérer l'utilisateur)
    if (state) {
      try {
        const user = await User.findById(state);
        if (user) {
          await createAuditLog(
            user._id,
            user.nom + ' ' + user.prenom,
            user.role,
            'ERROR',
            `Échec de la connexion Gmail: ${error.message}`,
            req
          );
        }
      } catch (logError) {
        console.error('Erreur lors du log d\'audit:', logError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion à Gmail',
      error: error.message
    });
  }
});

// @desc    Disconnect Gmail
// @route   DELETE /api/profile/gmail/disconnect
// @access  Private
const disconnectGmail = asyncHandler(async (req, res) => {
  const agenceId = req.user.agenceId;
  const agence = await Agence.findById(agenceId);
  
  if (!agence) {
    return res.status(404).json({
      success: false,
      message: 'Agence non trouvée'
    });
  }

  const oldEmail = agence.gmailEmail;

  // Supprimer les tokens Gmail
  agence.gmailToken = undefined;
  agence.gmailRefreshToken = undefined;
  agence.gmailEmail = undefined;
  await agence.save();

  // Log d'audit
  await createAuditLog(
    req.user._id,
    req.user.nom + ' ' + req.user.prenom,
    req.user.role,
    'DISCONNECT',
    `Déconnexion Gmail pour l'email: ${oldEmail}`,
    req,
    `agence:${agenceId}`
  );

  res.status(200).json({
    success: true,
    message: 'Compte Gmail déconnecté avec succès'
  });
});

// @desc    Send email via Gmail
// @route   POST /api/profile/gmail/send
// @access  Private
const sendEmailViaGmail = asyncHandler(async (req, res) => {
  const { to, subject, message, attachments = [] } = req.body;
  
  if (!to || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Destinataire, objet et message sont requis'
    });
  }

  const agenceId = req.user.agenceId;
  const agence = await Agence.findById(agenceId);
  
  if (!agence || !agence.gmailToken) {
    return res.status(400).json({
      success: false,
      message: 'Compte Gmail non connecté'
    });
  }

  try {
    // Configurer OAuth2 avec les tokens de l'agence
    oauth2Client.setCredentials({
      access_token: agence.gmailToken,
      refresh_token: agence.gmailRefreshToken
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Créer l'email
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      message
    ];

    const email = emailLines.join('\n');
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    // Envoyer l'email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    // Log d'audit
    await createAuditLog(
      req.user._id,
      req.user.nom + ' ' + req.user.prenom,
      req.user.role,
      'SEND_EMAIL',
      `Email envoyé via Gmail à: ${to}, Objet: ${subject}`,
      req,
      `email:${response.data.id}`
    );

    res.status(200).json({
      success: true,
      message: 'Email envoyé avec succès via Gmail',
      data: {
        messageId: response.data.id,
        sentTo: to,
        subject: subject
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    
    // Log d'audit pour l'erreur
    await createAuditLog(
      req.user._id,
      req.user.nom + ' ' + req.user.prenom,
      req.user.role,
      'ERROR',
      `Échec envoi email Gmail à ${to}: ${error.message}`,
      req
    );

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email',
      error: error.message
    });
  }
});

// @desc    Update profile
// @route   PUT /api/profile
// @access  Private/Agency
const updateProfile = asyncHandler(async (req, res) => {
  // In a real app, get agenceId from authenticated user
  let agenceId = req.user?.agenceId;
  
  // En mode développement, si pas d'agenceId, essayer de récupérer l'utilisateur complet
  if (!agenceId && process.env.NODE_ENV === 'development') {
    // Récupérer l'utilisateur complet depuis la base de données
    const user = await User.findById(req.user._id);
    if (user && user.agenceId) {
      agenceId = user.agenceId;
    } else {
      // Si toujours pas d'agenceId, prendre la première agence (fallback)
      const firstAgence = await Agence.findOne();
      if (firstAgence) {
        agenceId = firstAgence._id;
      }
    }
  }
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  const agence = await Agence.findById(agenceId);
  
  if (!agence) {
    return res.status(404).json({
      success: false,
      message: 'Agence non trouvée'
    });
  }
  
  const {
    nomAgence,
    typeActivite,
    siret,
    adresse,
    ville,
    codePostal,
    pays,
    telephone,
    email,
    siteWeb,
    raisonSociale,
    numeroTVA,
    numeroLicence,
    garantieFinanciere,
    assuranceRC,
    banque,
    rib,
    swift
  } = req.body;
  
  // Update agence data
  agence.nom = nomAgence || agence.nom;
  agence.typeActivite = typeActivite || agence.typeActivite;
  agence.siret = siret || agence.siret;
  agence.adresse = `${adresse}, ${codePostal} ${ville}, ${pays}`;
  agence.telephone = telephone || agence.telephone;
  agence.email = email || agence.email;
  agence.siteWeb = siteWeb || agence.siteWeb;
  agence.raisonSociale = raisonSociale || agence.raisonSociale;
  agence.numeroTVA = numeroTVA || agence.numeroTVA;
  agence.banque = banque || agence.banque;
  agence.rib = rib || agence.rib;
  agence.swift = swift || agence.swift;
  
  await agence.save();
  
  // Also update user data if email changed
  if (email && email !== agence.email) {
    const user = await User.findOne({ agenceId });
    
    if (user) {
      user.email = email;
      await user.save();
    }
  }
  
  res.status(200).json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: agence
  });
});

// @desc    Update logo
// @route   POST /api/profile/logo
// @access  Private/Agency
const updateLogo = asyncHandler(async (req, res) => {
  console.log('Fichier reçu:', req.file);
  let agenceId = req.user?.agenceId;
  if (!agenceId) {
    return res.status(400).json({ success: false, message: "ID d'agence manquant" });
  }
  const agence = await Agence.findById(agenceId);
  if (!agence) {
    return res.status(404).json({ success: false, message: 'Profil non trouvé' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
  }
  // Chemin relatif pour le frontend - utiliser le serveur backend
  const dossier = `/uploads/agences/${agence.nom?.replace(/\s+/g, '_') || agenceId}`;
  const logoUrl = `${dossier}/${req.file.filename}`;
  agence.logoUrl = logoUrl;
  await agence.save();
  res.status(200).json({ success: true, message: 'Logo mis à jour avec succès', data: { logoUrl } });
});

// @desc    Update user data (nom, email)
// @route   PUT /api/profile/user
// @access  Private
const updateUserData = asyncHandler(async (req, res) => {
  const { nomComplet, email } = req.body;
  
  if (!nomComplet || !email) {
    return res.status(400).json({
      success: false,
      message: 'Nom complet et email sont requis'
    });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Email invalide'
    });
  }
  
  // Vérifier si l'email existe déjà (sauf pour l'utilisateur actuel)
  const existingUser = await User.findOne({ 
    email: { $regex: new RegExp(`^${email}$`, 'i') }, 
    _id: { $ne: req.user._id } 
  });
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Cet email est déjà utilisé'
    });
  }
  
  // Mettre à jour l'utilisateur
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }
  
  // Séparer nom et prénom du nom complet
  const nameParts = nomComplet.trim().split(' ');
  const nom = nameParts[0] || '';
  const prenom = nameParts.slice(1).join(' ') || '';
  
  user.nom = nom;
  user.prenom = prenom;
  user.email = email;
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Informations personnelles mises à jour avec succès',
    user: {
      id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email
    }
  });
});

// @desc    Update password
// @route   PUT /api/profile/password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Mot de passe actuel et nouveau mot de passe sont requis'
    });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
    });
  }
  
  // Récupérer l'utilisateur avec le mot de passe hashé
  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }
  
  // Vérifier le mot de passe actuel avec la méthode du modèle
  const isMatch = await user.matchPassword(currentPassword);
  
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Mot de passe actuel incorrect'
    });
  }
  
  // Mettre à jour le mot de passe (le middleware pre-save va automatiquement hasher)
  user.password = newPassword;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Mot de passe modifié avec succès'
  });
});

module.exports = {
  getProfile,
  updateProfile,
  updateLogo,
  upload,
  updateUserData,
  updatePassword,
  getGmailAuthUrl,
  handleGmailCallback,
  disconnectGmail,
  sendEmailViaGmail
};