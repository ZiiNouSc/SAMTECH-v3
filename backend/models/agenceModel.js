const mongoose = require('mongoose');

// Fonction pour générer un slug à partir d'une chaîne
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Remplacer les espaces par des tirets
    .replace(/[^\w\-]+/g, '')    // Supprimer les caractères non alphanumériques
    .replace(/\-\-+/g, '-')      // Remplacer les tirets multiples par un seul
    .replace(/^-+/, '')          // Supprimer les tirets au début
    .replace(/-+$/, '');         // Supprimer les tirets à la fin
};

const agenceSchema = mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    telephone: {
      type: String,
      required: true,
    },
    adresse: {
      type: String,
      required: true,
    },
    // Champs administratifs ajoutés pour le wizard
    pays: {
      type: String,
      default: 'Algérie',
    },
    wilaya: {
      type: String,
    },
    siteWeb: {
      type: String,
    },
    numeroRC: {
      type: String,
    },
    numeroNIF: {
      type: String,
    },
    numeroNIS: {
      type: String,
    },
    articleImposition: {
      type: String,
    },
    ibanRIB: {
      type: String,
    },
    logo: {
      type: String,
    },
    statut: {
      type: String,
      enum: ['en_attente', 'approuve', 'rejete', 'suspendu'],
      default: 'en_attente',
    },
    dateInscription: {
      type: Date,
      default: Date.now,
    },
    modulesActifs: {
      type: [String],
      default: [],
    },
    // Modules demandés par l'agence en attente d'approbation
    modulesDemandes: {
      type: [String],
      default: [],
    },
    modulesChoisis: {
      type: [String],
      default: [],
    },
    typeActivite: {
      type: String,
      default: 'agence-voyage',
    },
    // Informations bancaires structurées
    informationsBancaires: {
      banque: {
        type: String,
      },
      rib: {
        type: String,
      },
      swift: {
        type: String,
      },
    },
    siret: {
      type: String,
    },
    raisonSociale: {
      type: String,
    },
    numeroTVA: {
      type: String,
    },
    banque: {
      type: String,
    },
    rib: {
      type: String,
    },
    swift: {
      type: String,
    },
    logoUrl: {
      type: String,
    },
    // Configuration Gmail
    gmailToken: {
      type: String,
    },
    gmailRefreshToken: {
      type: String,
    },
    gmailEmail: {
      type: String,
    },
    // Date du dernier import Gmail réussi
    lastImport: {
      type: Date,
      default: null,
    },
    vitrineConfig: {
      isActive: {
        type: Boolean,
        default: true,
      },
      domainName: String,
      title: String,
      description: String,
      slogan: String,
      logo: String,
      bannerImage: String,
      primaryColor: {
        type: String,
        default: '#3B82F6',
      },
      secondaryColor: {
        type: String,
        default: '#1E40AF',
      },
      contactInfo: {
        phone: String,
        email: String,
        address: String,
        hours: String,
      },
      aboutText: String,
      socialLinks: {
        facebook: String,
        instagram: String,
        twitter: String,
      },
      // Sections configurables
      featuresSection: {
        enabled: {
          type: Boolean,
          default: true,
        },
        title: String,
        features: [{
          icon: String,
          title: String,
          description: String,
        }],
      },
      statsSection: {
        enabled: {
          type: Boolean,
          default: true,
        },
        stats: [{
          number: String,
          label: String,
        }],
      },
      testimonialsSection: {
        enabled: {
          type: Boolean,
          default: true,
        },
        title: String,
        testimonials: [{
          name: String,
          role: String,
          content: String,
          rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 5,
          },
        }],
      },
    },
    parametres: {
      nomAgence: String,
      fuseau: {
        type: String,
        default: 'Europe/Paris',
      },
      langue: {
        type: String,
        default: 'fr',
      },
      devise: {
        type: String,
        default: 'EUR',
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      notificationFactures: {
        type: Boolean,
        default: true,
      },
      notificationPaiements: {
        type: Boolean,
        default: true,
      },
      notificationRappels: {
        type: Boolean,
        default: true,
      },
      authentificationDouble: {
        type: Boolean,
        default: false,
      },
      sessionTimeout: {
        type: Number,
        default: 30,
      },
      tentativesConnexion: {
        type: Number,
        default: 5,
      },
      numeroFactureAuto: {
        type: Boolean,
        default: true,
      },
      prefixeFacture: {
        type: String,
        default: 'FAC',
      },
      tvaDefaut: {
        type: Number,
        default: 20,
      },
      conditionsPaiement: {
        type: String,
        default: '30 jours',
      },
      sauvegardeAuto: {
        type: Boolean,
        default: true,
      },
      frequenceSauvegarde: {
        type: String,
        default: 'quotidienne',
      },
      retentionSauvegarde: {
        type: Number,
        default: 30,
      },
      limiteStockage: {
        type: Number,
        default: 10, // GB
      },
      alertesStockage: {
        type: Boolean,
        default: true,
      },
      seuilAlerteStockage: {
        type: Number,
        default: 80, // %
      },
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware pour générer automatiquement le slug
agenceSchema.pre('save', async function(next) {
  if (this.isModified('nom') || !this.slug) {
    let baseSlug = generateSlug(this.nom);
    let slug = baseSlug;
    let counter = 1;
    
    // Vérifier si le slug existe déjà
    while (await mongoose.model('Agence').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Fonction statique pour migrer les agences existantes
agenceSchema.statics.migrateSlugs = async function() {
  const agences = await this.find({ $or: [{ slug: null }, { slug: { $exists: false } }] });
  
  for (const agence of agences) {
    let baseSlug = generateSlug(agence.nom);
    let slug = baseSlug;
    let counter = 1;
    
    // Vérifier si le slug existe déjà
    while (await this.findOne({ slug, _id: { $ne: agence._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    agence.slug = slug;
    await agence.save();
  }
  
  console.log(`Migration terminée: ${agences.length} agences mises à jour`);
};

// Méthode pour migrer les configurations de vitrine existantes
agenceSchema.methods.migrateVitrineConfig = async function() {
  if (this.vitrineConfig) {
    // Supprimer les anciens champs
    delete this.vitrineConfig.showPackages;
    delete this.vitrineConfig.showContact;
    delete this.vitrineConfig.showAbout;
    delete this.vitrineConfig.heroSection;
    
    // S'assurer que les nouvelles sections existent
    if (!this.vitrineConfig.featuresSection) {
      this.vitrineConfig.featuresSection = {
        enabled: true,
        title: 'Nos Services',
        features: [
          { icon: '🏖️', title: 'Voyages personnalisés', description: 'Des voyages adaptés à vos besoins et à votre budget.' },
          { icon: '✈️', title: 'Transports', description: 'Des options de transport confortables et fiables.' },
          { icon: '🏨', title: 'Hébergements', description: 'Des hébergements de qualité pour votre séjour.' },
          { icon: '🛡️', title: 'Assurance voyage', description: 'Protection complète pour votre tranquillité d\'esprit.' }
        ]
      };
    }
    
    if (!this.vitrineConfig.statsSection) {
      this.vitrineConfig.statsSection = {
        enabled: true,
        stats: [
          { number: '100+', label: 'Destinations' },
          { number: '500+', label: 'Clients satisfaits' },
          { number: '10+', label: 'Années d\'expérience' }
        ]
      };
    }
    
    if (!this.vitrineConfig.testimonialsSection) {
      this.vitrineConfig.testimonialsSection = {
        enabled: true,
        title: 'Témoignages',
        testimonials: [
          { name: 'Jean Dupont', role: 'Client fidèle', content: 'Excellent service et très professionnel. Je recommande vivement.', rating: 5 },
          { name: 'Marie Martin', role: 'Agence de voyage', content: 'Une équipe à l\'écoute et des offres attractives. Merci !', rating: 4 }
        ]
      };
    }
    
    await this.save();
  }
};

// Méthode statique pour migrer toutes les agences
agenceSchema.statics.migrateAllVitrineConfigs = async function() {
  const agences = await this.find({});
  for (const agence of agences) {
    await agence.migrateVitrineConfig();
  }
  console.log(`Migration terminée pour ${agences.length} agences`);
};

const Agence = mongoose.model('Agence', agenceSchema);

module.exports = Agence;