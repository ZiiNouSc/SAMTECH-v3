const mongoose = require('mongoose');
const Agence = require('../models/agenceModel');
const { getAgencyModules, getAllModuleIds } = require('../config/modules');

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/samtech-crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateAgenciesWithNewModules() {
  try {
    console.log('🔄 Mise à jour des agences avec les nouveaux modules...');
    
    // Obtenir tous les modules disponibles pour les agences
    const allAgencyModules = getAgencyModules().map(module => module.id);
    const essentialModules = getAgencyModules().filter(module => module.essential).map(module => module.id);
    
    console.log('📋 Modules disponibles pour les agences:', allAgencyModules);
    console.log('⭐ Modules essentiels:', essentialModules);
    
    // Récupérer toutes les agences
    const agences = await Agence.find({});
    console.log(`📊 ${agences.length} agences trouvées`);
    
    let updatedCount = 0;
    
    for (const agence of agences) {
      let needsUpdate = false;
      const currentModules = agence.modulesActifs || [];
      
      // Ajouter les modules essentiels manquants
      const missingEssentialModules = essentialModules.filter(module => 
        !currentModules.includes(module)
      );
      
      if (missingEssentialModules.length > 0) {
        console.log(`🔧 Agence "${agence.nom}": Ajout des modules essentiels manquants:`, missingEssentialModules);
        agence.modulesActifs = [...currentModules, ...missingEssentialModules];
        needsUpdate = true;
      }
      
      // Nettoyer les modules obsolètes (qui ne sont plus dans la configuration)
      const obsoleteModules = currentModules.filter(module => 
        !allAgencyModules.includes(module) && module !== 'module-requests'
      );
      
      if (obsoleteModules.length > 0) {
        console.log(`🧹 Agence "${agence.nom}": Suppression des modules obsolètes:`, obsoleteModules);
        agence.modulesActifs = agence.modulesActifs.filter(module => 
          !obsoleteModules.includes(module)
        );
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await agence.save();
        updatedCount++;
        console.log(`✅ Agence "${agence.nom}" mise à jour`);
      } else {
        console.log(`✅ Agence "${agence.nom}" déjà à jour`);
      }
    }
    
    console.log(`\n🎉 Mise à jour terminée !`);
    console.log(`📈 ${updatedCount} agences mises à jour sur ${agences.length}`);
    
    // Afficher un résumé des modules par agence
    console.log('\n📋 Résumé des modules par agence:');
    const updatedAgences = await Agence.find({});
    for (const agence of updatedAgences) {
      console.log(`\n🏢 ${agence.nom}:`);
      console.log(`   Modules actifs: ${agence.modulesActifs.join(', ')}`);
      if (agence.modulesDemandes && agence.modulesDemandes.length > 0) {
        console.log(`   Modules demandés: ${agence.modulesDemandes.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connexion à MongoDB fermée');
  }
}

// Exécuter le script
updateAgenciesWithNewModules(); 