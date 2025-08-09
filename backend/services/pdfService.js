const { chromium } = require('playwright');
const path = require('path');
const Agence = require('../models/agenceModel');

class PDFService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch();
    }
    return this.browser;
  }

  async generateFacturePDF(facture, client, agence) {
    try {
      console.log('🚀 Début génération PDF facture:', facture.numero);
      console.log('📋 Agence:', agence?.nom, 'Logo URL:', agence?.logoUrl);

      // Fonctions de formatage
      const formatMontant = (montant) => {
        return (montant || 0).toLocaleString('fr-FR') + ' DA';
      };

      const formatStatut = (statut) => {
        switch (statut) {
          case 'payee': return 'Payée';
          case 'en_retard': return 'En retard';
          case 'envoyee': return 'Envoyée';
          case 'partiellement_payee': return 'Partiellement payée';
          case 'annulee': return 'Annulée';
          case 'brouillon': return 'Brouillon';
          default: return statut.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      };

      const formatModePaiement = (mode) => {
        switch (mode) {
          case 'especes': return 'Espèces';
          case 'virement': return 'Virement';
          case 'cheque': return 'Chèque';
          case 'carte': return 'Carte bancaire';
          default: return mode ? mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Non défini';
        }
      };

      // Construction de l'URL du logo
      const baseUrl = process.env.BASE_URL || 'http://localhost:8001';
      const logoUrl = agence?.logoUrl
        ? (agence.logoUrl.startsWith('http') ? agence.logoUrl : `${baseUrl}${agence.logoUrl}`)
        : '';
      const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height:60px;max-width:200px;object-fit:contain;" />` : '';

      const dateEmission = new Date(facture.dateEmission).toLocaleDateString('fr-FR');
      const dateEcheance = facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString('fr-FR') : 'Non définie';
      
      const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Facture ${facture.numero}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
            }
            
            .company-info {
              flex: 1;
            }
            
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            
            .company-details {
              font-size: 11px;
              color: #666;
              line-height: 1.3;
            }
            
            .company-admin {
              font-size: 10px;
              color: #888;
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px solid #eee;
            }
            
            .invoice-info {
              text-align: right;
              flex: 1;
            }
            
            .invoice-title {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            
            .invoice-number {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .invoice-dates {
              font-size: 11px;
              color: #666;
            }
            
            .client-section {
              margin-bottom: 30px;
            }
            
            .section-title {
              font-size: 14px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            
            .client-info {
              display: flex;
              gap: 40px;
            }
            
            .client-details, .invoice-details {
              flex: 1;
            }
            
            .client-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .client-address {
              font-size: 11px;
              color: #666;
              line-height: 1.3;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            
            .items-table th {
              background-color: #f3f4f6;
              padding: 10px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #d1d5db;
            }
            
            .items-table td {
              padding: 10px;
              border: 1px solid #d1d5db;
            }
            
            .text-right {
              text-align: right;
            }
            
            .text-center {
              text-align: center;
            }
            
            .totals-section {
              margin-left: auto;
              width: 300px;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .total-row.final {
              font-weight: bold;
              font-size: 16px;
              border-bottom: 2px solid #2563eb;
              margin-top: 10px;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 10px;
              color: #666;
              text-align: center;
            }
            
            .payment-info {
              margin-top: 20px;
              padding: 15px;
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 5px;
            }
            
            .payment-title {
              font-weight: bold;
              margin-bottom: 10px;
              color: #2563eb;
            }
            
            .bank-info {
              margin-top: 20px;
              padding: 15px;
              background-color: #f0f9ff;
              border: 1px solid #0ea5e9;
              border-radius: 5px;
            }
            
            .bank-title {
              font-weight: bold;
              margin-bottom: 10px;
              color: #0ea5e9;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <div class="logo">${logoHtml}</div>
              <div class="company-name">${agence?.nom || 'Nom de l\'agence'}</div>
              <div class="company-details">
                ${agence?.adresse || 'Adresse de l\'agence'}<br>
                ${agence?.telephone || 'Téléphone'}<br>
                ${agence?.email || 'Email'}<br>
                ${agence?.siteWeb ? `${agence.siteWeb}<br>` : ''}
              </div>
              <div class="company-admin">
                ${agence?.numeroRC ? `RC N°: ${agence.numeroRC}<br>` : ''}
                ${agence?.numeroNIF ? `NIF: ${agence.numeroNIF}<br>` : ''}
                ${agence?.numeroNIS ? `NIS: ${agence.numeroNIS}<br>` : ''}
                ${agence?.numeroTVA ? `N° TVA: ${agence.numeroTVA}<br>` : ''}
                ${agence?.articleImposition ? `Art. Imposition: ${agence.articleImposition}<br>` : ''}
                ${agence?.siret ? `SIRET: ${agence.siret}<br>` : ''}
              </div>
            </div>
            <div class="invoice-info">
              <div class="invoice-title">FACTURE</div>
              <div class="invoice-number">N° ${facture.numero}</div>
              <div class="invoice-dates">
                Date d'émission: ${dateEmission}<br>
                Date d'échéance: ${dateEcheance}
              </div>
            </div>
          </div>

          <div class="client-section">
            <div class="section-title">INFORMATIONS CLIENT</div>
            <div class="client-info">
              <div class="client-details">
                <div class="client-name">${client.entreprise || `${client.prenom} ${client.nom}`}</div>
                <div class="client-address">
                  ${client.adresse || ''}<br>
                  ${client.codePostal || ''} ${client.ville || ''}<br>
                  ${client.telephone || ''}<br>
                  ${client.email || ''}
                </div>
              </div>
              <div class="invoice-details">
                <div class="section-title">DÉTAILS FACTURE</div>
                <div>Statut: <strong>${formatStatut(facture.statut)}</strong></div>
                <div>Mode de paiement: ${formatModePaiement(facture.modePaiement)}</div>
                ${facture.montantPaye ? `<div>Montant payé: ${formatMontant(facture.montantPaye)}</div>` : ''}
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-center">Quantité</th>
                <th class="text-right">Prix unitaire HT</th>
                <th class="text-right">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${(facture.lignes || []).map(ligne => `
                <tr>
                  <td>${ligne.description || 'Produit/Service'}</td>
                  <td class="text-center">${ligne.quantite || 1}</td>
                  <td class="text-right">${formatMontant(ligne.prixUnitaire)}</td>
                  <td class="text-right">${formatMontant(ligne.totalHT)}</td>
                </tr>
              `).join('') || `
                <tr>
                  <td>Service</td>
                  <td class="text-center">1</td>
                  <td class="text-right">${formatMontant(facture.montantHT)}</td>
                  <td class="text-right">${formatMontant(facture.montantHT)}</td>
                </tr>
              `}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="total-row">
              <span>Total HT:</span>
              <span>${formatMontant(facture.montantHT)}</span>
            </div>
            <div class="total-row">
              <span>TVA (${facture.tauxTVA || 20}%):</span>
              <span>${formatMontant(facture.montantTVA)}</span>
            </div>
            <div class="total-row final">
              <span>Total TTC:</span>
              <span>${formatMontant(facture.montantTTC)}</span>
            </div>
          </div>

          ${agence?.banque || agence?.rib ? `
            <div class="bank-info">
              <div class="bank-title">INFORMATIONS BANCAIRES</div>
              ${agence?.banque ? `<div><strong>Banque:</strong> ${agence.banque}</div>` : ''}
              ${agence?.rib ? `<div><strong>RIB:</strong> ${agence.rib}</div>` : ''}
              ${agence?.swift ? `<div><strong>SWIFT:</strong> ${agence.swift}</div>` : ''}
              ${agence?.ibanRIB ? `<div><strong>IBAN:</strong> ${agence.ibanRIB}</div>` : ''}
            </div>
          ` : ''}

          ${facture.notes ? `
            <div class="payment-info">
              <div class="payment-title">Notes:</div>
              <div>${facture.notes}</div>
            </div>
          ` : ''}

          <div class="footer">
            <p>Merci pour votre confiance</p>
            <p>${agence?.nom || 'SamTech'} - ${agence?.adresse || ''}</p>
          </div>
        </body>
        </html>
      `;

      const browser = await this.initBrowser();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Configuration du PDF
      const pdfOptions = {
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true,
        displayHeaderFooter: false
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      await page.close();

      console.log('📄 PDF généré (Playwright), taille buffer:', pdfBuffer.length, 'bytes');
      return pdfBuffer;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw error;
    }
  }

  generateFactureHTML(facture, client, agence) {
    const dateEmission = new Date(facture.dateEmission).toLocaleDateString('fr-FR');
    const dateEcheance = facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString('fr-FR') : 'Non définie';
    
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Facture ${facture.numero}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          
          .company-info {
            flex: 1;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          
          .company-details {
            font-size: 11px;
            color: #666;
          }
          
          .invoice-info {
            text-align: right;
            flex: 1;
          }
          
          .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          
          .invoice-number {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .invoice-dates {
            font-size: 11px;
            color: #666;
          }
          
          .client-section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          
          .client-info {
            display: flex;
            gap: 40px;
          }
          
          .client-details, .invoice-details {
            flex: 1;
          }
          
          .client-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .client-address {
            font-size: 11px;
            color: #666;
            line-height: 1.3;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .items-table th {
            background-color: #f3f4f6;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #d1d5db;
          }
          
          .items-table td {
            padding: 10px;
            border: 1px solid #d1d5db;
          }
          
          .text-right {
            text-align: right;
          }
          
          .text-center {
            text-align: center;
          }
          
          .totals-section {
            margin-left: auto;
            width: 300px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .total-row.final {
            font-weight: bold;
            font-size: 16px;
            border-bottom: 2px solid #2563eb;
            margin-top: 10px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #666;
            text-align: center;
          }
          
          .payment-info {
            margin-top: 20px;
            padding: 15px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 5px;
          }
          
          .payment-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <div class="company-name">${agence?.nom || 'SamTech'}</div>
            <div class="company-details">
              ${agence?.adresse || 'Adresse de l\'agence'}<br>
              ${agence?.telephone || 'Téléphone'}<br>
              ${agence?.email || 'Email'}
            </div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">FACTURE</div>
            <div class="invoice-number">N° ${facture.numero}</div>
            <div class="invoice-dates">
              Date d'émission: ${dateEmission}<br>
              Date d'échéance: ${dateEcheance}
            </div>
          </div>
        </div>

        <div class="client-section">
          <div class="section-title">INFORMATIONS CLIENT</div>
          <div class="client-info">
            <div class="client-details">
              <div class="client-name">${client.entreprise || `${client.prenom} ${client.nom}`}</div>
              <div class="client-address">
                ${client.adresse || ''}<br>
                ${client.codePostal || ''} ${client.ville || ''}<br>
                ${client.telephone || ''}<br>
                ${client.email || ''}
              </div>
            </div>
            <div class="invoice-details">
              <div class="section-title">DÉTAILS FACTURE</div>
              <div>Statut: <strong>${formatStatut(facture.statut)}</strong></div>
              <div>Mode de paiement: ${formatModePaiement(facture.modePaiement)}</div>
              ${facture.montantPaye ? `<div>Montant payé: ${formatMontant(facture.montantPaye)}</div>` : ''}
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-center">Quantité</th>
              <th class="text-right">Prix unitaire HT</th>
              <th class="text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${facture.lignes?.map(ligne => `
              <tr>
                <td>${ligne.description || 'Produit/Service'}</td>
                <td class="text-center">${ligne.quantite || 1}</td>
                <td class="text-right">${formatMontant(ligne.prixUnitaire)}</td>
                <td class="text-right">${formatMontant(ligne.totalHT)}</td>
              </tr>
            `).join('') || `
              <tr>
                <td>Service</td>
                <td class="text-center">1</td>
                <td class="text-right">${formatMontant(facture.montantHT)}</td>
                <td class="text-right">${formatMontant(facture.montantHT)}</td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="total-row">
            <span>Total HT:</span>
            <span>${formatMontant(facture.montantHT)}</span>
          </div>
          <div class="total-row">
            <span>TVA (${facture.tauxTVA || 20}%):</span>
            <span>${formatMontant(facture.montantTVA)}</span>
          </div>
          <div class="total-row final">
            <span>Total TTC:</span>
            <span>${formatMontant(facture.montantTTC)}</span>
          </div>
        </div>

        ${facture.notes ? `
          <div class="payment-info">
            <div class="payment-title">Notes:</div>
            <div>${facture.notes}</div>
          </div>
        ` : ''}

        <div class="footer">
          <p>Merci pour votre confiance</p>
          <p>${agence?.nom || 'SamTech'} - Tous droits réservés</p>
        </div>
      </body>
      </html>
    `;
  }

  // Fonction pour formater les détails de prestation
  formatPrestationDetails(prestation) {
    if (!prestation || !prestation.type) return '';
    
    switch (prestation.type) {
      case 'billet':
        let details = `PAX: ${prestation.pax || 'N/A'}`;
        if (prestation.numeroBillet) details += `<br>N° Billet: ${prestation.numeroBillet}`;
        if (prestation.dateDepart) details += `<br>Départ: ${new Date(prestation.dateDepart).toLocaleDateString('fr-FR')}`;
        if (prestation.dateRetour) details += `<br>Retour: ${new Date(prestation.dateRetour).toLocaleDateString('fr-FR')}`;
        if (prestation.villeDepart && prestation.villeArrivee) details += `<br>Itinéraire: ${prestation.villeDepart} → ${prestation.villeArrivee}`;
        if (prestation.compagnie) details += `<br>Compagnie: ${prestation.compagnie}`;
        return details;
        
      case 'hotel':
        let hotelDetails = `Client: ${prestation.nomClient || 'N/A'}`;
        if (prestation.nomHotel) hotelDetails += `<br>Hôtel: ${prestation.nomHotel}`;
        if (prestation.ville) hotelDetails += `<br>Ville: ${prestation.ville}`;
        if (prestation.dateEntree) hotelDetails += `<br>Entrée: ${new Date(prestation.dateEntree).toLocaleDateString('fr-FR')}`;
        if (prestation.dateSortie) hotelDetails += `<br>Sortie: ${new Date(prestation.dateSortie).toLocaleDateString('fr-FR')}`;
        if (prestation.numeroVoucher) hotelDetails += `<br>Voucher: ${prestation.numeroVoucher}`;
        return hotelDetails;
        
      case 'visa':
        let visaDetails = `Client: ${prestation.nomClient || 'N/A'}`;
        if (prestation.typeVisa) visaDetails += `<br>Type: ${prestation.typeVisa}`;
        if (prestation.paysVise) visaDetails += `<br>Destination: ${prestation.paysVise}`;
        if (prestation.dateDepot) visaDetails += `<br>Dépôt: ${new Date(prestation.dateDepot).toLocaleDateString('fr-FR')}`;
        return visaDetails;
        
      case 'assurance':
        let assuranceDetails = `Assuré: ${prestation.nomAssure || 'N/A'}`;
        if (prestation.typeAssurance) assuranceDetails += `<br>Type: ${prestation.typeAssurance}`;
        if (prestation.dateDebut) assuranceDetails += `<br>Début: ${new Date(prestation.dateDebut).toLocaleDateString('fr-FR')}`;
        if (prestation.dateFin) assuranceDetails += `<br>Fin: ${new Date(prestation.dateFin).toLocaleDateString('fr-FR')}`;
        if (prestation.numeroPolice) assuranceDetails += `<br>Police: ${prestation.numeroPolice}`;
        return assuranceDetails;
        
      case 'autre':
        let autreDetails = '';
        if (prestation.designationLibre) autreDetails += `Prestation: ${prestation.designationLibre}`;
        if (prestation.ville) autreDetails += `<br>Lieu: ${prestation.ville}`;
        if (prestation.dateDebut) autreDetails += `<br>Début: ${new Date(prestation.dateDebut).toLocaleDateString('fr-FR')}`;
        if (prestation.dateFin) autreDetails += `<br>Fin: ${new Date(prestation.dateFin).toLocaleDateString('fr-FR')}`;
        if (prestation.duree) autreDetails += `<br>Durée: ${prestation.duree}`;
        return autreDetails;
        
      default:
        return '';
    }
  }

  async generatePreFacturePDF(preFacture, client, agenceId) {
    try {
      if (!this.browser) {
        await this.initBrowser();
      }
      
      const Agence = require('../models/agenceModel');
      const agence = await Agence.findById(agenceId).lean();
      console.log('🚀 Début génération PDF devis:', preFacture.numero);
      console.log('📋 Agence:', agence.nom, 'Logo URL:', agence.logoUrl);

      const logoUrl = agence.logoUrl || null;
      const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height:60px;max-width:200px;object-fit:contain;" />` : '';

      // Vrai HTML de devis
      const dateCreation = new Date(preFacture.dateCreation).toLocaleDateString('fr-FR');
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Devis ${preFacture.numero || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
            .company-info { flex: 1; }
            .company-info h1 { margin: 0; color: #2563eb; font-size: 24px; }
            .company-info p { margin: 2px 0; font-size: 14px; }
            .logo { flex: 0 0 auto; text-align: right; }
            .invoice-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .invoice-details h2 { margin: 0 0 15px 0; color: #1e40af; font-size: 20px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .detail-group h3 { margin: 0 0 10px 0; font-size: 16px; color: #374151; }
            .detail-group p { margin: 2px 0; font-size: 14px; }
            .articles-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            .articles-table th, .articles-table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
            .articles-table th { background-color: #f3f4f6; font-weight: 600; }
            .articles-table .designation { width: 40%; }
            .articles-table .prestation-details { width: 25%; font-size: 12px; color: #6b7280; }
            .articles-table .quantity { width: 10%; text-align: center; }
            .articles-table .price { width: 15%; text-align: right; }
            .articles-table .amount { width: 15%; text-align: right; }
            .totals { margin-top: 30px; text-align: right; }
            .totals table { margin-left: auto; border-collapse: collapse; }
            .totals td { padding: 8px 15px; border: none; }
            .totals .total-row { border-top: 1px solid #d1d5db; font-weight: bold; }
            .totals .final { background-color: #1e40af; color: white; font-size: 18px; }
            .notes { margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
            .notes h3 { margin: 0 0 10px 0; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
            .prestation-icon { display: inline-block; margin-right: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${agence.nom || 'SamTech'}</h1>
              <p>${agence.adresse || ''}</p>
              <p>Tél: ${agence.telephone || ''} | Email: ${agence.email || ''}</p>
            </div>
            <div class="logo">
              ${logoHtml}
            </div>
          </div>

          <div class="invoice-details">
            <h2>DEVIS N° ${preFacture.numero || ''}</h2>
            <div class="details-grid">
              <div class="detail-group">
                <h3>Client</h3>
                <p><strong>${client.entreprise || `${client.prenom} ${client.nom}`}</strong></p>
                <p>${client.email || ''}</p>
                <p>${client.telephone || ''}</p>
                <p>${client.adresse || ''}</p>
              </div>
              <div class="detail-group">
                <h3>Informations</h3>
                <p><strong>Date:</strong> ${dateCreation}</p>
                <p><strong>Statut:</strong> ${preFacture.statut || 'Brouillon'}</p>
              </div>
            </div>
          </div>

          <table class="articles-table">
            <thead>
              <tr>
                <th class="designation">Désignation</th>
                <th class="prestation-details">Détails prestation</th>
                <th class="quantity">Qté</th>
                <th class="price">Prix unitaire</th>
                <th class="amount">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${(preFacture.articles || []).map(a => `
                <tr>
                  <td class="designation">
                    ${a.prestation && a.prestation.type ? `<span class="prestation-icon">${this.getPrestationIcon(a.prestation.type)}</span>` : ''}
                    ${a.designation}
                  </td>
                  <td class="prestation-details">
                    ${a.prestation ? this.formatPrestationDetails(a.prestation) : ''}
                  </td>
                  <td class="quantity">${a.quantite}</td>
                  <td class="price">${(a.prixUnitaire || 0).toFixed(2)} DA</td>
                  <td class="amount">${(a.montant || 0).toFixed(2)} DA</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr><td>Sous-total HT:</td><td>${preFacture.montantHT?.toFixed(2) || '0.00'} DA</td></tr>
              ${preFacture.tva > 0 ? `<tr><td>TVA (${preFacture.tva}%):</td><td>${((preFacture.montantTTC - preFacture.montantHT) || 0).toFixed(2)} DA</td></tr>` : ''}
              <tr class="total-row final"><td>Total TTC:</td><td>${preFacture.montantTTC?.toFixed(2) || '0.00'} DA</td></tr>
            </table>
          </div>

          ${preFacture.notes ? `
            <div class="notes">
              <h3>Notes</h3>
              <p>${preFacture.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Ce devis est valable 30 jours à compter de la date d'émission.</p>
          </div>
        </body>
        </html>
      `;

      const page = await this.browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
      });
      await page.close();

      return pdf;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF de devis:', error);
      throw error;
    }
  }

  getPrestationIcon(type) {
    const icons = {
      'billet': '✈️',
      'hotel': '🏨', 
      'visa': '📋',
      'assurance': '🛡️',
      'autre': '📦'
    };
    return icons[type] || '📄';
  }

  generatePreFactureHTML(preFacture, client, agence) {
    const dateCreation = new Date(preFacture.dateCreation).toLocaleDateString('fr-FR');
    // DEBUG: log la valeur reçue de la BDD
    console.log('DEBUG agence.logoUrl reçu dans PDFService:', agence.logoUrl);
    const baseUrl = process.env.BASE_URL || 'http://localhost:8001';
    const logoUrl = agence.logoUrl
      ? (agence.logoUrl.startsWith('http') ? agence.logoUrl : `${baseUrl}${agence.logoUrl}`)
      : '';
    // DEBUG: log la valeur finale utilisée
    console.log('DEBUG logoUrl final utilisé dans PDFService:', logoUrl);
    const logoHtml = '';
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Devis ${preFacture.numero || ''}</title>
        <style>
          body { font-family: 'Arial', sans-serif; font-size: 12px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { flex: 0 0 auto; }
          .company-info { flex: 1; margin-left: 20px; }
          .company-name { font-size: 22px; font-weight: bold; color: #2563eb; margin-bottom: 6px; }
          .company-details { font-size: 11px; color: #666; }
          .devis-title { font-size: 26px; font-weight: bold; color: #2563eb; margin-bottom: 10px; text-align: right; }
          .client-section { margin-bottom: 30px; }
          .section-title { font-size: 14px; font-weight: bold; color: #2563eb; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .client-info { font-size: 12px; color: #333; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th { background-color: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; border: 1px solid #d1d5db; }
          .items-table td { padding: 10px; border: 1px solid #d1d5db; }
          .text-right { text-align: right; }
          .totals-section { margin-left: auto; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb; }
          .total-row.final { font-weight: bold; font-size: 16px; border-bottom: 2px solid #2563eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${logoHtml}</div>
          <div class="company-info">
            <div class="company-name">${agence.nom || ''}</div>
            <div class="company-details">
              ${agence.adresse || ''}<br/>
              ${agence.email || ''} | ${agence.telephone || ''}<br/>
              ${agence.siteWeb || ''}
            </div>
          </div>
          <div class="devis-title">DEVIS</div>
        </div>
        <div class="client-section">
          <div class="section-title">Client</div>
          <div class="client-info">
            <b>${client.entreprise || client.nom || ''}</b><br/>
            ${client.adresse || ''}<br/>
            ${client.email || ''} | ${client.telephone || ''}
          </div>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${(preFacture.articles || []).map(a => `
              <tr>
                <td>${a.designation}</td>
                <td class="text-right">${a.quantite}</td>
                <td class="text-right">${a.prixUnitaire.toFixed(2)} DA</td>
                <td class="text-right">${a.montant.toFixed(2)} DA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals-section">
          <div class="total-row"><span>Sous-total</span><span>${preFacture.montantHT.toFixed(2)} DA</span></div>
          <div class="total-row"><span>TVA</span><span>0.00 DA</span></div>
          <div class="total-row final"><span>Total TTC</span><span>${preFacture.montantTTC.toFixed(2)} DA</span></div>
        </div>
        <div style="margin-top:40px;font-size:11px;color:#888;">Date de création : ${dateCreation}</div>
      </body>
      </html>
    `;
  }

  async generateManifestPDF(manifest, agence) {
    try {
      console.log('🚀 Début génération PDF manifest:', manifest.numeroManifest);
      
      // Construction de l'URL du logo
      const baseUrl = process.env.BASE_URL || 'http://localhost:8001';
      const logoUrl = agence?.logoUrl
        ? (agence.logoUrl.startsWith('http') ? agence.logoUrl : `${baseUrl}${agence.logoUrl}`)
        : '';
      const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height:60px;max-width:200px;object-fit:contain;" />` : '';

      const dateDepart = new Date(manifest.dateDepart).toLocaleDateString('fr-FR');
      const dateRetour = manifest.dateRetour ? new Date(manifest.dateRetour).toLocaleDateString('fr-FR') : 'Non définie';
      
      const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>Manifest ${manifest.numeroManifest}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .manifest-title { font-size: 28px; font-weight: bold; color: #2563eb; text-align: right; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-item { margin-bottom: 8px; }
            .info-label { font-weight: bold; color: #666; }
            .compagnie-logo { height: 24px; vertical-align: middle; margin-right: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">${logoHtml}</div>
              <div class="company-name">${agence?.nom || 'Nom de l\'agence'}</div>
              <div style="font-size: 11px; color: #666;">
                ${agence?.adresse || 'Adresse'}<br>
                ${agence?.telephone || 'Téléphone'}<br>
                ${agence?.email || 'Email'}
              </div>
            </div>
            <div>
              <div class="manifest-title">MANIFEST</div>
              <div style="text-align: right; font-size: 16px; font-weight: bold;">
                N° ${manifest.numeroManifest || 'Non défini'}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">INFORMATIONS GÉNÉRALES</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Compagnie:</div>
                <div>
                  ${manifest.compagnieLogo ? `<img src='${manifest.compagnieLogo}' class='compagnie-logo' alt='Logo compagnie' />` : ''}
                  ${manifest.compagnieTransport}
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Type de transport:</div>
                <div>${manifest.typeTransport}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Destination:</div>
                <div>${manifest.destination}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date de départ:</div>
                <div>${dateDepart}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date de retour:</div>
                <div>${dateRetour}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Nombre de passagers:</div>
                <div>${manifest.nombrePassagers || 0}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Agent:</div>
                <div>${manifest.agent ? `${manifest.agent.prenom} ${manifest.agent.nom}` : 'Non défini'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">LISTE DES PASSAGERS</div>
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Date de naissance</th>
                  <th>N° Passeport</th>
                  <th>Téléphone</th>
                </tr>
              </thead>
              <tbody>
                ${(manifest.passagers || []).map((passager, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${passager.nom || ''}</td>
                    <td>${passager.prenom || ''}</td>
                    <td>${passager.dateNaissance ? new Date(passager.dateNaissance).toLocaleDateString('fr-FR') : ''}</td>
                    <td>${passager.numeroPasseport || ''}</td>
                    <td>${passager.telephone || ''}</td>
                  </tr>
                `).join('') || `
                  <tr>
                    <td colspan="6" style="text-align: center;">Aucun passager enregistré</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>

          ${manifest.observations ? `
            <div class="section">
              <div class="section-title">OBSERVATIONS</div>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px;">
                ${manifest.observations}
              </div>
            </div>
          ` : ''}

          <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666;">
            <p>Manifest généré le ${new Date().toLocaleDateString('fr-FR')}</p>
            <p>${agence?.nom || 'SamTech'}</p>
          </div>
        </body>
        </html>
      `;

      const browser = await this.initBrowser();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfOptions = {
        format: 'A4',
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        printBackground: true,
        displayHeaderFooter: false
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      await page.close();

      console.log('📄 PDF manifest généré, taille buffer:', pdfBuffer.length, 'bytes');
      return pdfBuffer;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF manifest:', error);
      throw error;
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Nouvelle méthode pour générer le PDF des factures fournisseurs
  async generateFactureFournisseurPDF(facture, agence) {
    try {
      console.log('🚀 Début génération PDF facture fournisseur:', facture.numero);
      console.log('📋 Agence:', agence?.nom, 'Logo URL:', agence?.logoUrl);

      // Fonctions de formatage
      const formatMontant = (montant) => {
        return (montant || 0).toLocaleString('fr-FR') + ' DA';
      };

      const formatStatut = (statut) => {
        switch (statut) {
          case 'payee': return 'Payée';
          case 'recue': return 'Reçue';
          case 'en_retard': return 'En retard';
          case 'partiellement_payee': return 'Partiellement payée';
          case 'brouillon': return 'Brouillon';
          default: return statut.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      };

      // Construction de l'URL du logo
      const baseUrl = process.env.BASE_URL || 'http://localhost:8001';
      const logoUrl = agence?.logoUrl ? `${baseUrl}${agence.logoUrl}` : null;

      // Template HTML pour la facture fournisseur
      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture Fournisseur ${facture.numero}</title>
    <style>
        @page { margin: 20mm; size: A4; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.4; 
            color: #333; 
            font-size: 11px;
        }
        .container { max-width: 100%; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .logo-section { flex: 1; }
        .logo { max-height: 80px; max-width: 200px; }
        .company-info { flex: 1; text-align: right; }
        .company-name { font-size: 18px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
        .company-details { font-size: 10px; color: #666; line-height: 1.3; }
        .invoice-title { text-align: center; margin: 30px 0; }
        .invoice-title h1 { font-size: 24px; color: #2563eb; margin-bottom: 5px; }
        .invoice-number { font-size: 14px; color: #666; }
        .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .party { flex: 1; margin-right: 20px; }
        .party:last-child { margin-right: 0; }
        .party-title { font-weight: bold; font-size: 12px; color: #2563eb; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .party-info { background: #f8fafc; padding: 15px; border-radius: 5px; }
        .info-row { margin-bottom: 5px; }
        .label { font-weight: bold; color: #374151; }
        .details-section { margin-bottom: 30px; }
        .details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
        .detail-item { background: #f8fafc; padding: 10px; border-radius: 5px; text-align: center; }
        .detail-label { font-size: 10px; color: #6b7280; margin-bottom: 3px; }
        .detail-value { font-weight: bold; color: #1f2937; }
        .status-badge { 
            display: inline-block; 
            padding: 4px 8px; 
            border-radius: 12px; 
            font-size: 10px; 
            font-weight: bold; 
        }
        .status-payee { background: #dcfce7; color: #166534; }
        .status-recue { background: #dbeafe; color: #1d4ed8; }
        .status-en-retard { background: #fee2e2; color: #dc2626; }
        .status-partiellement-payee { background: #fef3c7; color: #d97706; }
        .status-brouillon { background: #f3f4f6; color: #374151; }
        .articles-section { margin-bottom: 30px; }
        .section-title { font-size: 14px; font-weight: bold; color: #2563eb; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .articles-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .articles-table th,
        .articles-table td { 
            border: 1px solid #e5e7eb; 
            padding: 8px; 
            text-align: left; 
            vertical-align: top;
        }
        .articles-table th { 
            background: #f8fafc; 
            font-weight: bold; 
            font-size: 10px; 
            color: #374151; 
        }
        .articles-table td { font-size: 10px; }
        .designation-cell { 
            max-width: 200px; 
            word-wrap: break-word; 
            white-space: pre-line; 
        }
        .amount-cell { text-align: right; font-weight: bold; }
        .totals-section { margin-top: 20px; }
        .totals-table { width: 100%; max-width: 300px; margin-left: auto; }
        .totals-table td { 
            padding: 8px; 
            border: none; 
            border-bottom: 1px solid #e5e7eb; 
        }
        .totals-table .total-label { font-weight: bold; text-align: right; }
        .totals-table .total-value { text-align: right; font-weight: bold; }
        .grand-total { 
            background: #2563eb; 
            color: white; 
            font-size: 12px; 
        }
        .notes-section { margin-top: 30px; background: #f8fafc; padding: 15px; border-radius: 5px; }
        .notes-title { font-weight: bold; margin-bottom: 10px; color: #374151; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" onerror="this.style.display='none'">` : ''}
            </div>
            <div class="company-info">
                <div class="company-name">${agence?.nom || 'Agence de Voyage'}</div>
                <div class="company-details">
                    ${agence?.adresse || ''}<br>
                    ${agence?.telephone || ''}<br>
                    ${agence?.email || ''}
                </div>
            </div>
        </div>

        <!-- Titre de la facture -->
        <div class="invoice-title">
            <h1>FACTURE FOURNISSEUR</h1>
            <div class="invoice-number">N° ${facture.numero}</div>
        </div>

        <!-- Informations des parties -->
        <div class="parties">
            <div class="party">
                <div class="party-title">NOTRE AGENCE</div>
                <div class="party-info">
                    <div class="info-row"><span class="label">Nom:</span> ${agence?.nom || 'Agence de Voyage'}</div>
                    <div class="info-row"><span class="label">Adresse:</span> ${agence?.adresse || 'N/A'}</div>
                    <div class="info-row"><span class="label">Téléphone:</span> ${agence?.telephone || 'N/A'}</div>
                    <div class="info-row"><span class="label">Email:</span> ${agence?.email || 'N/A'}</div>
                </div>
            </div>
            <div class="party">
                <div class="party-title">FOURNISSEUR</div>
                <div class="party-info">
                    <div class="info-row"><span class="label">Entreprise:</span> ${facture.fournisseurId?.entreprise || 'N/A'}</div>
                    <div class="info-row"><span class="label">Contact:</span> ${facture.fournisseurId?.nom || ''} ${facture.fournisseurId?.prenom || ''}</div>
                    <div class="info-row"><span class="label">Email:</span> ${facture.fournisseurId?.email || 'N/A'}</div>
                    <div class="info-row"><span class="label">Téléphone:</span> ${facture.fournisseurId?.telephone || 'N/A'}</div>
                </div>
            </div>
        </div>

        <!-- Détails de la facture -->
        <div class="details-section">
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Date d'émission</div>
                    <div class="detail-value">${new Date(facture.dateEmission).toLocaleDateString('fr-FR')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Date d'échéance</div>
                    <div class="detail-value">${new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Statut</div>
                    <div class="detail-value">
                        <span class="status-badge status-${facture.statut?.replace('_', '-')}">${formatStatut(facture.statut)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Articles/Prestations -->
        <div class="articles-section">
            <div class="section-title">DÉTAIL DES PRESTATIONS</div>
            <table class="articles-table">
                <thead>
                    <tr>
                        <th style="width: 50%;">Désignation</th>
                        <th style="width: 10%;">Qté</th>
                        <th style="width: 20%;">Prix unitaire</th>
                        <th style="width: 20%;">Montant</th>
                    </tr>
                </thead>
                <tbody>
                    ${(facture.articles || []).map(article => `
                        <tr>
                            <td class="designation-cell">${article.designation || 'Prestation'}</td>
                            <td style="text-align: center;">${article.quantite || 1}</td>
                            <td class="amount-cell">${formatMontant(article.prixUnitaire)}</td>
                            <td class="amount-cell">${formatMontant(article.montant)}</td>
                        </tr>
                    `).join('')}
                    ${facture.articles?.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #6b7280; padding: 20px;">Aucun article</td></tr>' : ''}
                </tbody>
            </table>

            <!-- Totaux -->
            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td class="total-label">Sous-total HT:</td>
                        <td class="total-value">${formatMontant(facture.montantHT)}</td>
                    </tr>
                    <tr>
                        <td class="total-label">TVA (${facture.tva || 0}%):</td>
                        <td class="total-value">${formatMontant(facture.montantTVA)}</td>
                    </tr>
                    <tr class="grand-total">
                        <td class="total-label">Total TTC:</td>
                        <td class="total-value">${formatMontant(facture.montantTTC)}</td>
                    </tr>
                    ${facture.montantPaye > 0 ? `
                    <tr>
                        <td class="total-label">Montant payé:</td>
                        <td class="total-value" style="color: #059669;">${formatMontant(facture.montantPaye)}</td>
                    </tr>
                    <tr>
                        <td class="total-label">Reste à payer:</td>
                        <td class="total-value" style="color: #dc2626;">${formatMontant(facture.montantTTC - (facture.montantPaye || 0))}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
        </div>

        <!-- Notes -->
        ${facture.notes ? `
        <div class="notes-section">
            <div class="notes-title">Notes:</div>
            <div>${facture.notes}</div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
            <p>Facture générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>Cette facture a été générée automatiquement par le système de gestion.</p>
        </div>
    </div>
</body>
</html>`;

      console.log('📄 Template HTML généré, lancement du navigateur...');

      // Générer le PDF avec Playwright
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle' });
      
      console.log('🎨 Contenu chargé, génération du PDF...');
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        preferCSSPageSize: true
      });

      await page.close();
      
      console.log('✅ PDF facture fournisseur généré avec succès');
      return pdfBuffer;

    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF facture fournisseur:', error);
      throw error;
    }
  }
}

module.exports = new PDFService(); 