const asyncHandler = require('express-async-handler');
const BilletAvion = require('../models/billetModel');
const Agence = require('../models/agenceModel');
const { fetchBilletsFromGmail } = require('../services/emailService');
const { analyseDocumentAvecGroq } = require('../services/groqService');
const fs = require('fs');
const path = require('path');
const IATA_PATH = path.join(__dirname, '../services/iata_compagnies.json');
let IATA_LIST = [];
try {
  IATA_LIST = JSON.parse(fs.readFileSync(IATA_PATH, 'utf-8'));
} catch (e) {
  IATA_LIST = [];
}
function normalizeString(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[ -]/g, '') // retire les accents
    .replace(/[^a-z0-9]/g, ''); // retire espaces et caractères spéciaux
}
function findIataInfo(compagnie, code) {
  if (!compagnie && !code) return null;
  let found = null;
  // Recherche stricte
  if (compagnie) {
    found = IATA_LIST.find(item => item.name.toLowerCase() === compagnie.toLowerCase());
  }
  // Recherche par code
  if (!found && code) {
    found = IATA_LIST.find(item => item.id.toUpperCase() === code.toUpperCase());
  }
  // Recherche tolérante (sans accents, espaces, etc.)
  if (!found && compagnie) {
    const normComp = normalizeString(compagnie);
    found = IATA_LIST.find(item => normalizeString(item.name) === normComp);
  }
  // Recherche partielle (inclusion)
  if (!found && compagnie) {
    const normComp = normalizeString(compagnie);
    found = IATA_LIST.find(item => normalizeString(item.name).includes(normComp) || normComp.includes(normalizeString(item.name)));
  }
  // Recherche sur toutes les variantes du mapping
  if (!found && compagnie) {
    const normComp = normalizeString(compagnie);
    for (const item of IATA_LIST) {
      if (normalizeString(item.name) === normComp || normalizeString(item.name).includes(normComp) || normComp.includes(normalizeString(item.name))) {
        found = item;
        break;
      }
    }
  }
  if (!found && compagnie) {
    console.warn('[IATA] Mapping non trouvé pour :', compagnie);
  }
  return found;
}

// @desc    Get all billets
// @route   GET /api/billets
// @access  Private
const getBillets = asyncHandler(async (req, res) => {
  // In a real app, filter by agency ID from authenticated user
  const billets = await BilletAvion.find({});
  
  res.status(200).json({
    success: true,
    data: billets
  });
});

// @desc    Get billet by ID
// @route   GET /api/billets/:id
// @access  Private
const getBilletById = asyncHandler(async (req, res) => {
  const billet = await BilletAvion.findById(req.params.id);
  
  if (billet) {
    res.status(200).json({
      success: true,
      data: billet
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Billet non trouvé'
    });
  }
});

// @desc    Create new billet
// @route   POST /api/billets
// @access  Private
const createBillet = asyncHandler(async (req, res) => {
  let { 
    logo_compagnie,
    informations,
    agenceId: providedAgenceId
  } = req.body;
  
  // Récupération de l'agence depuis l'utilisateur connecté
  const agenceId = providedAgenceId || req.user?.agenceId;
  if (!agenceId) {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }
  
  // Vérification que l'agence existe
  const agence = await Agence.findById(agenceId);
  if (!agence) {
    return res.status(400).json({
      success: false,
      message: 'Agence non trouvée'
    });
  }

  // Traitement des informations de compagnie avec mapping IATA
  if (informations && informations.compagnie_aerienne) {
    const iataInfo = findIataInfo(informations.compagnie_aerienne, informations.code_compagnie);
    if (iataInfo) {
      informations.compagnie_aerienne = iataInfo.name;
      informations.code_compagnie = iataInfo.id;
      logo_compagnie = iataInfo.logo;
    }
  }

  // Validation et conversion des prix
  if (informations) {
    // Conversion sécurisée des prix
    if (informations.prix !== undefined) {
      const prix = parseFloat(informations.prix);
      informations.prix = isNaN(prix) ? 0 : prix;
    }
    if (informations.prix_ht !== undefined) {
      const prixHt = parseFloat(informations.prix_ht);
      informations.prix_ht = isNaN(prixHt) ? 0 : prixHt;
    }
    if (informations.prix_ttc !== undefined) {
      const prixTtc = parseFloat(informations.prix_ttc);
      informations.prix_ttc = isNaN(prixTtc) ? 0 : prixTtc;
    }
    if (informations.taxes !== undefined) {
      const taxes = parseFloat(informations.taxes);
      informations.taxes = isNaN(taxes) ? 0 : taxes;
    }

    // Si prix n'est pas défini mais prix_ttc l'est, utiliser prix_ttc
    if (informations.prix === undefined && informations.prix_ttc !== undefined) {
      informations.prix = informations.prix_ttc;
    }
  }

  // Création du billet avec la même structure que l'import Gmail
  const billet = await BilletAvion.create({
    logo_compagnie: logo_compagnie || '',
    agenceId: agenceId,
    fournisseurId: null, // Par défaut null, sera mis à jour plus tard
    informations: informations || {},
    sourceFile: null
  });
  
  res.status(201).json({
    success: true,
    message: 'Billet créé avec succès',
    data: billet
  });
});

// @desc    Update billet
// @route   PUT /api/billets/:id
// @access  Private
const updateBillet = asyncHandler(async (req, res) => {
  let { 
    logo_compagnie,
    informations,
    fournisseurId
  } = req.body;
  
  const billet = await BilletAvion.findById(req.params.id);
  if (billet) {
    // Traitement des informations de compagnie avec mapping IATA
    if (informations && informations.compagnie_aerienne) {
      const iataInfo = findIataInfo(informations.compagnie_aerienne, informations.code_compagnie);
      if (iataInfo) {
        informations.compagnie_aerienne = iataInfo.name;
        informations.code_compagnie = iataInfo.id;
        logo_compagnie = iataInfo.logo;
      }
    }

    // Validation et conversion des prix
    if (informations) {
      // Conversion sécurisée des prix
      if (informations.prix !== undefined) {
        const prix = parseFloat(informations.prix);
        informations.prix = isNaN(prix) ? 0 : prix;
      }
      if (informations.prix_ht !== undefined) {
        const prixHt = parseFloat(informations.prix_ht);
        informations.prix_ht = isNaN(prixHt) ? 0 : prixHt;
      }
      if (informations.prix_ttc !== undefined) {
        const prixTtc = parseFloat(informations.prix_ttc);
        informations.prix_ttc = isNaN(prixTtc) ? 0 : prixTtc;
      }
      if (informations.taxes !== undefined) {
        const taxes = parseFloat(informations.taxes);
        informations.taxes = isNaN(taxes) ? 0 : taxes;
      }

      // Si prix n'est pas défini mais prix_ttc l'est, utiliser prix_ttc
      if (informations.prix === undefined && informations.prix_ttc !== undefined) {
        informations.prix = informations.prix_ttc;
      }
    }

    // Mise à jour des champs
    if (logo_compagnie !== undefined) billet.logo_compagnie = logo_compagnie;
    if (informations !== undefined) billet.informations = { ...billet.informations, ...informations };
    if (fournisseurId !== undefined) billet.fournisseurId = fournisseurId;
    
    const updatedBillet = await billet.save();
    res.status(200).json({
      success: true,
      message: 'Billet mis à jour avec succès',
      data: updatedBillet
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Billet non trouvé'
    });
  }
});

// @desc    Delete billet
// @route   DELETE /api/billets/:id
// @access  Private
const deleteBillet = asyncHandler(async (req, res) => {
  const billet = await BilletAvion.findById(req.params.id);
  
  if (billet) {
    await BilletAvion.deleteOne({ _id: billet._id });
    
    res.status(200).json({
      success: true,
      message: 'Billet supprimé avec succès'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Billet non trouvé'
    });
  }
});

// Fonction utilitaire pour extraire le JSON d'une réponse IA potentiellement entourée de texte ou de balises Markdown
function extractJsonFromText(text) {
  if (!text) return null;
  // Cherche un bloc ```json ... ```
  const mdMatch = text.match(/```json([\s\S]*?)```/i);
  if (mdMatch) {
    try {
      return JSON.parse(mdMatch[1]);
    } catch (e) {}
  }
  // Cherche le premier { ... } qui ressemble à du JSON
  const jsonMatch = text.match(/({[\s\S]*})/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {}
  }
  // Dernière tentative : parse direct
  try {
    return JSON.parse(text);
  } catch (e) {}
  return null;
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

// Fonction utilitaire pour parser plusieurs formats de date
function parseDateFlexible(dateStr) {
  if (!dateStr) return null;
  // Format ISO ou YYYY-MM-DD
  let d = new Date(dateStr);
  if (!isNaN(d)) return d;
  // Format DDMMMYYYY (ex: 19Jan2022)
  const match = dateStr.match(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/);
  if (match) {
    const day = match[1];
    const monthStr = match[2].toLowerCase();
    const year = match[3];
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const month = months.indexOf(monthStr);
    if (month !== -1) {
      return new Date(Number(year), month, Number(day));
    }
  }
  // Format DD/MM/YYYY ou DD-MM-YYYY
  const match2 = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match2) {
    return new Date(Number(match2[3]), Number(match2[2]) - 1, Number(match2[1]));
  }
  return null;
}

// @desc    Import billets from Gmail
// @route   POST /api/billets/import-gmail
// @access  Private
const importBilletsFromGmail = asyncHandler(async (req, res) => {
  // Fonction pour envoyer les mises à jour de progression
  const sendProgress = (etape, message, pourcentage, data = {}) => {
    const progressData = {
      progress: { etape, message, pourcentage },
      ...data
    };
    res.write(`data: ${JSON.stringify(progressData)}\n\n`);
  };

  try {
    // Récupérer l'agence de l'utilisateur
    const agence = await Agence.findById(req.user.agenceId);
    if (!agence) {
      sendProgress('erreur', 'Agence non trouvée', 0);
      return res.end();
    }

    sendProgress('debut', 'Récupération de l\'agence...', 5);

    // Déterminer la date de début pour l'import
    let dateDebut;
    let isPremierImport = false;
    
    if (!agence.lastImport) {
      // Premier import - utiliser la logique bi-hebdomadaire
      isPremierImport = true;
      const maintenant = new Date();
      const jour = maintenant.getDate();
      
      if (jour <= 15) {
        // 1ère quinzaine : du 1er au 15
        dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        sendProgress('recherche', `Premier import - 1ère quinzaine: du 1er au ${jour} du mois`, 10);
      } else {
        // 2ème quinzaine : du 16 au 31
        dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 16);
        sendProgress('recherche', `Premier import - 2ème quinzaine: du 16 au ${jour} du mois`, 10);
      }
      
      console.log(`📅 Premier import - Date de début calculée: ${dateDebut.toISOString()}`);
    } else {
      // Import suivant - continuer à partir du dernier import
      dateDebut = new Date(agence.lastImport);
      sendProgress('recherche', `Import suivant depuis: ${dateDebut.toISOString()}`, 10);
      console.log(`📅 Import suivant - Date de début: ${dateDebut.toISOString()}`);
    }

    // Rechercher les emails dans Gmail
    sendProgress('recherche', 'Recherche dans Gmail...', 15);
    const resultatGmail = await fetchBilletsFromGmail({
      access_token: agence.gmailToken,
      refresh_token: agence.gmailRefreshToken
    }, dateDebut);
    
    const billets = resultatGmail.billets;
    const dernierEmailTraite = resultatGmail.dernierEmailDate;
    
    console.log(`📧 ${billets.length} billets trouvés dans Gmail`);
    sendProgress('trouves', `${billets.length} billets trouvés`, 20, {
      totalTrouves: billets.length
    });

    if (billets.length === 0) {
      // Même s'il n'y a pas de billets, on met à jour lastImport avec la date du dernier email traité
      if (dernierEmailTraite) {
        agence.lastImport = new Date(dernierEmailTraite);
        console.log(`📅 Aucun billet trouvé, lastImport mis à jour avec la date du dernier email traité: ${dernierEmailTraite.toISOString()}`);
      } else {
        // Si aucun email traité du tout, utiliser la date actuelle
        agence.lastImport = new Date();
        console.log(`📅 Aucun email traité, lastImport mis à jour avec la date actuelle`);
      }
      await agence.save();
      
      sendProgress('termine', 'Aucun nouveau billet trouvé', 100, {
        totalTrouves: 0,
        totalAnalyses: 0,
        totalEnregistres: 0
      });
      return res.end();
    }

    // Vérifier les doublons existants avant traitement
    const emailIds = billets.map(b => b.emailId).filter(Boolean);
    const billetsExistants = await BilletAvion.find({
      agenceId: agence._id,
      emailId: { $in: emailIds }
    }).select('emailId');
    
    const emailIdsExistants = new Set(billetsExistants.map(b => b.emailId));
    const billetsNonTraites = billets.filter(b => !emailIdsExistants.has(b.emailId));
    
    console.log(`📧 ${billets.length} billets trouvés, ${billetsNonTraites.length} nouveaux à traiter`);
    
    if (billetsNonTraites.length === 0) {
      // Tous les billets ont déjà été traités
      if (dernierEmailTraite) {
        agence.lastImport = new Date(dernierEmailTraite);
        await agence.save();
      }
      
      sendProgress('termine', 'Tous les billets ont déjà été traités', 100, {
        totalTrouves: billets.length,
        totalAnalyses: 0,
        totalEnregistres: 0
      });
      return res.end();
    }

    let totalEnregistres = 0;
    let dernierEmailId = null;
    let dernierEmailDate = null;

    // Traiter chaque billet non traité
    for (let i = 0; i < billetsNonTraites.length; i++) {
      const billet = billetsNonTraites[i];
      
      sendProgress('analyse', `Analyse du billet ${i + 1}/${billetsNonTraites.length}`, 20 + (i * 25), {
        totalTrouves: billets.length,
        totalAnalyses: i + 1,
        totalEnregistres: totalEnregistres
      });

      try {
        console.log(`🔍 Analyse du billet ${i + 1}/${billetsNonTraites.length} (emailId: ${billet.emailId})`);

        // Appel IA Groq pour structuration
        const iaResult = await analyseDocumentAvecGroq({ texte: billet.text });
        let billetJson = extractJsonFromText(iaResult);

        if (!billetJson) {
          console.error('Réponse non JSON:', iaResult);
          continue;
        }

        // Vérifie la catégorie et les champs principaux
        if (billetJson.categorie && billetJson.categorie.toLowerCase().includes('billet')) {
          // Cherche la date de départ dans informations.vols[0].date
          const vols = billetJson.informations && Array.isArray(billetJson.informations.vols) ? billetJson.informations.vols : [];
          const dateDepartStr = vols[0]?.date;
          const dateArriveeStr = vols[1]?.date || vols[0]?.date;
          const dateDepart = dateDepartStr ? parseDateFlexible(dateDepartStr) : null;
          const dateArrivee = dateArriveeStr ? parseDateFlexible(dateArriveeStr) : dateDepart;
          
          if (!dateDepart || !isValidDate(dateDepart)) {
            console.error('Date de départ invalide pour ce billet :', billetJson);
            continue;
          }

          // Vérification finale des doublons (double sécurité)
          const doublon = await BilletAvion.findOne({
            agenceId: agence._id,
            emailId: billet.emailId
          });

          if (!doublon) {
            // Appliquer le mapping IATA sur la compagnie IA
            let compagnieIA = billetJson.informations?.compagnie_aerienne || '';
            let iataInfo = findIataInfo(compagnieIA, '');
            if (iataInfo) {
              billetJson.informations.compagnie_aerienne = iataInfo.name;
              billetJson.informations.code_compagnie = iataInfo.id;
              billetJson.logo_compagnie = iataInfo.logo;
            }

            // Calcul automatique des taxes
            const prix_ht = Number(billetJson.informations?.prix_ht) || 0;
            const prix_ttc = Number(billetJson.informations?.prix_ttc) || 0;
            if (prix_ht > 0 && prix_ttc > 0) {
              billetJson.informations.taxes = prix_ttc - prix_ht;
            } else {
              billetJson.informations.taxes = 0;
            }

            // Corriger le chemin du fichier avec le vrai nom de l'agence
            let correctedFilePath = billet.filePath;
            if (billet.filePath && billet.filePath.includes('agences/default')) {
              // Remplacer 'default' par le vrai nom de l'agence
              const agenceName = agence.nom.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
              correctedFilePath = billet.filePath.replace('agences/default', `agences/${agenceName}`);
              
              // Déplacer le fichier vers le bon dossier
              const oldPath = path.join(__dirname, '../uploads', billet.filePath);
              const newPath = path.join(__dirname, '../uploads', correctedFilePath);
              
              // Créer le nouveau dossier s'il n'existe pas
              const newDir = path.dirname(newPath);
              if (!fs.existsSync(newDir)) {
                fs.mkdirSync(newDir, { recursive: true });
              }
              
              // Déplacer le fichier
              if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, newPath);
                console.log(`📁 Fichier déplacé: ${oldPath} → ${newPath}`);
              }
            }

            const nouveauBillet = await BilletAvion.create({
              logo_compagnie: billetJson.logo_compagnie || '',
              agenceId: agence._id,
              sourceFile: correctedFilePath || null,
              fournisseurId: null,
              emailId: billet.emailId, // Stocker l'ID de l'email pour éviter les doublons
              informations: {
                nom_passager: billetJson.informations?.nom_passager || '',
                numero_billet: billetJson.informations?.numero_billet || '',
                compagnie_aerienne: billetJson.informations?.compagnie_aerienne || '',
                code_compagnie: billetJson.informations?.code_compagnie || '',
                vols: billetJson.informations?.vols || [],
                classe: billetJson.informations?.classe || '',
                prix: billetJson.informations?.prix ? Number(billetJson.informations.prix) : 0,
                prix_ht: billetJson.informations?.prix_ht ? Number(billetJson.informations.prix_ht) : 0,
                prix_ttc: billetJson.informations?.prix_ttc ? Number(billetJson.informations.prix_ttc) : 0,
                taxes: billetJson.informations?.taxes ? Number(billetJson.informations.taxes) : 0,
                PNR: billetJson.informations?.PNR || '',
                date_emission: billetJson.informations?.date_emission || '',
                bagages: billetJson.informations?.bagages || '',
                statut: billetJson.informations?.statut || 'confirmé',
                type_pax: billetJson.informations?.type_pax || '',
                type_vol: billetJson.informations?.type_vol || ''
              }
            });

            totalEnregistres++;
            console.log(`✅ Billet enregistré ${totalEnregistres}/${billetsNonTraites.length} (emailId: ${billet.emailId})`);
          } else {
            console.log(`⚠️ Doublon détecté pour l'email ${billet.emailId}, billet déjà enregistré`);
          }
        } else {
          console.log(`⚠️ Document non reconnu comme billet: ${billetJson.categorie}`);
        }

        // Garder trace du dernier email traité
        dernierEmailId = billet.emailId;
        dernierEmailDate = billet.dateEmail;

        sendProgress('enregistrement', `Billet ${i + 1} enregistré`, 20 + (i * 25) + 10, {
          totalTrouves: billets.length,
          totalAnalyses: i + 1,
          totalEnregistres: totalEnregistres
        });

        // Pause entre les analyses pour respecter les limites de l'API
        if (i < billetsNonTraites.length - 1) {
          sendProgress('pause', 'Prochaine analyse...', 20 + (i * 25) + 15);
          await new Promise(resolve => setTimeout(resolve, 2500));
        }

      } catch (error) {
        console.error(`Erreur lors de l'analyse du billet ${i + 1}:`, error);
        sendProgress('erreur', `Erreur analyse billet ${i + 1}: ${error.message}`, 20 + (i * 25));
        continue;
      }
    }

    // Mettre à jour lastImport avec la date du dernier email traité
    if (dernierEmailTraite) {
      agence.lastImport = new Date(dernierEmailTraite);
      console.log(`📅 lastImport mis à jour avec la date du dernier email traité: ${dernierEmailTraite}`);
    } else if (dernierEmailDate) {
      // Fallback : utiliser la date du dernier email avec billet
      agence.lastImport = new Date(dernierEmailDate);
      console.log(`📅 lastImport mis à jour avec la date du dernier email avec billet: ${dernierEmailDate}`);
    } else {
      // Si aucun email traité, utiliser la date actuelle
      agence.lastImport = new Date();
      console.log(`📅 lastImport mis à jour avec la date actuelle (aucun email traité)`);
    }
    
    await agence.save();

    sendProgress('termine', `Import terminé: ${totalEnregistres} billets enregistrés sur ${billetsNonTraites.length} nouveaux`, 100, {
      totalTrouves: billets.length,
      totalAnalyses: billetsNonTraites.length,
      totalEnregistres: totalEnregistres
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'import Gmail:', error);
    sendProgress('erreur', `Erreur: ${error.message}`, 0);
  } finally {
    res.end();
  }
});

// @desc    Analyse IA d'un document de voyage (texte ou PDF)
// @route   POST /api/billets/ia-analyse
// @access  Private
const iaAnalyseBillet = asyncHandler(async (req, res) => {
  const { texte } = req.body;
  if (!texte || typeof texte !== 'string' || texte.length < 10) {
    return res.status(400).json({ success: false, message: 'Texte à analyser manquant ou trop court.' });
  }
  try {
    const result = await analyseDocumentAvecGroq({ texte });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Erreur analyse IA Groq:', error);
    res.status(500).json({ success: false, message: 'Erreur analyse IA Groq', error: error.message });
  }
});

// @desc    Trouver les informations IATA d'une compagnie
// @route   POST /api/billets/find-iata-info
// @access  Private
const findIataInfoController = asyncHandler(async (req, res) => {
  try {
    // Vérifier que req.body existe
    if (!req.body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Données de requête manquantes' 
      });
    }

    const { compagnie, code } = req.body;
    
    if (!compagnie && !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Compagnie ou code requis' 
      });
    }

    const iataInfo = findIataInfo(compagnie, code);
    
    if (iataInfo) {
      return res.status(200).json({
    success: true,
        data: {
          id: iataInfo.id,
          name: iataInfo.name,
          logo: iataInfo.logo,
          lcc: iataInfo.lcc
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Compagnie non trouvée',
        data: null
      });
    }
  } catch (error) {
    console.error('Erreur recherche IATA:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la recherche IATA',
      error: error.message 
    });
  }
});

// @desc    Récupérer tous les billets non facturés
// @route   GET /api/billets/non-factures
// @access  Private
const getBilletsNonFactures = asyncHandler(async (req, res) => {
  const agenceId = req.user.agenceId;

  try {
    const billets = await BilletAvion.find({
      agenceId,
      factureClientId: { $exists: false },
      statut: { $in: ['confirmé', 'confirme', 'issued'] }
    }).sort({ createdAt: -1 });

    const billetsFormates = billets.map(billet => ({
      id: billet._id,
      _id: billet._id,
      numeroVol: billet.numeroVol || billet.informations?.numero_vol,
      compagnie: billet.compagnie || billet.informations?.compagnie_aerienne,
      code_compagnie: billet.code_compagnie || billet.informations?.code_compagnie,
      logo_compagnie: billet.logo_compagnie,
      dateDepart: billet.dateDepart || billet.informations?.date_depart,
      dateArrivee: billet.dateArrivee || billet.informations?.date_arrivee,
      origine: billet.origine || billet.informations?.ville_depart || billet.informations?.origine,
      destination: billet.destination || billet.informations?.ville_arrivee || billet.informations?.destination,
      passager: billet.passager || billet.informations?.nom_passager,
      prix: billet.prix || billet.informations?.prix_ttc || billet.informations?.montant_ttc,
      statut: billet.statut,
      informations: billet.informations,
      sourceFile: billet.sourceFile,
      numero_billet: billet.informations?.numero_billet || billet.numeroVol,
      nom_passager: billet.informations?.nom_passager || billet.passager,
      prix_ttc: billet.informations?.prix_ttc || billet.prix,
      montant_ttc: billet.informations?.montant_ttc || billet.prix
    }));

    res.json({
      success: true,
      count: billetsFormates.length,
      data: billetsFormates
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des billets non facturés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des billets non facturés'
    });
  }
});

module.exports = {
  getBillets,
  getBilletById,
  createBillet,
  updateBillet,
  deleteBillet,
  importBilletsFromGmail,
  iaAnalyseBillet,
  findIataInfoController,
  findIataInfo,
  getBilletsNonFactures
};