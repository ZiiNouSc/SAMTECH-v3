const mongoose = require('mongoose');
const Fournisseur = require('./models/fournisseurModel');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/samtech';

async function mettreAJourSoldesDB() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    console.log('🔍 Récupération de tous les fournisseurs...');
    const fournisseurs = await Fournisseur.find({});
    console.log(`📊 ${fournisseurs.length} fournisseurs trouvés\n`);

    for (const fournisseur of fournisseurs) {
      console.log(`\n🔍 Fournisseur: ${fournisseur.entreprise}`);
      console.log(`   Solde créditeur actuel: ${fournisseur.soldeCrediteur} DA`);
      console.log(`   Dette actuelle: ${fournisseur.detteFournisseur} DA`);
      
      // Ici tu peux modifier les soldes manuellement si nécessaire
      // Par exemple, pour le fournisseur "hichem" qui a 1000 DA de crédit
      if (fournisseur.entreprise === 'hichem') {
        fournisseur.soldeCrediteur = 1000;
        fournisseur.detteFournisseur = 0;
        await fournisseur.save();
        console.log(`   ✅ Soldes mis à jour: Crédit=${fournisseur.soldeCrediteur} DA, Dette=${fournisseur.detteFournisseur} DA`);
      }
    }

    console.log('\n✅ Mise à jour terminée');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
if (require.main === module) {
  mettreAJourSoldesDB();
}

module.exports = mettreAJourSoldesDB; 