const mongoose = require('mongoose');
const Agence = require('../models/agenceModel');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/samtech';

async function migrateSlogan() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer toutes les agences
    const agences = await Agence.find({});
    console.log(`📊 ${agences.length} agences trouvées`);

    let updatedCount = 0;

    for (const agence of agences) {
      // Vérifier si la vitrineConfig existe
      if (!agence.vitrineConfig) {
        agence.vitrineConfig = {};
      }

      // Ajouter le slogan s'il n'existe pas
      if (!agence.vitrineConfig.slogan) {
        agence.vitrineConfig.slogan = `Votre partenaire de confiance pour des voyages inoubliables`;
        await agence.save();
        updatedCount++;
        console.log(`✅ Slogan ajouté pour ${agence.nom}`);
      }
    }

    console.log(`🎉 Migration terminée ! ${updatedCount} agences mises à jour`);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la migration
migrateSlogan(); 