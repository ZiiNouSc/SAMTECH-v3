const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const Agence = require('../models/agenceModel');
const { OAuth2Client } = require('google-auth-library');
const { simpleParser } = require('mailparser');
const pdfParse = require('pdf-parse');
const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');

// Configuration pour l'envoi d'emails
const createTransporter = async (agenceId) => {
  try {
    // Si agenceId est fourni, essayer d'utiliser Gmail OAuth2
    if (agenceId) {
      const agence = await Agence.findById(agenceId);
      
      if (agence && agence.gmailToken && agence.gmailRefreshToken) {
        // Configuration OAuth2 pour Gmail
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        
        oauth2Client.setCredentials({
          access_token: agence.gmailToken,
          refresh_token: agence.gmailRefreshToken
        });
        
        const accessToken = await oauth2Client.getAccessToken();
        
        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: agence.gmailEmail,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: agence.gmailRefreshToken,
            accessToken: accessToken.token
          }
        });
      }
    }
    
    // Fallback: utiliser la configuration SMTP standard
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création du transporteur email:', error);
    
    // En cas d'erreur, utiliser un transporteur de test (ethereal)
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
};

// Fonction pour envoyer un email
const sendEmail = async (options) => {
  try {
    const { to, subject, html, from, agenceId, attachments } = options;
    
    const transporter = await createTransporter(agenceId);
    
    const mailOptions = {
      from: from || `"SamTech" <${process.env.SMTP_USER || 'noreply@samtech.com'}>`,
      to,
      subject,
      html,
      attachments: attachments || []
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email envoyé:', info.messageId);
    
    // Pour les emails de test (ethereal), afficher l'URL de prévisualisation
    if (info.messageId && info.messageId.includes('ethereal')) {
      console.log('URL de prévisualisation:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
  }
};

// Fonction pour envoyer une facture par email
const sendFactureEmail = async (factureId, agenceId, emailData) => {
  try {
    // Ici, on pourrait générer le PDF de la facture et l'attacher à l'email
    // Pour l'instant, on envoie juste l'email sans pièce jointe
    
    const info = await sendEmail({
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.message,
      agenceId: agenceId
    });
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la facture par email:', error);
    throw new Error(`Erreur lors de l'envoi de la facture par email: ${error.message}`);
  }
};

// Liste enrichie de mots-clés pour la détection de documents de voyage
const KEYWORDS = [
  // Français
  'billet', 'e-ticket', 'réservation', 'voucher', 'compagnie', 'numéro de vol', 'passager', 'PNR', 'itinéraire', 'confirmation', 'vol', 'départ', 'arrivée', 'classe', 'bagage', 'escale', 'destination', 'retour',
  // Anglais
  'ticket', 'flight', 'e-ticket', 'booking', 'voucher', 'departure', 'passenger', 'airline', 'PNR', 'itinerary', 'confirmation', 'class', 'baggage', 'stopover', 'destination', 'return',
  'boarding', 'boarding pass', 'check-in', 'gate', 'terminal', 'seat', 'window', 'aisle', 'row', 'reference', 'reference number', 'record locator', 'carrier', 'fare', 'tax', 'total', 'amount', 'issued', 'issue date', 'valid', 'validity', 'outbound', 'inbound', 'from', 'to', 'via', 'connecting', 'layover', 'transit', 'arrival', 'departure time', 'arrival time', 'class', 'economy', 'business', 'first class', 'one way', 'round trip', 'multi-city', 'stop', 'stops', 'direct', 'nonstop', 'connecting flight', 'flight details', 'flight information', 'traveler', 'travellers', 'passengers', 'adults', 'children', 'infants', 'infant', 'child', 'adult', 'ticket number', 'e-ticket number', 'document number', 'reference code', 'booking reference', 'booking code', 'travel document', 'travel itinerary', 'travel details', 'travel info', 'travel date', 'travel agency', 'agency', 'agent', 'customer', 'client', 'service', 'services', 'insurance', 'policy', 'coverage', 'claim', 'emergency', 'assistance', 'support', 'contact', 'phone', 'email', 'address', 'website', 'web', 'online', 'portal', 'manage', 'manage booking', 'manage reservation', 'cancel', 'cancellation', 'refund', 'change', 'modify', 'update', 'upgrade', 'downgrade', 'rebook', 'reissue', 'revalidation', 'void', 'expired', 'expiration', 'expiry', 'expiry date', 'valid until', 'valid from', 'issued by', 'issued on', 'issued at', 'issuing', 'issuing office', 'issuing agent', 'issuing airline', 'issuing carrier', 'issuing authority', 'issuing country', 'issuing state', 'issuing city', 'issuing location', 'issuing branch', 'issuing department', 'issuing division', 'issuing section', 'issuing unit', 'issuing team', 'issuing group', 'issuing organization', 'issuing company', 'issuing agency', 'issuing service', 'issuing support', 'issuing contact', 'issuing phone', 'issuing email', 'issuing address', 'issuing website', 'issuing web', 'issuing online', 'issuing portal', 'issuing manage', 'issuing manage booking', 'issuing manage reservation', 'issuing cancel', 'issuing cancellation', 'issuing refund', 'issuing change', 'issuing modify', 'issuing update', 'issuing upgrade', 'issuing downgrade', 'issuing rebook', 'issuing reissue', 'issuing revalidation', 'issuing void', 'issuing expired', 'issuing expiration', 'issuing expiry', 'issuing expiry date', 'issuing valid until', 'issuing valid from',
  // Arabe (Unicode ou translittéré)
  'تذكرة', 'رحلة', 'حجز', 'الراكب', 'رقم الحجز', 'الطيران', 'مغادرة', 'وصول', 'شركة', 'تأكيد', 'بطاقة صعود', 'بوابة', 'مقعد', 'نافذة', 'ممر', 'صف', 'مرجع', 'رقم مرجع', 'رقم الحجز', 'رقم التذكرة', 'رقم الوثيقة', 'وثيقة سفر', 'مسافر', 'مسافرين', 'بالغ', 'بالغين', 'طفل', 'أطفال', 'رضيع', 'تاريخ السفر', 'وكالة سفر', 'وكيل', 'عميل', 'خدمة', 'خدمات', 'تأمين', 'وثيقة التأمين', 'تغطية', 'مطالبة', 'طوارئ', 'مساعدة', 'دعم', 'اتصال', 'هاتف', 'بريد إلكتروني', 'عنوان', 'موقع', 'إلكتروني', 'بوابة', 'إدارة', 'إدارة الحجز', 'إلغاء', 'استرداد', 'تغيير', 'تعديل', 'تحديث', 'ترقية', 'تخفيض', 'إعادة الحجز', 'إعادة الإصدار', 'إعادة التحقق', 'إلغاء', 'منتهي', 'تاريخ الانتهاء', 'صالح حتى', 'صالح من', 'صادر عن', 'تاريخ الإصدار', 'مكان الإصدار', 'فرع الإصدار', 'قسم الإصدار', 'وحدة الإصدار', 'فريق الإصدار', 'مجموعة الإصدار', 'منظمة الإصدار', 'شركة الإصدار', 'وكالة الإصدار', 'خدمة الإصدار', 'دعم الإصدار', 'اتصال الإصدار', 'هاتف الإصدار', 'بريد الإصدار', 'عنوان الإصدار', 'موقع الإصدار', 'بوابة الإصدار', 'إدارة الإصدار', 'إدارة الحجز', 'إلغاء الإصدار', 'استرداد الإصدار', 'تغيير الإصدار', 'تعديل الإصدار', 'تحديث الإصدار', 'ترقية الإصدار', 'تخفيض الإصدار', 'إعادة الحجز الإصدار', 'إعادة الإصدار الإصدار', 'إعادة التحقق الإصدار', 'إلغاء الإصدار', 'منتهي الإصدار', 'تاريخ الانتهاء الإصدار', 'صالح حتى الإصدار', 'صالح من الإصدار',
  // Compagnies aériennes (exemples, à compléter)
  'air algerie', 'air france', 'transavia', 'tassili', 'turkish airlines', 'lufthansa', 'qatar airways', 'emirates', 'egyptair', 'tunisair', 'royal air maroc', 'vueling', 'iberia', 'aigle azur', 'saudia', 'british airways', 'alitalia', 'klm', 'air canada', 'air europa', 'pegasus', 'air arabia', 'air corsica', 'air serbia', 'air astana', 'air china', 'air india', 'air mauritius', 'air new zealand', 'air tahiti nui', 'austrian', 'brussels airlines', 'croatia airlines', 'ethiopian', 'gulf air', 'kenya airways', 'oman air', 'royal jordanian', 'rwandair', 'srilankan', 'tarom', 'tui fly', 'ukraine intl', 'uzbekistan airways',
  // Autres termes liés au voyage
  'visa', 'assurance', 'insurance', 'travel', 'voyage', 'tour', 'séjour', 'hotel', 'hébergement', 'accommodation', 'car rental', 'location voiture', 'transfert', 'transfer', 'excursion', 'guide', 'chauffeur', 'transport', 'navette', 'shuttle', 'boarding pass', 'boarding', 'embarquement', 'seat', 'siège', 'window', 'hublot', 'gate', 'porte', 'terminal', 'airport', 'aéroport', 'departure time', 'arrival time', 'heure de départ', 'heure d\'arrivée'
];

function containsKeyword(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return KEYWORDS.some(keyword => lower.includes(keyword));
}

// Fonction pour extraire le texte d'un PDF
const extractTextFromPDF = async (pdfBuffer) => {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte PDF:', error);
    return '';
  }
};

// Fonction pour lire les emails Gmail et extraire les billets (PDF ou texte)
/**
 * Récupère les emails récents de la boîte Gmail de l'agence et extrait les billets d'avion (PDF ou texte)
 * @param {Object} gmailCredentials - Les credentials Gmail de l'agence
 * @param {Date} dateDebut - Date de début pour filtrer les emails
 * @returns {Promise<Object>} Objet contenant les billets et la date du dernier email traité
 */
const fetchBilletsFromGmail = async (gmailCredentials, dateDebut) => {
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    auth.setCredentials(gmailCredentials);

    const gmail = google.gmail({ version: 'v1', auth });

    // Construire la requête de recherche optimisée
    let query = 'has:attachment';
    
    if (dateDebut) {
      const dateStr = dateDebut.toISOString().split('T')[0]; // Format YYYY-MM-DD
      query += ` after:${dateStr}`;
      console.log(`🔍 Recherche emails après le ${dateStr}`);
    } else {
      console.log('🔍 Recherche emails sans filtre de date (premier import)');
    }

    // Ajouter des filtres pour optimiser la recherche
    query += ' (subject:billet OR subject:ticket OR subject:voucher OR subject:confirmation OR subject:reservation OR subject:booking)';
    
    console.log('🔍 Requête Gmail optimisée:', query);

    // Rechercher les messages avec une limite raisonnable
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100, // Augmenter pour capturer plus d'emails
      orderBy: 'internalDate' // Trier par date pour traiter les plus récents en premier
    });

    const messages = response.data.messages || [];
    console.log(`📧 ${messages.length} emails trouvés dans Gmail avec la requête optimisée`);

    // Si pas assez d'emails avec les filtres, essayer une recherche plus large
    if (messages.length < 10) {
      console.log('🔍 Recherche plus large car peu d\'emails trouvés...');
      const responseLarge = await gmail.users.messages.list({
        userId: 'me',
        q: dateDebut ? `after:${dateDebut.toISOString().split('T')[0]}` : '',
        maxResults: 50,
        orderBy: 'internalDate'
      });
      
      const messagesLarge = responseLarge.data.messages || [];
      console.log(`📧 ${messagesLarge.length} emails trouvés avec recherche large`);
      
      // Combiner les résultats en évitant les doublons
      const allMessageIds = new Set();
      messages.forEach(msg => allMessageIds.add(msg.id));
      messagesLarge.forEach(msg => allMessageIds.add(msg.id));
      
      const allMessages = Array.from(allMessageIds).map(id => ({ id }));
      console.log(`📧 Total unique: ${allMessages.length} emails à traiter`);
      
      return await processMessages(gmail, allMessages, dateDebut);
    }

    return await processMessages(gmail, messages, dateDebut);

  } catch (error) {
    console.error('Erreur lors de la récupération des emails Gmail:', error);
    throw error;
  }
};

// Fonction séparée pour traiter les messages
const processMessages = async (gmail, messages, dateDebut) => {
  const billets = [];
  const seenMessages = new Set();
  let dernierEmailDate = null;

  // Traiter chaque message
  for (const message of messages) {
    if (seenMessages.has(message.id)) continue;
    seenMessages.add(message.id);

    try {
      // Récupérer les détails du message
      const messageDetails = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });

      const headers = messageDetails.data.payload?.headers || [];
      let dateEmail = null;
      let subject = '';

      // Extraire la date et le sujet
      for (const header of headers) {
        if (header.name.toLowerCase() === 'date') {
          try {
            dateEmail = new Date(header.value);
            // Toujours garder trace de la date du dernier email traité, même s'il n'y a pas de billet
            if (!dernierEmailDate || dateEmail > dernierEmailDate) {
              dernierEmailDate = dateEmail;
            }
          } catch (error) {
            console.error(`Erreur parsing date: ${header.value}`, error);
          }
        }
        if (header.name.toLowerCase() === 'subject') {
          subject = header.value || '';
        }
      }

      // Si pas de sujet dans les headers, essayer de l'extraire du snippet
      if (!subject && messageDetails.data.snippet) {
        subject = messageDetails.data.snippet.substring(0, 100);
      }

      console.log(`📧 Traitement email: "${subject}" (${dateEmail ? dateEmail.toISOString() : 'date inconnue'})`);

      // Vérifier si c'est un email pertinent (billet, voucher, etc.)
      const motsCles = ['billet', 'ticket', 'voucher', 'confirmation', 'reservation', 'booking', 'air', 'vol', 'flight', 'airline', 'compagnie'];
      const estPertinent = motsCles.some(mot => 
        subject.toLowerCase().includes(mot) || 
        (messageDetails.data.snippet && messageDetails.data.snippet.toLowerCase().includes(mot))
      );

      // Traiter les pièces jointes même si le sujet n'est pas pertinent
      // car un email avec "Fwd:" peut contenir un PDF de billet
      console.log(`📧 Traitement des pièces jointes (sujet: "${subject}")`);

      // Traiter les pièces jointes
      const attachments = messageDetails.data.payload?.parts || [];
      let billetTrouveDansAttachments = false;
      
      for (const attachment of attachments) {
        if (attachment.filename && attachment.filename.toLowerCase().endsWith('.pdf')) {
          try {
            // Télécharger le PDF
            const attachmentData = await gmail.users.messages.attachments.get({
              userId: 'me',
              messageId: message.id,
              id: attachment.body.attachmentId
            });

            const pdfBuffer = Buffer.from(attachmentData.data.data, 'base64');
            
            // Créer le dossier de l'agence s'il n'existe pas
            // Note: On utilise un nom d'agence temporaire car on n'a pas accès à l'agence ici
            // Le vrai nom sera récupéré dans le contrôleur
            const agenceFolder = 'agences/default';
            const billetsFolder = path.join(__dirname, '../uploads', agenceFolder, 'billets');
            
            // Créer les dossiers s'ils n'existent pas
            if (!fs.existsSync(billetsFolder)) {
              fs.mkdirSync(billetsFolder, { recursive: true });
            }
            
            // Sauvegarder le PDF avec un nom unique
            const timestamp = Date.now();
            const safeFileName = attachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${timestamp}_${safeFileName}`;
            const filePath = path.join(billetsFolder, fileName);
            
            fs.writeFileSync(filePath, pdfBuffer);
            
            // Stocker le chemin relatif pour la base de données
            const relativePath = path.join(agenceFolder, 'billets', fileName).replace(/\\/g, '/');

            // Extraire le texte du PDF
            const text = await extractTextFromPDF(pdfBuffer);
            console.log(`Texte extrait du PDF ${attachment.filename} :`, text.substring(0, 200) + '...');

            // Vérifier si le contenu contient des mots-clés de billet
            const motsClesBillet = ['billet', 'ticket', 'vol', 'flight', 'passenger', 'passager', 'booking', 'reservation', 'pnr', 'booking ref', 'ticket number', 'passenger', 'passager', 'vol', 'flight', 'airline', 'compagnie', 'departure', 'départ', 'arrival', 'arrivée'];
            const contientBillet = motsClesBillet.some(mot => 
              text.toLowerCase().includes(mot) || 
              attachment.filename.toLowerCase().includes(mot)
            );

            if (contientBillet) {
              console.log(`✅ Billet trouvé dans le PDF: ${attachment.filename}`);
              console.log('Email/document pertinent détecté (billet/voucher/visa/etc.) :', subject);

              billets.push({
                source: 'gmail',
                text: text,
                attachments: [attachment.filename],
                filePath: relativePath, // Utiliser le chemin relatif
                emailId: message.id,
                dateEmail: dateEmail,
                subject: subject
              });
              
              billetTrouveDansAttachments = true;
            }
          } catch (error) {
            console.error(`Erreur lors du traitement de la pièce jointe ${attachment.filename}:`, error);
          }
        }
      }

      // Si pas de PDF, vérifier le texte du message
      if (attachments.length === 0 && messageDetails.data.payload?.body?.data) {
        const text = Buffer.from(messageDetails.data.payload.body.data, 'base64').toString();
        
        const motsClesBillet = ['billet', 'ticket', 'vol', 'flight', 'passenger', 'passager', 'booking', 'reservation', 'pnr', 'booking ref', 'ticket number', 'passenger', 'passager', 'vol', 'flight', 'airline', 'compagnie', 'departure', 'départ', 'arrival', 'arrivée'];
        const contientBillet = motsClesBillet.some(mot => 
          text.toLowerCase().includes(mot) || 
          subject.toLowerCase().includes(mot)
        );

        if (contientBillet) {
          console.log('✅ Billet trouvé dans le texte de l\'email:', subject);
          
          billets.push({
            source: 'gmail',
            text: text,
            attachments: [],
            filePath: null,
            emailId: message.id,
            dateEmail: dateEmail,
            subject: subject
          });
        }
      }

      // Si aucun billet trouvé dans les pièces jointes et que le sujet n'est pas pertinent
      if (!billetTrouveDansAttachments && !estPertinent && (subject && subject.trim() !== '')) {
        console.log(`📧 Email ignoré (non pertinent): "${subject}"`);
      }

    } catch (error) {
      console.error(`Erreur lors du traitement du message ${message.id}:`, error);
    }
  }

  console.log(`📧 Billets pertinents trouvés dans Gmail: ${billets.length}`);
  console.log(`📅 Dernier email traité: ${dernierEmailDate ? dernierEmailDate.toISOString() : 'aucun'}`);

  // Retourner les billets ET la date du dernier email traité
  return {
    billets: billets,
    dernierEmailDate: dernierEmailDate,
    totalEmailsTraites: messages.length
  };
};

module.exports = {
  sendEmail,
  sendFactureEmail,
  fetchBilletsFromGmail
};
