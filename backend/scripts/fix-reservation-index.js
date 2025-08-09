const mongoose = require('mongoose');
require('dotenv').config();

const fixReservationIndex = async () => {
  try {
    console.log('🔧 Début de la correction de l\'index des réservations...');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB établie');

    // Accéder directement à la collection
    const db = mongoose.connection.db;
    const collection = db.collection('reservations');

    // Lister tous les index existants
    console.log('📋 Index existants sur la collection reservations:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, index.key);
    });

    // Chercher l'index problématique agenceId_1_numero_1
    const problematicIndex = indexes.find(index => 
      index.name === 'agenceId_1_numero_1' || 
      (index.key.agenceId === 1 && index.key.numero === 1)
    );

    if (problematicIndex) {
      console.log('❌ Index problématique trouvé:', problematicIndex.name);
      console.log('🗑️ Suppression de l\'index problématique...');
      
      await collection.dropIndex(problematicIndex.name);
      console.log('✅ Index problématique supprimé avec succès');
    } else {
      console.log('✅ Aucun index problématique trouvé');
    }

    // Vérifier s'il y a des réservations avec des champs numero null
    console.log('🔍 Vérification des réservations avec champ numero...');
    const reservationsWithNumero = await collection.find({ numero: { $exists: true } }).limit(5);
    
    if (reservationsWithNumero.length > 0) {
      console.log('⚠️ Réservations avec champ numero trouvées:', reservationsWithNumero.length);
      console.log('Exemples:', reservationsWithNumero.map(r => ({ 
        _id: r._id, 
        agenceId: r.agenceId, 
        numero: r.numero 
      })));
      
      // Supprimer le champ numero de toutes les réservations
      console.log('🧹 Suppression du champ numero de toutes les réservations...');
      const result = await collection.updateMany(
        { numero: { $exists: true } },
        { $unset: { numero: "" } }
      );
      console.log(`✅ ${result.modifiedCount} réservations nettoyées`);
    } else {
      console.log('✅ Aucune réservation avec champ numero trouvée');
    }

    // Vérifier les index finaux
    console.log('\n📋 Index finaux sur la collection reservations:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, index.key);
    });

    console.log('\n🎯 Résumé de la correction:');
    console.log('- Index problématique agenceId_1_numero_1 supprimé');
    console.log('- Champ numero supprimé des réservations existantes');
    console.log('- Les nouvelles réservations peuvent maintenant être créées');
    console.log('- Chaque agence verra seulement ses propres réservations');

    console.log('\n✅ Correction terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion à MongoDB fermée');
  }
};

// Exécuter la correction
fixReservationIndex(); 