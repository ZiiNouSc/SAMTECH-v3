const mongoose = require('mongoose');
const Agence = require('../models/agenceModel');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrateEmailId = async () => {
  try {
    console.log('🚀 Début de la migration emailId...');

    // 1. Ajouter le champ emailId à tous les billets existants (s'il n'existe pas)
    const Billet = require('../models/billetModel');
    
    // Vérifier si le champ emailId existe déjà
    const sampleBillet = await Billet.findOne();
    if (sampleBillet && sampleBillet.emailId === undefined) {
      console.log('📧 Ajout du champ emailId aux billets existants...');
      
      // Ajouter emailId: null à tous les billets existants
      const result = await Billet.updateMany(
        { emailId: { $exists: false } },
        { $set: { emailId: null } }
      );
      
      console.log(`✅ ${result.modifiedCount} billets mis à jour avec emailId: null`);
    } else {
      console.log('✅ Le champ emailId existe déjà dans le modèle');
    }

    // 2. Réinitialiser lastImport pour toutes les agences pour forcer un nouveau premier import
    console.log('🔄 Réinitialisation de lastImport pour toutes les agences...');
    
    const resultAgences = await Agence.updateMany(
      {},
      { $unset: { lastImport: "" } }
    );
    
    console.log(`✅ ${resultAgences.modifiedCount} agences ont leur lastImport réinitialisé`);

    // 3. Afficher les informations sur la migration
    const totalBillets = await Billet.countDocuments();
    const totalAgences = await Agence.countDocuments();
    
    console.log('\n📊 Résumé de la migration:');
    console.log(`- Total billets: ${totalBillets}`);
    console.log(`- Total agences: ${totalAgences}`);
    console.log(`- Agences avec lastImport réinitialisé: ${resultAgences.modifiedCount}`);
    
    console.log('\n🎯 Prochaines étapes:');
    console.log('1. Redémarrer le serveur backend');
    console.log('2. La prochaine fois qu\'une agence fera "Capture Billets", ce sera un premier import');
    console.log('3. Le système utilisera la logique de quinzaine pour le premier import');
    console.log('4. Les imports suivants continueront à partir du dernier email traité');
    console.log('5. Aucun doublon ne sera créé grâce au champ emailId');

    console.log('\n✅ Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connexion à MongoDB fermée');
  }
};

// Exécuter la migration
migrateEmailId(); 