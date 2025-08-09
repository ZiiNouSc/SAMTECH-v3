const mongoose = require('mongoose');
const Agence = require('../models/agenceModel');

// Configuration de la base de données
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/samtech', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Migration des agences existantes
const migrateAgencies = async () => {
  try {
    console.log('Début de la migration des agences...');
    
    // Récupérer toutes les agences
    const agences = await Agence.find({});
    console.log(`${agences.length} agences trouvées`);
    
    let updatedCount = 0;
    
    for (const agence of agences) {
      const updates = {};
      let hasUpdates = false;
      
      // Ajouter les champs manquants avec des valeurs par défaut
      if (!agence.pays) {
        updates.pays = 'Algérie';
        hasUpdates = true;
      }
      
      if (!agence.typeActivite) {
        updates.typeActivite = 'agence-voyage';
        hasUpdates = true;
      }
      
      if (!agence.wilaya) {
        updates.wilaya = '';
        hasUpdates = true;
      }
      
      if (!agence.siteWeb) {
        updates.siteWeb = '';
        hasUpdates = true;
      }
      
      if (!agence.numeroRC) {
        updates.numeroRC = '';
        hasUpdates = true;
      }
      
      if (!agence.numeroNIF) {
        updates.numeroNIF = '';
        hasUpdates = true;
      }
      
      if (!agence.numeroNIS) {
        updates.numeroNIS = '';
        hasUpdates = true;
      }
      
      if (!agence.articleImposition) {
        updates.articleImposition = '';
        hasUpdates = true;
      }
      
      if (!agence.ibanRIB) {
        updates.ibanRIB = '';
        hasUpdates = true;
      }
      
      if (!agence.modulesDemandes) {
        updates.modulesDemandes = [];
        hasUpdates = true;
      }
      
      if (!agence.modulesChoisis) {
        updates.modulesChoisis = [];
        hasUpdates = true;
      }
      
      // Mettre à jour l'agence si nécessaire
      if (hasUpdates) {
        await Agence.findByIdAndUpdate(agence._id, updates);
        updatedCount++;
        console.log(`Agence "${agence.nom}" mise à jour`);
      }
    }
    
    console.log(`Migration terminée: ${updatedCount} agences mises à jour`);
    
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  }
};

// Exécuter la migration
const runMigration = async () => {
  await connectDB();
  await migrateAgencies();
  mongoose.connection.close();
  console.log('Migration terminée');
  process.exit(0);
};

// Exécuter si le script est appelé directement
if (require.main === module) {
  runMigration();
}

module.exports = { migrateAgencies }; 