const mongoose = require('mongoose');
const Fournisseur = require('./models/fournisseurModel');
const Operation = require('./models/operationModel');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/samtech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function corrigerDettesInitiales() {
  try {
    console.log('🔧 Correction des dettes initiales...\n');
    
    // 1. Trouver tous les fournisseurs
    const fournisseurs = await Fournisseur.find({});
    console.log(`📊 ${fournisseurs.length} fournisseurs trouvés`);
    
    let corrections = 0;
    
    for (const fournisseur of fournisseurs) {
      console.log(`\n🔍 Vérification de ${fournisseur.entreprise}...`);
      
      // 2. Vérifier s'il y a des opérations de dette initiale
      const operationsDetteInitiale = await Operation.find({
        fournisseurId: fournisseur._id,
        categorie: 'paiement_fournisseur',
        type: 'sortie',
        reference: 'INITIAL'
      });
      
      if (operationsDetteInitiale.length > 0) {
        console.log(`   ⚠️  ${operationsDetteInitiale.length} opération(s) de dette initiale trouvée(s)`);
        
        // 3. Recalculer les soldes
        const soldes = await fournisseur.calculerSoldes();
        
        console.log(`   📊 Avant: Dette=${fournisseur.detteFournisseur}, Solde=${fournisseur.soldeCrediteur}`);
        console.log(`   📊 Après: Dette=${soldes.detteFournisseur}, Solde=${soldes.soldeCrediteur}`);
        
        // 4. Sauvegarder si les valeurs ont changé
        if (fournisseur.detteFournisseur !== soldes.detteFournisseur || 
            fournisseur.soldeCrediteur !== soldes.soldeCrediteur) {
          
          fournisseur.detteFournisseur = soldes.detteFournisseur;
          fournisseur.soldeCrediteur = soldes.soldeCrediteur;
          await fournisseur.save();
          
          console.log(`   ✅ Soldes corrigés`);
          corrections++;
        } else {
          console.log(`   ✅ Soldes déjà corrects`);
        }
      } else {
        console.log(`   ✅ Aucune dette initiale`);
      }
    }
    
    console.log(`\n🎯 ${corrections} fournisseur(s) corrigé(s)`);
    console.log('✅ Correction terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
}

corrigerDettesInitiales(); 