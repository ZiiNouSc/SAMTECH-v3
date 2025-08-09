const mongoose = require('mongoose');
const User = require('../models/userModel');
const { 
  ALL_MODULES_CONFIG, 
  BASE_MODULES, 
  SUPERADMIN_MODULES, 
  getAllModuleIds,
  getAgencyModules 
} = require('../config/modules');

// Actions disponibles pour chaque module
const DEFAULT_ACTIONS = ['lire', 'creer', 'modifier', 'supprimer'];

// Modules à ajouter par défaut aux agents (avec permissions de base)
const DEFAULT_AGENT_MODULES = getAgencyModules().map(module => module.id);

async function addMissingModulesToAgents() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/samtech', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connexion à MongoDB établie');
    
    // Récupérer tous les agents
    const agents = await User.find({ role: 'agent' });
    console.log(`📊 ${agents.length} agents trouvés`);
    
    let updatedCount = 0;
    
    for (const agent of agents) {
      const currentPermissions = agent.permissions || [];
      const currentModules = currentPermissions.map(p => p.module);
      
      // Identifier les modules manquants
      const missingModules = DEFAULT_AGENT_MODULES.filter(module => 
        !currentModules.includes(module)
      );
      
      if (missingModules.length > 0) {
        console.log(`\n🔧 Agent: ${agent.prenom} ${agent.nom} (${agent.email})`);
        console.log(`   Modules manquants: ${missingModules.join(', ')}`);
        
        // Ajouter les modules manquants avec permissions de base
        const newPermissions = missingModules.map(module => ({
          module,
          actions: ['lire'] // Permission de base : lecture seulement
        }));
        
        // Fusionner avec les permissions existantes
        agent.permissions = [...currentPermissions, ...newPermissions];
        
        await agent.save();
        updatedCount++;
        
        console.log(`   ✅ ${missingModules.length} modules ajoutés`);
      } else {
        console.log(`\n✅ Agent: ${agent.prenom} ${agent.nom} - Aucun module manquant`);
      }
    }
    
    console.log(`\n🎉 Migration terminée: ${updatedCount} agents mis à jour`);
    
    // Afficher un résumé des permissions par agent
    console.log('\n📋 Résumé des permissions par agent:');
    const updatedAgents = await User.find({ role: 'agent' });
    
    for (const agent of updatedAgents) {
      const moduleCount = agent.permissions.length;
      const modulesWithRead = agent.permissions.filter(p => p.actions.includes('lire')).length;
      const modulesWithWrite = agent.permissions.filter(p => 
        p.actions.some(action => ['creer', 'modifier', 'supprimer'].includes(action))
      ).length;
      
      console.log(`   ${agent.prenom} ${agent.nom}: ${moduleCount} modules (${modulesWithRead} lecture, ${modulesWithWrite} écriture)`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion à MongoDB fermée');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  addMissingModulesToAgents();
}

module.exports = { addMissingModulesToAgents }; 