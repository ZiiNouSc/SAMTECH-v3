const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Agence = require('../models/agenceModel');
const User = require('../models/userModel');
const Package = require('../models/packageModel');
// Adapte le nom du modèle de facture si besoin
let Facture;
try {
  Facture = require('../models/factureModel');
} catch (e) {
  Facture = null;
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/samtech';

async function seed() {
  await mongoose.connect(MONGO_URI);

  // 1. Superadmin
  await User.create({
    nom: 'Super',
    prenom: 'Admin',
    email: 'superadmin@samtech.com',
    password: await bcrypt.hash('superadmin123', 10),
    role: 'superadmin',
    statut: 'actif'
  });

  // 2. Agences
  const agences = await Agence.insertMany([
    {
      nom: 'Agence Alpha',
      email: 'alpha@samtech.com',
      telephone: '0101010101',
      adresse: '1 rue Alpha',
      statut: 'approuve',
      slug: 'agence-alpha',
      vitrineConfig: {
        title: 'Bienvenue chez Agence Alpha',
        description: 'Votre partenaire de voyage Alpha.',
        logo: '',
        bannerImage: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        showPackages: true,
        showContact: true,
        showAbout: true,
        contactInfo: {
          phone: '0101010101',
          email: 'alpha@samtech.com',
          address: '1 rue Alpha',
          hours: 'Lun-Ven: 9h-18h'
        },
        aboutText: 'Alpha, votre agence de confiance.',
        socialLinks: {
          facebook: '',
          instagram: '',
          twitter: ''
        }
      }
    },
    {
      nom: 'Agence Beta',
      email: 'beta@samtech.com',
      telephone: '0202020202',
      adresse: '2 rue Beta',
      statut: 'approuve',
      slug: 'agence-beta',
      vitrineConfig: {
        title: 'Bienvenue chez Agence Beta',
        description: 'Votre partenaire de voyage Beta.',
        logo: '',
        bannerImage: '',
        primaryColor: '#F59E42',
        secondaryColor: '#F53B57',
        showPackages: true,
        showContact: true,
        showAbout: true,
        contactInfo: {
          phone: '0202020202',
          email: 'beta@samtech.com',
          address: '2 rue Beta',
          hours: 'Lun-Ven: 9h-18h'
        },
        aboutText: 'Beta, votre agence de confiance.',
        socialLinks: {
          facebook: '',
          instagram: '',
          twitter: ''
        }
      }
    }
  ]);

  // 3. Admins d'agence
  await User.create({
    nom: 'Alpha',
    prenom: 'Admin',
    email: 'admin.alpha@samtech.com',
    password: await bcrypt.hash('alpha123', 10),
    role: 'agence',
    statut: 'actif',
    agenceId: agences[0]._id
  });

  await User.create({
    nom: 'Beta',
    prenom: 'Admin',
    email: 'admin.beta@samtech.com',
    password: await bcrypt.hash('beta123', 10),
    role: 'agence',
    statut: 'actif',
    agenceId: agences[1]._id
  });

  // 4. Packages pour chaque agence
  await Package.insertMany([
    {
      nom: 'Alpha Package 1',
      description: 'Voyage à Paris',
      prix: 1200,
      duree: '5 jours',
      pays: 'France',
      agenceId: agences[0]._id,
      visible: true
    },
    {
      nom: 'Alpha Package 2',
      description: 'Séjour à Rome',
      prix: 900,
      duree: '4 jours',
      pays: 'Italie',
      agenceId: agences[0]._id,
      visible: true
    },
    {
      nom: 'Beta Package 1',
      description: 'Circuit au Maroc',
      prix: 1500,
      duree: '7 jours',
      pays: 'Maroc',
      agenceId: agences[1]._id,
      visible: true
    },
    {
      nom: 'Beta Package 2',
      description: "Découverte d'Istanbul",
      prix: 1100,
      duree: '6 jours',
      pays: 'Turquie',
      agenceId: agences[1]._id,
      visible: true
    }
  ]);

  // 5. Factures pour chaque agence (si le modèle existe)
  if (Facture) {
    await Facture.insertMany([
      {
        numero: 'A-001',
        clientNom: 'Client Alpha 1',
        montantHT: 1000,
        montantTTC: 1200,
        statut: 'payee',
        agenceId: agences[0]._id,
        clientId: agences[0]._id,
        dateEmission: new Date(),
        dateEcheance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        numero: 'A-002',
        clientNom: 'Client Alpha 2',
        montantHT: 800,
        montantTTC: 900,
        statut: 'envoyee',
        agenceId: agences[0]._id,
        clientId: agences[0]._id,
        dateEmission: new Date(),
        dateEcheance: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      {
        numero: 'B-001',
        clientNom: 'Client Beta 1',
        montantHT: 1200,
        montantTTC: 1500,
        statut: 'payee',
        agenceId: agences[1]._id,
        clientId: agences[1]._id,
        dateEmission: new Date(),
        dateEcheance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        numero: 'B-002',
        clientNom: 'Client Beta 2',
        montantHT: 900,
        montantTTC: 1100,
        statut: 'envoyee',
        agenceId: agences[1]._id,
        clientId: agences[1]._id,
        dateEmission: new Date(),
        dateEcheance: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    ]);
  }

  console.log('✅ Données de test insérées avec succès !');
  process.exit();
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
}); 