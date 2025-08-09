const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Extrait le texte d'un PDF (utilise pdf2pic puis tesseract)
 */
async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Erreur extraction PDF:', error);
    throw new Error('Impossible d\'extraire le texte du PDF');
  }
}

/**
 * Analyse un texte de billet avec l'IA Groq
 */
async function analyserBilletIA(texte) {
  try {
    if (!GROQ_API_KEY) {
      throw new Error('Clé API Groq non configurée');
    }

    const prompt = `Tu es un assistant expert en documents de voyage. Pour chaque texte reçu, retourne STRICTEMENT un JSON valide et sans texte autour
    
    ${texte}
    
  
    
    Alors je veux que tu me retourne un JSON avec la structure suivante :

{
  "categorie": "billet|voucher|visa|assurance|autre",
  "type_trajet": "aller simple|aller-retour|multi-destinations|autre",
  "informations": {
    "nom_passager": "",
    "numero_billet": "",
    "compagnie_aerienne": "",
    "code_compagnie": "", // Ex : AH pour Air Algérie, AF pour Air France, SV pour Saudi Arabian Airlines, etc.
    "vols": [
      {
        "depart": "",
        "arrivee": "",
        "date": "YYYY-MM-DD",
        "heure_depart": "HH:mm",
        "heure_arrivee": "HH:mm",
        "numero_vol": ""
      }
    ],
    "classe": "", // TRÈS IMPORTANT : Classe de vol exacte trouvée dans le document
    "prix_ht": 0, // Montant HT (hors taxes) en dinars algériens
    "prix_ttc": 0, // Montant TTC (avec taxes) en dinars algériens
    "taxes": 0, // Montant des taxes (TTC - HT)
    "prix": 0, // Montant total (utiliser TTC si disponible, sinon prix brut)
    "PNR": "",
    "date_emission": "YYYY-MM-DD",
    "bagages": "",
    "statut": "", // Statut réel du billet : "Confirmed", "Cancelled", "Pending", "Issued", "Void", etc.
    "type_pax": "", // ADT (adulte), CHD (enfant), INF (bébé)
    "type_vol": "" // Vol domestique (Algérie → Algérie), Vol international (depuis Algérie), Vol vers l'Algérie
  }
}

INSTRUCTIONS SPÉCIALES POUR LA CLASSE DE VOL :
- Le champ 'classe' est CRUCIAL et doit être extrait avec précision
- Cherche dans le document les termes suivants pour la classe :
  * Codes de classe : Y, S, B, M, K, H, Q, L, T, X, W, E, U, N, R, P, F, A, J, C, D, I, Z
  * Noms de classe : Economy, Business, First, Premium Economy, Economy Plus
  * Abréviations : ECO, BUS, FST, PRE, YCL, BCL, FCL
  * Combinaisons : "Y/B" signifie classe Y ou B
  * Si plusieurs classes : séparer par virgule (ex: "Y,B" ou "Economy,Business")
- EXEMPLES de classes à extraire :
  * "Y" = Economy class
  * "B,G" = Business et Economy
  * "Economy" = Classe économique
  * "Business" = Classe affaires
  * "First" = Première classe
  * "Y/B" = Economy ou Business
  * "SOperated by: AIR ALGERIE" = Extraire seulement la partie classe avant cette phrase
- Si la classe n'est pas claire, mettre "Non spécifié" au lieu de laisser vide

AUTRES INSTRUCTIONS IMPORTANTES :
- Le champ 'code_compagnie' doit être le code IATA officiel de la compagnie (ex : Air Algérie = AH, Air France = AF, Turkish Airlines = TK, Saudi Arabian Airlines = SV, etc.).
- Le champ 'type_pax' doit être ADT, CHD ou INF selon le passager (adulte, enfant, bébé).
- Le champ 'type_vol' doit être l'un de : "domestique", "vers_algerie", "depuis_algerie", "etranger" selon l'itinéraire.
- Le champ 'type_trajet' doit être 'aller simple' si un seul vol, 'aller-retour' si deux vols avec retour, 'multi-destinations' si plus de deux vols.
- Toutes les dates doivent être au format ISO (YYYY-MM-DD).
- Pour les montants, essaie de distinguer :
  * prix_ht : montant hors taxes (base fare)
  * prix_ttc : montant avec taxes (total amount)
  * taxes : montant des taxes (différence TTC - HT)
  * prix : montant total (utiliser TTC si disponible)
- Pour le statut, utilise le statut réel du billet trouvé dans le document :
  * "Confirmed" si confirmé
  * "Cancelled" si annulé
  * "Pending" si en attente
  * "Issued" si émis
  * "Void" si annulé
  * "Refunded" si remboursé
  * etc.
- Ne retourne que le JSON, sans texte autour ni balises markdown.

EXEMPLE DE JSON ATTENDU :
{
  "categorie": "billet",
  "type_trajet": "aller-retour",
  "informations": {
    "nom_passager": "DUPONT Jean",
    "numero_billet": "1234567890",
    "compagnie_aerienne": "Air Algérie",
    "code_compagnie": "AH",
    "vols": [
      {
        "depart": "Alger",
        "arrivee": "Paris",
        "date": "2024-07-01",
        "heure_depart": "10:00",
        "heure_arrivee": "13:00",
        "numero_vol": "AH1234"
      },
      {
        "depart": "Paris",
        "arrivee": "Alger",
        "date": "2024-07-10",
        "heure_depart": "15:00",
        "heure_arrivee": "18:00",
        "numero_vol": "AH1235"
      }
    ],
    "classe": "Y",
    "prix_ht": 30000,
    "prix_ttc": 35000,
    "taxes": 5000,
    "prix": 35000,
    "PNR": "ABC123",
    "date_emission": "2024-06-15",
    "bagages": "23kg",
    "statut": "Confirmed",
    "type_pax": "ADT",
    "type_vol": "international"
  }
}
  
`

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'mistral-saba-24b',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    console.log('Réponse IA brute:', aiResponse);
    
    // Essayer de parser le JSON de la réponse
    try {
      // Nettoyer la réponse pour extraire seulement le JSON
      let jsonStart = aiResponse.indexOf('{');
      let jsonEnd = aiResponse.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd !== 0) {
        const jsonString = aiResponse.substring(jsonStart, jsonEnd);
        const parsedResult = JSON.parse(jsonString);
        return parsedResult;
      } else {
        throw new Error('Aucun JSON trouvé dans la réponse');
      }
    } catch (parseError) {
      console.error('Erreur parsing JSON IA:', parseError);
      console.log('Réponse IA brute:', aiResponse);
      
      // Retourner une structure par défaut si le parsing échoue
      return {
        informations: {
          nom_passager: '',
          numero_billet: '',
          compagnie_aerienne: '',
          code_compagnie: '',
          vols: [],
          classe: '',
          prix_ht: 0,
          prix_ttc: 0,
          taxes: 0,
          PNR: '',
          date_emission: '',
          bagages: '',
          statut: 'en_attente',
          type_pax: 'ADT',
          type_vol: 'depuis_algerie'
        }
      };
    }
  } catch (error) {
    console.error('Erreur analyse IA:', error);
    throw new Error('Erreur lors de l\'analyse IA du billet');
  }
}

/**
 * Analyse un texte de voucher hôtel avec l'IA Groq
 */
async function analyserHotelIA(texte) {
  try {
    if (!GROQ_API_KEY) {
      throw new Error('Clé API Groq non configurée');
    }

    const prompt = `Tu es un assistant expert en documents de voyage et de réservation hôtelière. Pour chaque texte reçu, retourne STRICTEMENT un JSON valide et sans texte autour.

    ${texte}

    Analyse ce document et retourne un JSON avec la structure suivante :

{
  "categorie": "voucher",
  "informations": {
    "nom_client": "",
    "nom_hotel": "",
    "ville": "",
    "pays": "",
    "adresse_hotel": "",
    "date_entree": "YYYY-MM-DD",
    "date_sortie": "YYYY-MM-DD",
    "nombre_nuits": 0,
    "nombre_chambres": 1,
    "type_chambre": "",
    "nombre_personnes": 1,
    "pension": "", // Sans pension, Petit-déjeuner, Demi-pension, Pension complète
    "numero_voucher": "",
    "numero_reservation": "",
    "numero_confirmation": "",
    "prix_ht": 0, // Montant HT en dinars algériens
    "prix_ttc": 0, // Montant TTC en dinars algériens
    "taxes": 0, // Montant des taxes
    "prix_par_nuit": 0,
    "devise_originale": "",
    "statut": "", // Confirmé, En attente, Annulé, etc.
    "date_emission": "YYYY-MM-DD",
    "agence_voyage": "",
    "notes_speciales": "",
    "politique_annulation": "",
    "services_inclus": []
  }
}

INSTRUCTIONS IMPORTANTES :
- Cherche tous les noms/prénoms mentionnés pour identifier le client
- Extrait le nom exact de l'hôtel et sa localisation
- Les dates doivent être au format ISO (YYYY-MM-DD)
- Calcule le nombre de nuits automatiquement si possible
- Identifie tous les numéros de référence (voucher, réservation, confirmation)
- Pour les montants, distingue HT/TTC si possible
- Extrait le type de chambre (Single, Double, Twin, Suite, etc.)
- Identifie le type de pension (BB = Petit-déjeuner, HB = Demi-pension, FB = Pension complète)
- Note tous les services inclus mentionnés
- Pour le statut, utilise : "confirme", "en_attente", "annule", "modifie"
- Ne retourne que le JSON, sans texte autour ni balises markdown

EXEMPLE DE JSON ATTENDU :
{
  "categorie": "voucher",
  "informations": {
    "nom_client": "MARTIN Pierre",
    "nom_hotel": "Hôtel Sofitel Alger",
    "ville": "Alger",
    "pays": "Algérie",
    "adresse_hotel": "172 Rue Hassiba Ben Bouali, Alger",
    "date_entree": "2024-07-15",
    "date_sortie": "2024-07-20",
    "nombre_nuits": 5,
    "nombre_chambres": 1,
    "type_chambre": "Chambre Double Supérieure",
    "nombre_personnes": 2,
    "pension": "Petit-déjeuner",
    "numero_voucher": "HTL-2024-001234",
    "numero_reservation": "RES-789456",
    "numero_confirmation": "CONF-ABC123",
    "prix_ht": 50000,
    "prix_ttc": 59500,
    "taxes": 9500,
    "prix_par_nuit": 11900,
    "devise_originale": "DA",
    "statut": "confirme",
    "date_emission": "2024-06-15",
    "agence_voyage": "SamTech Travel",
    "notes_speciales": "Vue sur mer demandée",
    "politique_annulation": "Annulation gratuite jusqu'à 24h avant l'arrivée",
    "services_inclus": ["WiFi gratuit", "Petit-déjeuner", "Parking"]
  }
}`;

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'mistral-saba-24b',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    console.log('Réponse IA Hôtel brute:', aiResponse);
    
    try {
      let jsonStart = aiResponse.indexOf('{');
      let jsonEnd = aiResponse.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd !== 0) {
        const jsonString = aiResponse.substring(jsonStart, jsonEnd);
        const parsedResult = JSON.parse(jsonString);
        return parsedResult;
      } else {
        throw new Error('Aucun JSON trouvé dans la réponse');
      }
    } catch (parseError) {
      console.error('Erreur parsing JSON IA Hôtel:', parseError);
      return {
        informations: {
          nom_client: '',
          nom_hotel: '',
          ville: '',
          pays: '',
          date_entree: '',
          date_sortie: '',
          nombre_nuits: 0,
          nombre_chambres: 1,
          type_chambre: '',
          nombre_personnes: 1,
          pension: '',
          numero_voucher: '',
          numero_reservation: '',
          prix_ht: 0,
          prix_ttc: 0,
          taxes: 0,
          statut: 'en_attente',
          date_emission: ''
        }
      };
    }
  } catch (error) {
    console.error('Erreur analyse IA Hôtel:', error);
    throw new Error('Erreur lors de l\'analyse IA du voucher hôtel');
  }
}

/**
 * Analyse un texte de demande de visa avec l'IA Groq
 */
async function analyserVisaIA(texte) {
  try {
    if (!GROQ_API_KEY) {
      throw new Error('Clé API Groq non configurée');
    }

    const prompt = `Tu es un assistant expert en documents de visa et demandes consulaires. Pour chaque texte reçu, retourne STRICTEMENT un JSON valide et sans texte autour.

    ${texte}

    Analyse ce document et retourne un JSON avec la structure suivante :

{
  "categorie": "visa",
  "informations": {
    "nom_client": "",
    "prenom_client": "",
    "numero_passeport": "",
    "nationalite": "",
    "date_naissance": "YYYY-MM-DD",
    "pays_destination": "",
    "ambassade_consulat": "",
    "type_visa": "", // Tourisme, Affaires, Transit, Étudiant, Travail, etc.
    "duree_visa": "", // Court séjour, Long séjour, etc.
    "nombre_entrees": "", // Simple, Multiple
    "duree_sejour": "", // en jours
    "date_depot": "YYYY-MM-DD",
    "date_rendez_vous": "YYYY-MM-DD",
    "date_voyage_prevue": "YYYY-MM-DD",
    "date_retour_prevue": "YYYY-MM-DD",
    "numero_dossier": "",
    "numero_demande": "",
    "numero_visa": "",
    "frais_consulaires": 0, // en dinars algériens
    "frais_service": 0,
    "prix_total": 0,
    "statut": "", // Déposé, En cours, Accordé, Refusé, Retiré
    "date_emission": "YYYY-MM-DD",
    "date_expiration": "YYYY-MM-DD",
    "documents_requis": [],
    "motif_voyage": "",
    "adresse_destination": "",
    "contact_destination": "",
    "agence_visa": "",
    "notes": ""
  }
}

INSTRUCTIONS IMPORTANTES :
- Extrait le nom complet du demandeur (nom et prénom séparés)
- Identifie le pays de destination et le type de visa demandé
- Cherche tous les numéros de référence (dossier, demande, visa)
- Les dates doivent être au format ISO (YYYY-MM-DD)
- Pour les types de visa, utilise : "tourisme", "affaires", "transit", "etudiant", "travail", "famille", "medical"
- Pour le statut, utilise : "depose", "en_cours", "accorde", "refuse", "retire", "expire"
- Distingue les frais consulaires des frais de service
- Extrait la liste des documents requis si mentionnés
- Identifie l'ambassade ou consulat concerné
- Pour la durée, précise en jours (ex: "30 jours", "90 jours")
- Ne retourne que le JSON, sans texte autour ni balises markdown

EXEMPLE DE JSON ATTENDU :
{
  "categorie": "visa",
  "informations": {
    "nom_client": "BOUALI",
    "prenom_client": "Fatima",
    "numero_passeport": "123456789",
    "nationalite": "Algérienne",
    "date_naissance": "1985-03-15",
    "pays_destination": "France",
    "ambassade_consulat": "Consulat de France à Alger",
    "type_visa": "tourisme",
    "duree_visa": "court_sejour",
    "nombre_entrees": "multiple",
    "duree_sejour": "90 jours",
    "date_depot": "2024-07-01",
    "date_rendez_vous": "2024-07-03",
    "date_voyage_prevue": "2024-08-15",
    "date_retour_prevue": "2024-08-30",
    "numero_dossier": "VISA-2024-7891",
    "numero_demande": "DEM-456789",
    "numero_visa": "",
    "frais_consulaires": 8000,
    "frais_service": 2000,
    "prix_total": 10000,
    "statut": "en_cours",
    "date_emission": "2024-07-01",
    "date_expiration": "",
    "documents_requis": ["Passeport", "Photos", "Attestation travail", "Relevé bancaire"],
    "motif_voyage": "Tourisme et visite familiale",
    "adresse_destination": "Paris, France",
    "contact_destination": "Hotel Plaza, Paris",
    "agence_visa": "SamTech Visa Services",
    "notes": "Première demande de visa Schengen"
  }
}`;

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'mistral-saba-24b',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    console.log('Réponse IA Visa brute:', aiResponse);
    
    try {
      let jsonStart = aiResponse.indexOf('{');
      let jsonEnd = aiResponse.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd !== 0) {
        const jsonString = aiResponse.substring(jsonStart, jsonEnd);
        const parsedResult = JSON.parse(jsonString);
        return parsedResult;
      } else {
        throw new Error('Aucun JSON trouvé dans la réponse');
      }
    } catch (parseError) {
      console.error('Erreur parsing JSON IA Visa:', parseError);
      return {
        informations: {
          nom_client: '',
          prenom_client: '',
          numero_passeport: '',
          nationalite: '',
          pays_destination: '',
          type_visa: '',
          date_depot: '',
          numero_dossier: '',
          frais_consulaires: 0,
          prix_total: 0,
          statut: 'en_cours',
          date_emission: ''
        }
      };
    }
  } catch (error) {
    console.error('Erreur analyse IA Visa:', error);
    throw new Error('Erreur lors de l\'analyse IA de la demande de visa');
  }
}

/**
 * Analyse un texte d'assurance voyage avec l'IA Groq
 */
async function analyserAssuranceIA(texte) {
  try {
    if (!GROQ_API_KEY) {
      throw new Error('Clé API Groq non configurée');
    }

    const prompt = `Tu es un assistant expert en documents d'assurance voyage. Pour chaque texte reçu, retourne STRICTEMENT un JSON valide et sans texte autour.

    ${texte}

    Analyse ce document et retourne un JSON avec la structure suivante :

{
  "categorie": "assurance",
  "informations": {
    "nom_assure": "",
    "prenom_assure": "",
    "date_naissance": "YYYY-MM-DD",
    "nationalite": "",
    "numero_passeport": "",
    "compagnie_assurance": "",
    "type_assurance": "", // Voyage, Rapatriement, Médicale, Annulation, Multirisque, etc.
    "numero_police": "",
    "numero_contrat": "",
    "numero_certificat": "",
    "date_debut": "YYYY-MM-DD",
    "date_fin": "YYYY-MM-DD",
    "duree_couverture": "", // en jours
    "destinations_couvertes": [],
    "montant_couverture": 0, // Montant maximum couvert
    "franchise": 0,
    "prime_ht": 0, // Prime HT en dinars algériens
    "prime_ttc": 0, // Prime TTC en dinars algériens
    "taxes": 0,
    "devise_originale": "",
    "garanties_incluses": [],
    "exclusions": [],
    "statut": "", // Active, Expirée, Annulée, Suspendue
    "date_emission": "YYYY-MM-DD",
    "date_souscription": "YYYY-MM-DD",
    "beneficiaires": [],
    "contact_assistance": "",
    "numero_assistance": "",
    "conditions_particulieres": "",
    "agent_souscripteur": "",
    "notes": ""
  }
}

INSTRUCTIONS IMPORTANTES :
- Extrait le nom complet de l'assuré (nom et prénom séparés)
- Identifie la compagnie d'assurance et le type de police
- Cherche tous les numéros de référence (police, contrat, certificat)
- Les dates doivent être au format ISO (YYYY-MM-DD)
- Calcule la durée en jours si possible
- Pour les types d'assurance, utilise : "voyage", "rapatriement", "medicale", "annulation", "bagages", "responsabilite_civile", "multirisque"
- Pour le statut, utilise : "active", "expiree", "annulee", "suspendue", "en_attente"
- Extrait toutes les garanties et couvertures mentionnées
- Note les exclusions importantes
- Distingue prime HT/TTC si mentionné
- Identifie les destinations couvertes
- Extrait les contacts d'assistance d'urgence
- Pour les montants de couverture, utilise la devise originale puis convertis en DA si possible
- Ne retourne que le JSON, sans texte autour ni balises markdown

EXEMPLE DE JSON ATTENDU :
{
  "categorie": "assurance",
  "informations": {
    "nom_assure": "BENALI",
    "prenom_assure": "Ahmed",
    "date_naissance": "1980-05-20",
    "nationalite": "Algérienne",
    "numero_passeport": "987654321",
    "compagnie_assurance": "Allianz Travel",
    "type_assurance": "voyage",
    "numero_police": "POL-2024-12345",
    "numero_contrat": "CTR-789456",
    "numero_certificat": "CERT-ABC123",
    "date_debut": "2024-08-01",
    "date_fin": "2024-08-31",
    "duree_couverture": "30 jours",
    "destinations_couvertes": ["Europe", "Schengen"],
    "montant_couverture": 30000,
    "franchise": 50,
    "prime_ht": 5000,
    "prime_ttc": 5950,
    "taxes": 950,
    "devise_originale": "EUR",
    "garanties_incluses": ["Frais médicaux", "Rapatriement", "Responsabilité civile", "Bagages"],
    "exclusions": ["Sports extrêmes", "Maladies préexistantes"],
    "statut": "active",
    "date_emission": "2024-07-15",
    "date_souscription": "2024-07-15",
    "beneficiaires": ["BENALI Ahmed"],
    "contact_assistance": "assistance@allianz-travel.com",
    "numero_assistance": "+33 1 42 99 02 02",
    "conditions_particulieres": "Couverture COVID-19 incluse",
    "agent_souscripteur": "SamTech Insurance",
    "notes": "Police famille, couvre conjoint et enfants"
  }
}`;

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'mistral-saba-24b',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    console.log('Réponse IA Assurance brute:', aiResponse);
    
    try {
      let jsonStart = aiResponse.indexOf('{');
      let jsonEnd = aiResponse.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd !== 0) {
        const jsonString = aiResponse.substring(jsonStart, jsonEnd);
        const parsedResult = JSON.parse(jsonString);
        return parsedResult;
      } else {
        throw new Error('Aucun JSON trouvé dans la réponse');
      }
    } catch (parseError) {
      console.error('Erreur parsing JSON IA Assurance:', parseError);
      return {
        informations: {
          nom_assure: '',
          prenom_assure: '',
          compagnie_assurance: '',
          type_assurance: '',
          numero_police: '',
          date_debut: '',
          date_fin: '',
          montant_couverture: 0,
          prime_ht: 0,
          prime_ttc: 0,
          statut: 'active',
          date_emission: ''
        }
      };
    }
  } catch (error) {
    console.error('Erreur analyse IA Assurance:', error);
    throw new Error('Erreur lors de l\'analyse IA de l\'assurance');
  }
}

module.exports = {
  extractTextFromPDF,
  analyserBilletIA,
  analyserHotelIA,
  analyserVisaIA,
  analyserAssuranceIA
}; 