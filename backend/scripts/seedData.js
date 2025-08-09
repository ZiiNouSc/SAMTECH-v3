const mongoose = require('mongoose');
const Assurance = require('../models/assuranceModel');
const Manifest = require('../models/manifestModel');
const AutrePrestation = require('../models/autrePrestationModel');
const Client = require('../models/clientModel');
const User = require('../models/userModel');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    console.log('🌱 Début du seeding des données...');

    // Récupérer une agence existante
    const agence = await User.findOne({ role: 'agence' });
    if (!agence) {
      console.log('❌ Aucune agence trouvée. Veuillez créer une agence d\'abord.');
      return;
    }

    // Récupérer des clients existants ou en créer
    let clients = await Client.find({ agenceId: agence._id }).limit(5);
    if (clients.length === 0) {
      console.log('📝 Création de clients de test...');
      const clientsData = [
        {
          agenceId: agence._id,
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean.dupont@email.com',
          telephone: '0555123456',
          adresse: '123 Rue de la Paix, Alger',
          dateNaissance: new Date('1985-03-15'),
          nationalite: 'Algérienne',
          numeroPasseport: 'AB123456',
          numeroCarteIdentite: '123456789',
          profession: 'Ingénieur',
          statut: 'actif'
        },
        {
          agenceId: agence._id,
          nom: 'Martin',
          prenom: 'Sophie',
          email: 'sophie.martin@email.com',
          telephone: '0555987654',
          adresse: '456 Avenue des Fleurs, Oran',
          dateNaissance: new Date('1990-07-22'),
          nationalite: 'Algérienne',
          numeroPasseport: 'CD789012',
          numeroCarteIdentite: '987654321',
          profession: 'Médecin',
          statut: 'actif'
        },
        {
          agenceId: agence._id,
          nom: 'Bernard',
          prenom: 'Pierre',
          email: 'pierre.bernard@email.com',
          telephone: '0555111222',
          adresse: '789 Boulevard Central, Constantine',
          dateNaissance: new Date('1988-11-10'),
          nationalite: 'Algérienne',
          numeroPasseport: 'EF345678',
          numeroCarteIdentite: '456789123',
          profession: 'Avocat',
          statut: 'actif'
        }
      ];
      
      clients = await Client.insertMany(clientsData);
      console.log(`✅ ${clients.length} clients créés`);
    }

    // Récupérer des agents existants ou en créer
    let agents = await User.find({ role: 'agent', agenceId: agence._id }).limit(3);
    if (agents.length === 0) {
      console.log('📝 Création d\'agents de test...');
      const agentsData = [
        {
          nom: 'Agent',
          prenom: 'Test',
          email: 'agent.test@agence.com',
          password: 'password123',
          role: 'agent',
          agenceId: agence._id,
          statut: 'actif'
        }
      ];
      
      agents = await User.insertMany(agentsData);
      console.log(`✅ ${agents.length} agents créés`);
    }

    console.log(`✅ Agence trouvée: ${agence.nom}`);
    console.log(`✅ Clients trouvés: ${clients.length}`);
    console.log(`✅ Agents trouvés: ${agents.length}`);

    // Données de test pour les assurances
    const assurancesData = [
      {
        agenceId: agence._id,
        clientId: clients[0]._id,
        compagnieAssurance: 'AXA Assurance',
        typeAssurance: 'voyage',
        paysDestination: 'France',
        dateDepart: new Date('2024-06-15'),
        dateRetour: new Date('2024-06-25'),
        nombrePersonnes: 2,
        montantAssure: 50000,
        prime: 2500,
        devise: 'DA',
        conditions: 'Couverture complète voyage',
        exclusions: 'Sports extrêmes',
        notes: 'Assurance famille',
        statut: 'active',
        numeroPolice: 'POL-2024-001',
        dateEmission: new Date(),
        agentId: agents[0]._id
      },
      {
        agenceId: agence._id,
        clientId: clients[1]._id,
        compagnieAssurance: 'Allianz',
        typeAssurance: 'medicale',
        paysDestination: 'Espagne',
        dateDepart: new Date('2024-07-10'),
        dateRetour: new Date('2024-07-20'),
        nombrePersonnes: 1,
        montantAssure: 30000,
        prime: 1800,
        devise: 'DA',
        conditions: 'Couverture médicale',
        exclusions: 'Maladies préexistantes',
        notes: 'Voyage d\'affaires',
        statut: 'en_attente',
        numeroPolice: 'POL-2024-002',
        dateEmission: new Date(),
        agentId: agents[0]._id
      }
    ];

    // Données de test pour les manifestes
    const manifestsData = [
      {
        agenceId: agence._id,
        numeroManifest: 'MAN-2024-001',
        compagnieTransport: 'Air France',
        typeTransport: 'avion',
        destination: 'Paris, France',
        dateDepart: new Date('2024-06-15'),
        dateRetour: new Date('2024-06-25'),
        nombrePassagers: 2,
        passagers: [
          {
            nom: clients[0].nom,
            prenom: clients[0].prenom,
            dateNaissance: new Date('1990-01-01'),
            numeroPasseport: 'AB123456',
            numeroCarteIdentite: '123456789',
            telephone: clients[0].telephone,
            email: clients[0].email
          },
          {
            nom: 'Dupont',
            prenom: 'Marie',
            dateNaissance: new Date('1992-05-15'),
            numeroPasseport: 'CD789012',
            numeroCarteIdentite: '987654321',
            telephone: '0555123456',
            email: 'marie.dupont@email.com'
          }
        ],
        statut: 'approuve',
        dateSoumission: new Date(),
        dateApprobation: new Date(),
        observations: 'Manifeste approuvé',
        notes: 'Groupe familial',
        agentId: agents[0]._id
      }
    ];

    // Données de test pour les autres prestations
    const prestationsData = [
      {
        agenceId: agence._id,
        clientId: clients[0]._id,
        typePrestation: 'excursion',
        titre: 'Visite guidée de Paris',
        description: 'Visite guidée complète de la ville de Paris avec guide francophone',
        destination: 'Paris, France',
        dateDebut: new Date('2024-06-16'),
        dateFin: new Date('2024-06-16'),
        nombrePersonnes: 2,
        prix: 15000,
        devise: 'DA',
        fournisseur: 'Paris Tours',
        statut: 'confirmee',
        reference: 'PREST-2024-001',
        notes: 'Guide privé inclus',
        agentId: agents[0]._id
      },
      {
        agenceId: agence._id,
        clientId: clients[1]._id,
        typePrestation: 'transfert',
        titre: 'Transfert aéroport-hôtel',
        description: 'Service de transfert privé depuis l\'aéroport vers l\'hôtel',
        destination: 'Madrid, Espagne',
        dateDebut: new Date('2024-07-10'),
        dateFin: new Date('2024-07-10'),
        nombrePersonnes: 1,
        prix: 8000,
        devise: 'DA',
        fournisseur: 'Madrid Transfers',
        statut: 'en_attente',
        reference: 'PREST-2024-002',
        notes: 'Chauffeur avec pancarte',
        agentId: agents[0]._id
      }
    ];

    // Supprimer les données existantes
    await Assurance.deleteMany({ agenceId: agence._id });
    await Manifest.deleteMany({ agenceId: agence._id });
    await AutrePrestation.deleteMany({ agenceId: agence._id });

    console.log('🗑️ Anciennes données supprimées');

    // Insérer les nouvelles données
    const assurances = await Assurance.insertMany(assurancesData);
    const manifests = await Manifest.insertMany(manifestsData);
    const prestations = await AutrePrestation.insertMany(prestationsData);

    console.log(`✅ ${assurances.length} assurances créées`);
    console.log(`✅ ${manifests.length} manifestes créés`);
    console.log(`✅ ${prestations.length} prestations créées`);

    console.log('🎉 Seeding terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Exécuter le script
seedData(); 