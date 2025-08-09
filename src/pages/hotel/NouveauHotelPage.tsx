import React, { useState, useEffect } from 'react';
import { 
  Save, 
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  MapPin,
  Calendar,
  Users,
  CreditCard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { hotelAPI, clientsAPI } from '../../services/api';
import { Client } from '../../types';
import SmartImportComponent from '../../components/import/SmartImportComponent';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface HotelForm {
  clientId: string;
  nomHotel: string;
  ville: string;
  pays: string;
  adresseHotel: string;
  dateEntree: string;
  dateSortie: string;
  nombreNuits: number;
  nombreChambres: number;
  typeChambres: string;
  nombrePersonnes: number;
  pension: string;
  numeroVoucher: string;
  numeroReservation: string;
  numeroConfirmation: string;
  prixHT: number;
  prixTTC: number;
  taxes: number;
  prixParNuit: number;
  deviseOriginale: string;
  statut: string;
  dateEmission: string;
  agenceVoyage: string;
  notesSpeciales: string;
  politiqueAnnulation: string;
  servicesInclus: string[];
}

const NouveauHotelPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'manual' | 'pdf'>('manual');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  const [formData, setFormData] = useState<HotelForm>({
    clientId: '',
    nomHotel: '',
    ville: '',
    pays: '',
    adresseHotel: '',
    dateEntree: '',
    dateSortie: '',
    nombreNuits: 1,
    nombreChambres: 1,
    typeChambres: '',
    nombrePersonnes: 1,
    pension: '',
    numeroVoucher: '',
    numeroReservation: '',
    numeroConfirmation: '',
    prixHT: 0,
    prixTTC: 0,
    taxes: 0,
    prixParNuit: 0,
    deviseOriginale: 'DA',
    statut: 'reserve',
    dateEmission: new Date().toISOString().split('T')[0],
    agenceVoyage: '',
    notesSpeciales: '',
    politiqueAnnulation: '',
    servicesInclus: []
  });

  useEffect(() => {
    fetchClients();
  }, []);

  // Calcul automatique du nombre de nuits
  useEffect(() => {
    if (formData.dateEntree && formData.dateSortie) {
      const entree = new Date(formData.dateEntree);
      const sortie = new Date(formData.dateSortie);
      const diffTime = Math.abs(sortie.getTime() - entree.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData(prev => ({ ...prev, nombreNuits: diffDays }));
    }
  }, [formData.dateEntree, formData.dateSortie]);

  // Calcul automatique du prix par nuit
  useEffect(() => {
    if (formData.prixTTC > 0 && formData.nombreNuits > 0) {
      const prixParNuit = Math.round(formData.prixTTC / formData.nombreNuits);
      setFormData(prev => ({ ...prev, prixParNuit }));
    }
  }, [formData.prixTTC, formData.nombreNuits]);

  // Calcul automatique des taxes
  useEffect(() => {
    if (formData.prixHT > 0 && formData.prixTTC > 0) {
      const taxes = formData.prixTTC - formData.prixHT;
      setFormData(prev => ({ ...prev, taxes }));
    }
  }, [formData.prixHT, formData.prixTTC]);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      const clientsData = response.data?.data || response.data || [];
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setClientsLoading(false);
    }
  };

  const handleAnalysisComplete = (result: any) => {
    console.log('Résultat analyse IA hôtel:', result);
    
    if (result?.informations) {
      const info = result.informations;
      
      setFormData(prev => ({
        ...prev,
        nomHotel: info.nom_hotel || '',
        ville: info.ville || '',
        pays: info.pays || '',
        adresseHotel: info.adresse_hotel || '',
        dateEntree: info.date_entree || '',
        dateSortie: info.date_sortie || '',
        nombreNuits: info.nombre_nuits || 1,
        nombreChambres: info.nombre_chambres || 1,
        typeChambres: info.type_chambre || '',
        nombrePersonnes: info.nombre_personnes || 1,
        pension: info.pension || '',
        numeroVoucher: info.numero_voucher || '',
        numeroReservation: info.numero_reservation || '',
        numeroConfirmation: info.numero_confirmation || '',
        prixHT: Number(info.prix_ht) || 0,
        prixTTC: Number(info.prix_ttc) || 0,
        taxes: Number(info.taxes) || 0,
        prixParNuit: Number(info.prix_par_nuit) || 0,
        deviseOriginale: info.devise_originale || 'DA',
        statut: info.statut || 'reserve',
        dateEmission: info.date_emission || new Date().toISOString().split('T')[0],
        agenceVoyage: info.agence_voyage || '',
        notesSpeciales: info.notes_speciales || '',
        politiqueAnnulation: info.politique_annulation || '',
        servicesInclus: info.services_inclus || []
      }));

      // Recherche automatique du client par nom si fourni
      if (info.nom_client && clients.length > 0) {
        const clientTrouve = clients.find(client => 
          `${client.prenom} ${client.nom}`.toLowerCase().includes(info.nom_client.toLowerCase()) ||
          client.entreprise?.toLowerCase().includes(info.nom_client.toLowerCase())
        );
        if (clientTrouve) {
          setFormData(prev => ({ ...prev, clientId: clientTrouve._id || clientTrouve.id }));
        }
      }
    }
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      servicesInclus: [...prev.servicesInclus, '']
    }));
  };

  const updateService = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      servicesInclus: prev.servicesInclus.map((service, i) => 
        i === index ? value : service
      )
    }));
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      servicesInclus: prev.servicesInclus.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.nomHotel || !formData.ville || !formData.dateEntree || !formData.dateSortie) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      
      const hotelData = {
        clientId: formData.clientId || null,
        nomHotel: formData.nomHotel,
        ville: formData.ville,
        dateEntree: formData.dateEntree,
        dateSortie: formData.dateSortie,
        numeroVoucher: formData.numeroVoucher,
        prix: formData.prixTTC,
        statut: formData.statut,
        // Informations étendues
        pays: formData.pays,
        adresseHotel: formData.adresseHotel,
        nombreNuits: formData.nombreNuits,
        nombreChambres: formData.nombreChambres,
        typeChambres: formData.typeChambres,
        nombrePersonnes: formData.nombrePersonnes,
        pension: formData.pension,
        numeroReservation: formData.numeroReservation,
        numeroConfirmation: formData.numeroConfirmation,
        prixHT: formData.prixHT,
        taxes: formData.taxes,
        prixParNuit: formData.prixParNuit,
        deviseOriginale: formData.deviseOriginale,
        dateEmission: formData.dateEmission,
        agenceVoyage: formData.agenceVoyage,
        notesSpeciales: formData.notesSpeciales,
        politiqueAnnulation: formData.politiqueAnnulation,
        servicesInclus: formData.servicesInclus.filter(s => s.trim())
      };

      await hotelAPI.create(hotelData);
      alert('Réservation hôtel créée avec succès !');
      navigate('/hotel');
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de la réservation');
    } finally {
      setLoading(false);
    }
  };

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30">
        <div className="flex items-center">
          <Link to="/hotel" className="btn-secondary mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Nouvelle Réservation Hôtel</h1>
            <p className="text-gray-600">Créer une nouvelle réservation d'hôtel</p>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      <SmartImportComponent
        moduleType="hotel"
        onAnalysisComplete={handleAnalysisComplete}
        extractPdfText={hotelAPI.extractPdfText}
        analyzeText={hotelAPI.iaAnalyseHotel}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      >
        {/* Formulaire manuel */}
        <div className="space-y-6">
          {/* Client */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Client</h3>
            <div>
              <label className="block text-sm font-medium mb-1">
                Client
              </label>
              <select
                className="input w-full"
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client._id || client.id} value={client._id || client.id}>
                    {client.entreprise || `${client.prenom} ${client.nom}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Informations hôtel */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">
              <MapPin className="w-5 h-5 inline mr-2" />
              Informations hôtel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nom de l'hôtel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.nomHotel}
                  onChange={(e) => setFormData(prev => ({ ...prev, nomHotel: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.ville}
                  onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pays</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.pays}
                  onChange={(e) => setFormData(prev => ({ ...prev, pays: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Adresse complète</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.adresseHotel}
                  onChange={(e) => setFormData(prev => ({ ...prev, adresseHotel: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Dates et séjour */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">
              <Calendar className="w-5 h-5 inline mr-2" />
              Dates et séjour
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date d'entrée <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="input w-full"
                  value={formData.dateEntree}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateEntree: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date de sortie <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="input w-full"
                  value={formData.dateSortie}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateSortie: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de nuits</label>
                <input
                  type="number"
                  className="input w-full bg-gray-50"
                  value={formData.nombreNuits}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Détails réservation */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">
              <Users className="w-5 h-5 inline mr-2" />
              Détails réservation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de chambres</label>
                <input
                  type="number"
                  className="input w-full"
                  value={formData.nombreChambres}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombreChambres: Number(e.target.value) }))}
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type de chambre</label>
                <select
                  className="input w-full"
                  value={formData.typeChambres}
                  onChange={(e) => setFormData(prev => ({ ...prev, typeChambres: e.target.value }))}
                >
                  <option value="">Sélectionner</option>
                  <option value="Single">Chambre Single</option>
                  <option value="Double">Chambre Double</option>
                  <option value="Twin">Chambre Twin</option>
                  <option value="Triple">Chambre Triple</option>
                  <option value="Suite">Suite</option>
                  <option value="Familiale">Chambre Familiale</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de personnes</label>
                <input
                  type="number"
                  className="input w-full"
                  value={formData.nombrePersonnes}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombrePersonnes: Number(e.target.value) }))}
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type de pension</label>
                <select
                  className="input w-full"
                  value={formData.pension}
                  onChange={(e) => setFormData(prev => ({ ...prev, pension: e.target.value }))}
                >
                  <option value="">Sélectionner</option>
                  <option value="Sans pension">Sans pension</option>
                  <option value="Petit-déjeuner">Petit-déjeuner (BB)</option>
                  <option value="Demi-pension">Demi-pension (HB)</option>
                  <option value="Pension complète">Pension complète (FB)</option>
                  <option value="All Inclusive">All Inclusive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select
                  className="input w-full"
                  value={formData.statut}
                  onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                >
                  <option value="reserve">Réservé</option>
                  <option value="confirme">Confirmé</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Références */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Références</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Numéro voucher</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.numeroVoucher}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroVoucher: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Numéro réservation</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.numeroReservation}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroReservation: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Numéro confirmation</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.numeroConfirmation}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroConfirmation: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Prix */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">
              <CreditCard className="w-5 h-5 inline mr-2" />
              Prix
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prix HT (DA)</label>
                <input
                  type="number"
                  className="input w-full"
                  value={formData.prixHT}
                  onChange={(e) => setFormData(prev => ({ ...prev, prixHT: Number(e.target.value) }))}
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix TTC (DA)</label>
                <input
                  type="number"
                  className="input w-full"
                  value={formData.prixTTC}
                  onChange={(e) => setFormData(prev => ({ ...prev, prixTTC: Number(e.target.value) }))}
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Taxes (DA)</label>
                <input
                  type="number"
                  className="input w-full bg-gray-50"
                  value={formData.taxes}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix par nuit (DA)</label>
                <input
                  type="number"
                  className="input w-full bg-gray-50"
                  value={formData.prixParNuit}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Services inclus */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Services inclus</h3>
            <div className="space-y-3">
              {formData.servicesInclus.map((service, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    className="input flex-1"
                    value={service}
                    onChange={(e) => updateService(index, e.target.value)}
                    placeholder="Service inclus..."
                  />
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addService}
                className="btn-secondary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un service
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Notes et informations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Notes spéciales</label>
                <textarea
                  className="input w-full"
                  value={formData.notesSpeciales}
                  onChange={(e) => setFormData(prev => ({ ...prev, notesSpeciales: e.target.value }))}
                  rows={3}
                  placeholder="Demandes spéciales, préférences..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Politique d'annulation</label>
                <textarea
                  className="input w-full"
                  value={formData.politiqueAnnulation}
                  onChange={(e) => setFormData(prev => ({ ...prev, politiqueAnnulation: e.target.value }))}
                  rows={3}
                  placeholder="Conditions d'annulation..."
                />
              </div>
            </div>
          </div>
        </div>
      </SmartImportComponent>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Link to="/hotel" className="btn-secondary">
          Annuler
        </Link>
        <button
          onClick={handleSave}
          disabled={loading || !formData.nomHotel || !formData.ville}
          className="btn-primary"
        >
          {loading ? (
            <span className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </span>
          ) : (
            <span className="flex items-center">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer la réservation
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default NouveauHotelPage; 