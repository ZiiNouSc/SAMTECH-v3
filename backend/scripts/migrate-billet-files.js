const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Billet = require('../models/billetModel');
const Agence = require('../models/agenceModel');

const migrateBilletFiles = async () => {
  try {
    console.log('🔧 Début de la migration des fichiers de billets...');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer tous les billets avec sourceFile
    const billets = await Billet.find({ sourceFile: { $exists: true, $ne: null } }).populate('agenceId');
    console.log(`📋 ${billets.length} billets avec fichiers trouvés`);

    let totalProcessed = 0;
    let totalMoved = 0;
    let totalErrors = 0;

    for (const billet of billets) {
      try {
        console.log(`\n🔍 Traitement billet: ${billet._id}`);
        
        if (!billet.agenceId) {
          console.log('⚠️ Billet sans agence, ignoré');
          continue;
        }

        const agence = billet.agenceId;
        const agenceName = agence.nom.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        
        console.log(`🏢 Agence: ${agence.nom} (${agenceName})`);

        // Analyser le chemin actuel
        let currentPath = billet.sourceFile;
        console.log(`📁 Chemin actuel: ${currentPath}`);

        // Vérifier si le chemin contient déjà le bon format
        if (currentPath.includes('agences/') && !currentPath.includes('C:/')) {
          console.log('✅ Chemin déjà correct');
          totalProcessed++;
          continue;
        }

        // Extraire le nom du fichier
        let fileName;
        let oldFullPath;
        
        if (currentPath.includes('C:/')) {
          // Ancien format avec chemin absolu complet
          fileName = path.basename(currentPath);
          oldFullPath = currentPath; // Le chemin actuel est déjà le chemin complet
          console.log(`📄 Nom du fichier extrait: ${fileName}`);
        } else {
          // Format relatif simple
          fileName = currentPath;
          oldFullPath = path.join(__dirname, '../uploads', fileName);
          console.log(`📄 Nom du fichier: ${fileName}`);
        }

        // Construire les nouveaux chemins
        const newRelativePath = `agences/${agenceName}/billets/${fileName}`;
        const newFullPath = path.join(__dirname, '../uploads', newRelativePath);

        console.log(`📁 Nouveau chemin relatif: ${newRelativePath}`);
        console.log(`📁 Ancien chemin complet: ${oldFullPath}`);
        console.log(`📁 Nouveau chemin complet: ${newFullPath}`);

        // Vérifier si le fichier existe
        if (!fs.existsSync(oldFullPath)) {
          console.log('⚠️ Fichier source non trouvé, ignoré');
          totalErrors++;
          continue;
        }

        // Créer le nouveau dossier
        const newDir = path.dirname(newFullPath);
        if (!fs.existsSync(newDir)) {
          fs.mkdirSync(newDir, { recursive: true });
          console.log(`📁 Dossier créé: ${newDir}`);
        }

        // Déplacer le fichier
        fs.renameSync(oldFullPath, newFullPath);
        console.log(`✅ Fichier déplacé: ${oldFullPath} → ${newFullPath}`);

        // Mettre à jour la base de données
        billet.sourceFile = newRelativePath;
        await billet.save();
        console.log(`💾 Base de données mise à jour`);

        totalMoved++;
        totalProcessed++;

      } catch (error) {
        console.error(`❌ Erreur lors du traitement du billet ${billet._id}:`, error);
        totalErrors++;
      }
    }

    console.log('\n🎯 Résumé de la migration:');
    console.log(`- Total traité: ${totalProcessed}`);
    console.log(`- Fichiers déplacés: ${totalMoved}`);
    console.log(`- Erreurs: ${totalErrors}`);
    console.log('\n✅ Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion à MongoDB fermée');
  }
};

// Exécuter la migration
migrateBilletFiles(); 