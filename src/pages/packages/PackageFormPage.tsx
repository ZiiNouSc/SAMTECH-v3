import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { packagesAPI } from '../../services/api';
import { Package } from '../../types';
import Card from '../../components/ui/Card';
import { Plus, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

type FormValues = {
  nom: string;
  prix: number;
  pays: string;
  duree: string;
  description: string;
  placesDisponibles: number;
  dateDebut: string;
  dateFin: string;
  image: string;
  enAvant: boolean;
  villesHotels: { ville: string; hotel: string }[];
  inclusions: string[];
  itineraire: { jour: number; description: string }[];
};

const PackageFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inclusionSuggestions, setInclusionSuggestions] = useState<string[]>([]);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      nom: '',
      prix: 0,
      pays: '',
      duree: '',
      description: '',
      placesDisponibles: 20,
      dateDebut: '',
      dateFin: '',
      image: '',
      enAvant: false,
      villesHotels: [{ ville: '', hotel: '' }],
      inclusions: [''],
      itineraire: [{ jour: 1, description: '' }],
    }
  });

  const { fields: villesHotelsFields, append: appendVilleHotel, remove: removeVilleHotel } = useFieldArray({
    control,
    name: "villesHotels"
  });

  const { fields: itineraireFields, append: appendItineraire, remove: removeItineraire } = useFieldArray({
    control,
    name: "itineraire"
  });

  const { fields: inclusionsFields, append: appendInclusion, remove: removeInclusion } = useFieldArray({
    control,
    name: "inclusions" as any
  });

  useEffect(() => {
    // Récupérer les suggestions d'inclusions
    const fetchInclusionSuggestions = async () => {
      try {
        const response = await packagesAPI.getAll();
        if (response.data && response.data.success) {
          const allInclusions = response.data.data.flatMap((pkg: Package) => pkg.inclusions);
          const uniqueInclusions = [...new Set(allInclusions)].filter(Boolean); // Filtre les valeurs vides
          setInclusionSuggestions(uniqueInclusions as string[]);
        }
      } catch (err) {
        console.error("Impossible de charger les suggestions d'inclusions", err);
      }
    };
    
    fetchInclusionSuggestions();

    if (id) {
      setLoading(true);
      packagesAPI.getById(id)
        .then(response => {
          const packageData = response.data.data;
          
          // Formater les dates pour les champs input de type "date"
          if (packageData.dateDebut) {
            packageData.dateDebut = new Date(packageData.dateDebut).toISOString().split('T')[0];
          }
          if (packageData.dateFin) {
            packageData.dateFin = new Date(packageData.dateFin).toISOString().split('T')[0];
          }
          
          reset(packageData); // Utiliser les données formatées
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('Erreur lors du chargement du package.');
          setLoading(false);
        });
    }
  }, [id, reset]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError(null);
    try {
      if (id) {
        await packagesAPI.update(id, data);
      } else {
        await packagesAPI.create(data);
      }
      navigate('/packages');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
      setLoading(false);
    }
  };

  if (loading && id) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{id ? 'Modifier le package' : 'Créer un nouveau package'}</h1>
          <p className="text-gray-600">Gérer les informations du package</p>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && <p className="text-red-500">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Titre</label>
                  <input {...register('nom', { required: 'Le titre est requis' })} className="input-field" />
                  {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Prix (DA)</label>
                    <input type="number" {...register('prix', { required: 'Le prix est requis', valueAsNumber: true })} className="input-field" />
                    {errors.prix && <p className="text-red-500 text-xs mt-1">{errors.prix.message}</p>}
                  </div>
                  <div>
                    <label className="label">Pays</label>
                    <input {...register('pays', { required: 'Le pays est requis' })} className="input-field" />
                    {errors.pays && <p className="text-red-500 text-xs mt-1">{errors.pays.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="label">Durée (ex: 7 jours)</label>
                  <input {...register('duree')} className="input-field" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea {...register('description', { required: 'La description est requise' })} className="input-field h-24" />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>
              </div>
            </Card>
            
            <Card>
              <h3 className="text-lg font-semibold mb-4">Villes et hôtels</h3>
              <div className="space-y-4">
                {villesHotelsFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-4">
                    <input placeholder="Nom de la ville" {...register(`villesHotels.${index}.ville`, { required: true })} className="input-field flex-1" />
                    <input placeholder="Nom de l'hôtel" {...register(`villesHotels.${index}.hotel`)} className="input-field flex-1" />
                    <button type="button" className="btn-danger-outline" onClick={() => removeVilleHotel(index)}><Trash2 size={16} /></button>
                  </div>
                ))}
                <button type="button" className="btn-secondary" onClick={() => appendVilleHotel({ ville: '', hotel: '' })}>
                  <Plus size={16} className="mr-2" /> Ajouter une ville + hôtel
                </button>
              </div>
            </Card>
            
            <Card>
              <h3 className="text-lg font-semibold mb-4">Ce qui est inclus</h3>
              <div className="space-y-4">
                {inclusionsFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-4">
                    <input 
                      placeholder="Ex: Vol aller-retour, Hôtel 4 étoiles, Pension complète..." 
                      {...register(`inclusions.${index}` as const)} 
                      className="input-field flex-1" 
                    />
                    <button type="button" className="btn-danger-outline" onClick={() => removeInclusion(index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-secondary" onClick={() => appendInclusion('' as any)}>
                  <Plus size={16} className="mr-2" /> Ajouter une inclusion
                </button>
              </div>
            </Card>
            
            <Card>
              <h3 className="text-lg font-semibold mb-4">Itinéraire</h3>
              <div className="space-y-4">
                {itineraireFields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <label className="font-medium">Jour {index + 1}</label>
                    <div className="flex items-center gap-4">
                      <textarea placeholder="Description de la journée" {...register(`itineraire.${index}.description` as const, { required: true })} className="input-field h-24 flex-1" />
                      <button type="button" className="btn-danger-outline" onClick={() => removeItineraire(index)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn-secondary" onClick={() => appendItineraire({ jour: itineraireFields.length + 1, description: '' })}>
                  <Plus size={16} className="mr-2" /> Ajouter une journée
                </button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Détails logistiques</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Places disponibles</label>
                  <input type="number" {...register('placesDisponibles', { valueAsNumber: true })} className="input-field" />
                </div>
                <div>
                  <label className="label">Date de début</label>
                  <input type="date" {...register('dateDebut')} className="input-field" />
                </div>
                <div>
                  <label className="label">Date de fin</label>
                  <input type="date" {...register('dateFin')} className="input-field" />
                </div>
                <div>
                  <label className="label">URL de l'image principale</label>
                  <input {...register('image')} className="input-field" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" {...register('enAvant')} id="enAvant" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                  <label htmlFor="enAvant">Mettre en avant cette offre</label>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button 
            type="button" 
            onClick={() => navigate('/packages')} 
            className="btn-secondary"
          >
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : (id ? 'Enregistrer les modifications' : 'Créer le package')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PackageFormPage; 