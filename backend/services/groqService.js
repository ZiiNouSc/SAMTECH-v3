const { Groq } = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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',
});

async function analyseDocumentAvecGroq({ texte, model = 'mistral-saba-24b' }) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Tu es un assistant expert en documents de voyage. Pour chaque texte reçu, retourne STRICTEMENT un JSON valide et sans texte autour, avec la structure suivante :

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
}`
      },
      {
        role: 'user',
        content: texte
      }
    ],
    model,
    temperature: 0.1, // Réduit pour plus de précision
    max_completion_tokens: 1024,
    top_p: 1,
    stream: false
  });
  return chatCompletion.choices[0]?.message?.content || '';
}

module.exports = { analyseDocumentAvecGroq }; 