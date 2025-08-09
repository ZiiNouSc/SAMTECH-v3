const mongoose = require('mongoose');
const Fournisseur = require('../models/fournisseurModel');

// Mets ici le nom exact de ta base MongoDB (ex: 'samtech', 'stb', etc.)
const MONGO_URI = 'mongodb://localhost:27017/samtech';

async function main() {
  await mongoose.connect(MONGO_URI);

  // Test : find simple avec ObjectId
  const oid = new mongoose.Types.ObjectId("685ecaeadb1e9d697b03c12f");
  const fournisseurObjId = await Fournisseur.findOne({ _id: oid });
  console.log('Fournisseur trouvé (ObjectId) :', fournisseurObjId);

  // Test : find simple avec string
  const fournisseurStr = await Fournisseur.findOne({ _id: "685ecaeadb1e9d697b03c12f" });
  console.log('Fournisseur trouvé (string) :', fournisseurStr);

  // Agrégation avec ObjectId
  const resultObjId = await Fournisseur.aggregate([
    { $match: { _id: oid } },
    {
      $lookup: {
        from: "factures",
        let: { fournisseurId: "$_id" },
        pipeline: [
          { $match: {
            $expr: { $eq: ["$fournisseurId", "$$fournisseurId"] },
            agenceId: new mongoose.Types.ObjectId("685dbb548eed36f3f6ddb3fc"),
            statut: { $in: ["envoyee", "partiellement_payee", "en_retard"] }
          } }
        ],
        as: "factures"
      }
    },
    {
      $addFields: {
        nbFacturesPourSolde: { $size: "$factures" },
        soldeFournisseur: {
          $sum: {
            $map: {
              input: "$factures",
              as: "f",
              in: { $subtract: ["$$f.montantTTC", "$$f.montantPaye"] }
            }
          }
        }
      }
    }
  ]);
  console.log('Agrégation (ObjectId) :');
  console.dir(resultObjId, { depth: null });

  // Agrégation avec string
  const resultStr = await Fournisseur.aggregate([
    { $match: { _id: "685ecaeadb1e9d697b03c12f" } },
    {
      $lookup: {
        from: "factures",
        let: { fournisseurId: "$_id" },
        pipeline: [
          { $match: {
            $expr: { $eq: ["$fournisseurId", "$$fournisseurId"] },
            agenceId: new mongoose.Types.ObjectId("685dbb548eed36f3f6ddb3fc"),
            statut: { $in: ["envoyee", "partiellement_payee", "en_retard"] }
          } }
        ],
        as: "factures"
      }
    },
    {
      $addFields: {
        nbFacturesPourSolde: { $size: "$factures" },
        soldeFournisseur: {
          $sum: {
            $map: {
              input: "$factures",
              as: "f",
              in: { $subtract: ["$$f.montantTTC", "$$f.montantPaye"] }
            }
          }
        }
      }
    }
  ]);
  console.log('Agrégation (string) :');
  console.dir(resultStr, { depth: null });

  await mongoose.disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 