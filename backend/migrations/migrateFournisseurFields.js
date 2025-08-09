const mongoose = require('mongoose');
const Fournisseur = require('../models/fournisseurModel');

// Configuration de la connexion MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/samtech');
    console.log('✅ Connexion à MongoDB établie');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
};

// Migration des champs fournisseur
const migrateFournisseurFields = async () => {
  try {
    console.log('🔄 Début de la migration des champs fournisseur...');
    
    // Récupérer tous les fournisseurs
    const fournisseurs = await Fournisseur.find({});
    console.log(`📊 ${fournisseurs.length} fournisseurs trouvés`);
    
    let updatedCount = 0;
    
    for (const fournisseur of fournisseurs) {
      const updateData = {};
      let needsUpdate = false;
      
      // Forcer la mise à jour pour s'assurer que les champs existent
      if (fournisseur.detteFournisseur === undefined || fournisseur.detteFournisseur === null) {
        updateData.detteFournisseur = 0;
        needsUpdate = true;
        console.log(`📝 Ajout detteFournisseur pour ${fournisseur.entreprise}`);
      }
      
      if (fournisseur.soldeCrediteur === undefined || fournisseur.soldeCrediteur === null) {
        updateData.soldeCrediteur = 0;
        needsUpdate = true;
        console.log(`📝 Ajout soldeCrediteur pour ${fournisseur.entreprise}`);
      }
      
      // Si le fournisseur a un ancien champ 'solde', le migrer vers 'detteFournisseur'
      if (fournisseur.solde !== undefined && fournisseur.solde !== null) {
        updateData.detteFournisseur = fournisseur.solde;
        updateData.solde = undefined; // Supprimer l'ancien champ
        needsUpdate = true;
        console.log(`📝 Migration du fournisseur ${fournisseur.entreprise}: solde ${fournisseur.solde} → detteFournisseur ${fournisseur.solde}`);
      }
      
      // Forcer la mise à jour même si les champs existent déjà pour s'assurer qu'ils sont bien définis
      if (!needsUpdate) {
        updateData.detteFournisseur = fournisseur.detteFournisseur || 0;
        updateData.soldeCrediteur = fournisseur.soldeCrediteur || 0;
        needsUpdate = true;
        console.log(`📝 Mise à jour forcée pour ${fournisseur.entreprise}`);
      }
      
      if (needsUpdate) {
        await Fournisseur.findByIdAndUpdate(fournisseur._id, updateData);
        updatedCount++;
      }
    }
    
    console.log(`✅ Migration terminée: ${updatedCount} fournisseurs mis à jour`);
    
    // Vérification finale
    const verificationCount = await Fournisseur.countDocuments({
      $and: [
        { detteFournisseur: { $exists: true } },
        { soldeCrediteur: { $exists: true } }
      ]
    });
    
    console.log(`🔍 Vérification: ${verificationCount} fournisseurs ont les nouveaux champs`);
    
    // Afficher les détails de chaque fournisseur
    const allFournisseurs = await Fournisseur.find({});
    console.log('\n📋 Détails des fournisseurs après migration:');
    allFournisseurs.forEach(f => {
      console.log(`  - ${f.entreprise}: dette=${f.detteFournisseur || 0}, solde=${f.soldeCrediteur || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
};

// Exécution de la migration
const runMigration = async () => {
  await connectDB();
  await migrateFournisseurFields();
  
  console.log('🏁 Migration terminée');
  process.exit(0);
};

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error('❌ Erreur non gérée:', err);
  process.exit(1);
});

// Exécuter la migration
runMigration(); 