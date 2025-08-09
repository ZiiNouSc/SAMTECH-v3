const mongoose = require('mongoose');
require('dotenv').config();

const fixIndexes = async () => {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;

    // Supprimer les anciens index uniques
    console.log('🗑️ Suppression des anciens index uniques...');
    
    try {
      await db.collection('manifests').dropIndex('numeroManifest_1');
      console.log('✅ Index numeroManifest_1 supprimé');
    } catch (error) {
      console.log('ℹ️ Index numeroManifest_1 n\'existe pas ou déjà supprimé');
    }

    try {
      await db.collection('assurances').dropIndex('numeroPolice_1');
      console.log('✅ Index numeroPolice_1 supprimé');
    } catch (error) {
      console.log('ℹ️ Index numeroPolice_1 n\'existe pas ou déjà supprimé');
    }

    try {
      await db.collection('visas').dropIndex('numeroDossier_1');
      console.log('✅ Index numeroDossier_1 supprimé');
    } catch (error) {
      console.log('ℹ️ Index numeroDossier_1 n\'existe pas ou déjà supprimé');
    }

    try {
      await db.collection('hotelreservations').dropIndex('reference_1');
      console.log('✅ Index reference_1 supprimé');
    } catch (error) {
      console.log('ℹ️ Index reference_1 n\'existe pas ou déjà supprimé');
    }

    try {
      await db.collection('reservations').dropIndex('numero_1');
      console.log('✅ Index numero_1 supprimé');
    } catch (error) {
      console.log('ℹ️ Index numero_1 n\'existe pas ou déjà supprimé');
    }

    // Recréer les nouveaux index composés
    console.log('🔧 Création des nouveaux index composés...');
    
    await db.collection('manifests').createIndex({ agenceId: 1, numeroManifest: 1 }, { unique: true });
    console.log('✅ Index composé manifests créé');

    await db.collection('assurances').createIndex({ agenceId: 1, numeroPolice: 1 }, { unique: true });
    console.log('✅ Index composé assurances créé');

    await db.collection('visas').createIndex({ agenceId: 1, numeroDossier: 1 }, { unique: true });
    console.log('✅ Index composé visas créé');

    await db.collection('hotelreservations').createIndex({ agenceId: 1, reference: 1 }, { unique: true });
    console.log('✅ Index composé hotelreservations créé');

    await db.collection('reservations').createIndex({ agenceId: 1, numero: 1 }, { unique: true });
    console.log('✅ Index composé reservations créé');

    console.log('🎉 Tous les index ont été corrigés avec succès !');
    console.log('📝 Maintenant chaque agence peut utiliser ses propres références sans conflit.');

  } catch (error) {
    console.error('❌ Erreur lors de la correction des index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

// Exécuter le script
fixIndexes(); 