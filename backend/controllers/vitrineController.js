const asyncHandler = require('express-async-handler');
const Agence = require('../models/agenceModel');
const { buildImageUrl } = require('../utils/urlHelper');

// @desc    Get vitrine config
// @route   GET /api/vitrine
// @access  Private/Agency
const getVitrineConfig = asyncHandler(async (req, res) => {
  // In a real app, get agenceId from authenticated user
  const agenceId = req.user?.agenceId;
  
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: "ID d'agence manquant"
    });
  }
  
  const agence = await Agence.findById(agenceId);
  
  if (!agence) {
    return res.status(404).json({
      success: false,
      message: 'Agence non trouvée'
    });
  }
  
  console.log('Agence trouvée (admin):', agence.nom); // Debug
  console.log('Logo URL de l\'agence (admin):', agence.logoUrl); // Debug
  console.log('Vitrine config existante (admin):', agence.vitrineConfig); // Debug
  
  // Base de configuration complète
  const baseConfig = {
    isActive: true,
    domainName: `${agence.nom.toLowerCase().replace(/\s+/g, '-')}.samtech.fr`,
    title: `${agence.nom} - Votre Agence de Voyage`,
    description: `Découvrez nos offres de voyage exceptionnelles et partez à la découverte du monde avec ${agence.nom}.`,
    slogan: `Votre partenaire de confiance pour des voyages inoubliables`,
    logo: agence.logoUrl || '', // Utiliser le logo de l'agence par défaut
    bannerImage: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    contactInfo: {
      phone: agence.telephone,
      email: agence.email,
      address: agence.adresse,
      hours: 'Lun-Ven: 9h-18h, Sam: 9h-12h'
    },
    aboutText: `${agence.nom} est votre partenaire de confiance pour tous vos projets de voyage. Avec plus de 15 ans d'expérience, nous vous accompagnons dans la réalisation de vos rêves d'évasion.`,
    socialLinks: {
      facebook: `https://facebook.com/${agence.nom.toLowerCase().replace(/\s+/g, '-')}`,
      instagram: `https://instagram.com/${agence.nom.toLowerCase().replace(/\s+/g, '-')}`,
      twitter: `https://twitter.com/${agence.nom.toLowerCase().replace(/\s+/g, '-')}`
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
  };

  // Fusionne la config existante avec la base pour garantir que tous les champs sont présents
  const completeConfig = { ...baseConfig, ...(agence.vitrineConfig || {}) };
  completeConfig.contactInfo = { ...baseConfig.contactInfo, ...(agence.vitrineConfig?.contactInfo || {}) };
  completeConfig.socialLinks = { ...baseConfig.socialLinks, ...(agence.vitrineConfig?.socialLinks || {}) };
  
  // Fusionner les nouvelles sections si elles existent
  if (agence.vitrineConfig?.featuresSection) {
    completeConfig.featuresSection = { ...baseConfig.featuresSection, ...agence.vitrineConfig.featuresSection };
  }
  if (agence.vitrineConfig?.statsSection) {
    completeConfig.statsSection = { ...baseConfig.statsSection, ...agence.vitrineConfig.statsSection };
  }
  if (agence.vitrineConfig?.testimonialsSection) {
    completeConfig.testimonialsSection = { ...baseConfig.testimonialsSection, ...agence.vitrineConfig.testimonialsSection };
  }
  
  // S'assurer que le logo de l'agence est utilisé si aucun logo n'est défini dans la vitrine
  if (!completeConfig.logo && agence.logoUrl) {
    completeConfig.logo = agence.logoUrl;
  }
  
  // S'assurer que la bannière de l'agence est utilisée si aucune bannière n'est définie dans la vitrine
  // La bannière est stockée dans vitrineConfig.bannerImage, pas au niveau racine
  if (!completeConfig.bannerImage && agence.vitrineConfig?.bannerImage) {
    completeConfig.bannerImage = agence.vitrineConfig.bannerImage;
  }
  
  // Toujours régénérer le domainName à partir du nom de l'agence
  const isDev = process.env.NODE_ENV !== 'production';
  const slug = agence.slug || agence.nom.toLowerCase().replace(/\s+/g, '-');
  completeConfig.domainName = isDev
    ? `localhost:5173/site/${slug}`
    : `${slug}.samtech.fr`;

  // Synchronise le slug dans la config retournée
  completeConfig.slug = agence.slug;

  // Corriger le logo et la bannière pour qu'ils soient toujours des URLs absolues
  if (completeConfig.logo) {
    completeConfig.logo = buildImageUrl(completeConfig.logo);
  }
  if (completeConfig.bannerImage) {
    completeConfig.bannerImage = buildImageUrl(completeConfig.bannerImage);
  }

  console.log('Config finale (admin) - Logo:', completeConfig.logo); // Debug
  console.log('Config finale (admin) - Banner:', completeConfig.bannerImage); // Debug

  // Si la config n'existe pas ou est vide, on la sauvegarde avec la structure complète
  if (!agence.vitrineConfig || Object.keys(agence.vitrineConfig).length === 0) {
    agence.vitrineConfig = completeConfig;
    await agence.save();
  } else {
    // Migrer la configuration existante si nécessaire
    await agence.migrateVitrineConfig();
  }

  res.status(200).json({
    success: true,
    data: completeConfig
  });
});

// @desc    Update vitrine config
// @route   PUT /api/vitrine
// @access  Private/Agency
const updateVitrineConfig = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  if (!agenceId) {
    return res.status(400).json({ success: false, message: "ID d'agence manquant" });
  }
  const agence = await Agence.findById(agenceId);
  if (!agence) {
    return res.status(404).json({ success: false, message: 'Agence non trouvée' });
  }
  // Si le slug est fourni et différent, on le met à jour (en vérifiant l'unicité)
  if (req.body.slug && req.body.slug !== agence.slug) {
    const slugExists = await Agence.findOne({ slug: req.body.slug });
    if (slugExists) {
      return res.status(400).json({ success: false, message: 'Ce slug est déjà utilisé par une autre agence.' });
    }
    agence.slug = req.body.slug;
  }
  agence.vitrineConfig = req.body;
  await agence.save();
  res.status(200).json({
    success: true,
    message: 'Configuration de la vitrine mise à jour avec succès',
    data: agence.vitrineConfig,
    slug: agence.slug
  });
});

// @desc    Toggle vitrine active status
// @route   PUT /api/vitrine/toggle
// @access  Private/Agency
const toggleVitrineActive = asyncHandler(async (req, res) => {
  // In a real app, get agenceId from authenticated user
  const agenceId = req.user?.agenceId;
  
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
  
  // Create vitrine config if it doesn't exist
  if (!agence.vitrineConfig) {
    agence.vitrineConfig = {
      isActive: true,
      domainName: `${agence.nom.toLowerCase().replace(/\s+/g, '-')}.samtech.fr`,
      title: `${agence.nom} - Votre Agence de Voyage`,
      description: `Découvrez nos offres de voyage exceptionnelles et partez à la découverte du monde avec ${agence.nom}.`,
      slogan: `Votre partenaire de confiance pour des voyages inoubliables`,
      logo: '',
      bannerImage: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      showPackages: true,
      showContact: true,
      showAbout: true,
      contactInfo: {
        phone: agence.telephone,
        email: agence.email,
        address: agence.adresse,
        hours: 'Lun-Ven: 9h-18h, Sam: 9h-12h'
      },
      aboutText: `${agence.nom} est votre partenaire de confiance pour tous vos projets de voyage. Avec plus de 15 ans d'expérience, nous vous accompagnons dans la réalisation de vos rêves d'évasion.`,
      socialLinks: {
        facebook: `https://facebook.com/${agence.nom.toLowerCase().replace(/\s+/g, '-')}`,
        instagram: `https://instagram.com/${agence.nom.toLowerCase().replace(/\s+/g, '-')}`,
        twitter: `https://twitter.com/${agence.nom.toLowerCase().replace(/\s+/g, '-')}`
      }
    };
  }
  
  // Toggle isActive
  agence.vitrineConfig.isActive = !agence.vitrineConfig.isActive;
  await agence.save();
  
  res.status(200).json({
    success: true,
    message: `Vitrine ${agence.vitrineConfig.isActive ? 'activée' : 'désactivée'} avec succès`,
    data: { isActive: agence.vitrineConfig.isActive }
  });
});

// @desc    Get public vitrine config by slug
// @route   GET /api/vitrine/public/:slug
// @access  Public
const getVitrineConfigPublic = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return res.status(400).json({ success: false, message: "Slug manquant" });
  }
  const agence = await Agence.findOne({ slug });
  if (!agence) {
    return res.status(404).json({ success: false, message: 'Agence non trouvée' });
  }
  
  console.log('Agence trouvée:', agence.nom); // Debug
  console.log('Logo URL de l\'agence:', agence.logoUrl); // Debug
  console.log('Vitrine config existante:', agence.vitrineConfig); // Debug
  
  const baseConfig = {
    isActive: true,
    domainName: `${agence.nom.toLowerCase().replace(/\s+/g, '-')}.samtech.fr`,
    title: `${agence.nom} - Votre Agence de Voyage`,
    description: `Découvrez nos offres de voyage exceptionnelles et partez à la découverte du monde avec ${agence.nom}.`,
    slogan: `Votre partenaire de confiance pour des voyages inoubliables`,
    logo: agence.logoUrl || '', // Utiliser le logo de l'agence par défaut
    bannerImage: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    contactInfo: {
      phone: agence.telephone,
      email: agence.email,
      address: agence.adresse,
      hours: 'Lun-Ven: 9h-18h, Sam: 9h-12h'
    },
    aboutText: `${agence.nom} est votre partenaire de confiance pour tous vos projets de voyage. Avec plus de 15 ans d'expérience, nous vous accompagnons dans la réalisation de vos rêves d'évasion.`,
    socialLinks: {
      facebook: `https://facebook.com/${agence.nom.toLowerCase().replace(/\s+/g, '-')}`,
      instagram: `https://instagram.com/${agence.nom.toLowerCase().replace(/\s+/g, '-')}`,
      twitter: `https://twitter.com/${agence.nom.toLowerCase().replace(/\s+/g, '-')}`
    }
  };
  const completeConfig = { ...baseConfig, ...(agence.vitrineConfig || {}) };
  completeConfig.contactInfo = { ...baseConfig.contactInfo, ...(agence.vitrineConfig?.contactInfo || {}) };
  completeConfig.socialLinks = { ...baseConfig.socialLinks, ...(agence.vitrineConfig?.socialLinks || {}) };
  
  // S'assurer que le logo de l'agence est utilisé si aucun logo n'est défini dans la vitrine
  if (!completeConfig.logo && agence.logoUrl) {
    completeConfig.logo = agence.logoUrl;
  }
  
  // S'assurer que la bannière de l'agence est utilisée si aucune bannière n'est définie dans la vitrine
  // La bannière est stockée dans vitrineConfig.bannerImage, pas au niveau racine
  if (!completeConfig.bannerImage && agence.vitrineConfig?.bannerImage) {
    completeConfig.bannerImage = agence.vitrineConfig.bannerImage;
  }
  
  console.log('Config finale - Logo:', completeConfig.logo); // Debug
  console.log('Config finale - Banner:', completeConfig.bannerImage); // Debug
  console.log('Config finale - Features section:', completeConfig.featuresSection); // Debug
  console.log('Config finale - Stats section:', completeConfig.statsSection); // Debug
  console.log('Config finale - Testimonials section:', completeConfig.testimonialsSection); // Debug
  
  // Toujours régénérer le domainName à partir du nom de l'agence
  const isDevPublic = process.env.NODE_ENV !== 'production';
  const slugPublic = agence.slug || agence.nom.toLowerCase().replace(/\s+/g, '-');
  completeConfig.domainName = isDevPublic
    ? `localhost:5173/site/${slugPublic}`
    : `${slugPublic}.samtech.fr`;

  res.status(200).json({
    success: true,
    data: completeConfig
  });
});

// @desc    Upload banner
// @route   POST /api/vitrine/banner
// @access  Private/Agency
const uploadBanner = asyncHandler(async (req, res) => {
  console.log('Fichier bannière reçu:', req.file);
  let agenceId = req.user?.agenceId;
  if (!agenceId) {
    return res.status(400).json({ success: false, message: "ID d'agence manquant" });
  }
  const agence = await Agence.findById(agenceId);
  if (!agence) {
    return res.status(404).json({ success: false, message: 'Agence non trouvée' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
  }
  
  // Chemin relatif pour le frontend - utiliser le serveur backend
  const dossier = `/uploads/agences/${agence.nom?.replace(/\s+/g, '_') || agenceId}`;
  const bannerUrl = `${dossier}/${req.file.filename}`;
  
  // Mettre à jour la config de la vitrine
  if (!agence.vitrineConfig) {
    agence.vitrineConfig = {};
  }
  agence.vitrineConfig.bannerImage = bannerUrl;
  await agence.save();
  
  res.status(200).json({ 
    success: true, 
    message: 'Bannière mise à jour avec succès', 
    data: { bannerUrl } 
  });
});

module.exports = {
  getVitrineConfig,
  updateVitrineConfig,
  toggleVitrineActive,
  getVitrineConfigPublic,
  uploadBanner
};