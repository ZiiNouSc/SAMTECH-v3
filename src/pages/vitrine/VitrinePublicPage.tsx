import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReservationModal from '../../components/ReservationModal';

interface VitrineConfig {
  isActive: boolean;
  domainName: string;
  title: string;
  description: string;
  slogan?: string;
  logo: string;
  bannerImage: string;
  primaryColor: string;
  secondaryColor: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    hours: string;
  };
  aboutText: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  // Sections configurables
  featuresSection?: {
    enabled: boolean;
    title: string;
    features: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  statsSection?: {
    enabled: boolean;
    stats: Array<{
      number: string;
      label: string;
    }>;
  };
  testimonialsSection?: {
    enabled: boolean;
    title: string;
    testimonials: Array<{
      name: string;
      role: string;
      content: string;
      rating: number;
    }>;
  };
}

interface Package {
  _id: string;
  nom: string;
  description: string;
  prix: number;
  duree: string;
  image?: string;
  inclusions?: string[];
  itineraire?: Array<{
    jour: number;
    description: string;
  }>;
  dateDebut?: string;
  dateFin?: string;
  placesDisponibles?: number;
}

const VitrinePublicPage: React.FC = () => {
  const { slug } = useParams();
  const [config, setConfig] = useState<VitrineConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<Package[]>([]);
  const [activeSection, setActiveSection] = useState('home');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    console.log('Vitrine public - Slug reçu:', slug); // Debug
    fetchVitrineConfig(slug);
    fetchPackages(slug);
  }, [slug]);

  const fetchVitrineConfig = async (slugParam: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/vitrine/public/${slugParam}`);
      if (response.data.success) {
        const data = response.data.data;
        console.log('Vitrine public config:', data); // Debug
        console.log('Logo URL:', data.logo); // Debug
        console.log('Banner URL:', data.bannerImage); // Debug
        console.log('Features section:', data.featuresSection); // Debug
        console.log('Stats section:', data.statsSection); // Debug
        console.log('Testimonials section:', data.testimonialsSection); // Debug
        data.domainName ||= `${slugParam}-samtech.fr`;
        setConfig(data);
      } else {
        throw new Error(response.data.message || 'Erreur de chargement');
      }
    } catch (error) {
      console.error('Error fetching vitrine config:', error);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async (slugParam: string) => {
    try {
      console.log('Fetching packages for slug:', slugParam); // Debug
      console.log('Full URL:', `/api/packages/public?agence=${slugParam}`); // Debug
      const response = await axios.get(`/api/packages/public?agence=${slugParam}`);
      console.log('Packages response:', response.data); // Debug
      console.log('Packages count:', response.data.success ? response.data.data.length : 0); // Debug
      setPackages(response.data.success ? response.data.data : []);
    } catch (error: any) {
      console.error('Error fetching packages:', error); // Debug
      console.error('Error details:', error.response?.data); // Debug
      setPackages([]);
    }
  };

  if (!slug) return <div className="text-center py-12 text-gray-500">Aucun slug spécifié.</div>;
  if (loading) return <div className="text-center py-12 text-gray-500">Chargement en cours...</div>;
  if (!config) return <div className="text-center py-12 text-red-500">Vitrine non trouvée.</div>;
  if (!config.isActive) return <div className="text-center py-12 text-gray-500">Vitrine désactivée.</div>;

  const { primaryColor, secondaryColor } = config;
  const textPrimary = { color: primaryColor };
  const bgPrimary = { backgroundColor: primaryColor };
  const textSecondary = { color: secondaryColor };

  // Fonction pour rendre le HTML de manière sécurisée
  const renderHTML = (html: string) => {
    return { __html: html };
  };

  // Fonction pour nettoyer les URLs des réseaux sociaux
  const cleanSocialUrl = (url: string): string => {
    if (!url) return '';
    
    // Si l'URL commence déjà par http/https, la retourner telle quelle
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Si c'est juste un nom d'utilisateur ou un chemin relatif, ajouter le protocole
    if (url.includes('facebook.com') || url.includes('fb.com')) {
      return `https://${url}`;
    }
    if (url.includes('instagram.com') || url.includes('ig.com')) {
      return `https://${url}`;
    }
    if (url.includes('twitter.com') || url.includes('x.com')) {
      return `https://${url}`;
    }
    
    // Pour les autres cas, ajouter https://
    return `https://${url}`;
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <main className="w-full px-4 py-10 space-y-20">
            {/* Section Hero */}
            <section className="text-center py-20">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-6xl font-bold mb-6" style={textPrimary}>
                  {config.title}
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                  {config.description}
                </p>
                
                {/* Packages aléatoires avant les boutons */}
                {packages.length > 0 && (
                  <div className="mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {packages
                        .sort(() => Math.random() - 0.5) // Mélanger aléatoirement
                        .slice(0, 3)
                        .map((pkg) => (
                        <div key={pkg._id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                          {pkg.image && (
                            <div className="h-32 overflow-hidden">
                              <img src={pkg.image} alt={pkg.nom} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="p-4 space-y-3">
                            <h3 className="text-lg font-bold" style={textPrimary}>{pkg.nom}</h3>
                            <p className="text-gray-600 text-sm line-clamp-3">{pkg.description}</p>
                            <button
                              onClick={() => setSelectedPackage(pkg)}
                              className="w-full py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
                              style={bgPrimary}
                            >
                              Voir détails
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setActiveSection('packages')}
                    className="px-8 py-4 text-lg font-semibold text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    style={bgPrimary}
                  >
                    Découvrir nos offres
                  </button>
                  <button
                    onClick={() => setActiveSection('about')}
                    className="px-8 py-4 text-lg font-semibold border-2 rounded-full hover:bg-gray-50 transition-all duration-300"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    En savoir plus
                  </button>
                </div>
              </div>
            </section>

            {/* Section Services/Fonctionnalités */}
            {config.featuresSection?.enabled && (
              <section className="py-20 bg-gradient-to-r from-gray-50 to-white w-full">
                <div className="px-4">
                  <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4" style={textSecondary}>
                      {config.featuresSection.title || 'Nos Services'}
                    </h2>
                    <p className="text-lg text-gray-600">Découvrez ce qui nous rend uniques</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {config.featuresSection.features?.map((feature, index) => (
                      <div key={index} className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                        <div className="text-4xl mb-4">{feature.icon}</div>
                        <h3 className="text-xl font-bold mb-3" style={textPrimary}>{feature.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Section Statistiques */}
            {config.statsSection?.enabled && (
              <section className="py-20 w-full" style={{ backgroundColor: primaryColor + '10' }}>
                <div className="px-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {config.statsSection.stats?.map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-5xl font-bold mb-2" style={textPrimary}>{stat.number}</div>
                        <div className="text-lg text-gray-600">{stat.label}</div>
                      </div>
                    ))}
                  </div>
        </div>
              </section>
            )}
          </main>
        );

      case 'about':
        return (
          <main className="w-full px-4 py-16">
            <section className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-6" style={textSecondary}>À propos de nous</h1>
              <div className="w-24 h-1 mx-auto mb-8" style={bgPrimary}></div>
            </section>
            
            <section className="prose prose-lg mx-auto max-w-4xl">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div 
                  className="text-gray-700 leading-relaxed text-lg"
                  dangerouslySetInnerHTML={renderHTML(config.aboutText)}
                />
              </div>
            </section>

            {/* Section Témoignages */}
            {config.testimonialsSection?.enabled && (
              <section className="py-20 bg-gray-50 w-full">
                <div className="px-4">
                  <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4" style={textSecondary}>
                      {config.testimonialsSection.title || 'Témoignages'}
                    </h2>
                    <p className="text-lg text-gray-600">Ce que disent nos clients</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {config.testimonialsSection.testimonials?.map((testimonial, index) => (
                      <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="text-yellow-400 text-2xl">
                            {'★'.repeat(testimonial.rating)}
                            {'☆'.repeat(5 - testimonial.rating)}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                        <div>
                          <div className="font-semibold text-gray-900">{testimonial.name}</div>
                          <div className="text-sm text-gray-500">{testimonial.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Section Valeurs */}
            <section className="mt-16 max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12" style={textSecondary}>Nos Valeurs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: primaryColor + '20', color: primaryColor }}>
                    ✈️
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={textPrimary}>Excellence</h3>
                  <p className="text-gray-600">Nous nous engageons à offrir des services de la plus haute qualité</p>
                </div>
                <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: primaryColor + '20', color: primaryColor }}>
                    🤝
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={textPrimary}>Confiance</h3>
                  <p className="text-gray-600">Votre satisfaction et votre confiance sont notre priorité absolue</p>
                </div>
                <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: primaryColor + '20', color: primaryColor }}>
                    🌍
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={textPrimary}>Aventure</h3>
                  <p className="text-gray-600">Nous créons des expériences uniques et mémorables</p>
                </div>
            </div>
            </section>
          </main>
        );

      case 'packages':
        return (
          <main className="w-full px-4 py-16">
            <section className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-6" style={textSecondary}>Nos Offres</h1>
              <p className="text-xl text-gray-600">Découvrez nos destinations exceptionnelles</p>
        </section>

            {packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {packages.map((pkg) => (
                  <div key={pkg._id} className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                    {pkg.image && (
                      <div className="h-56 overflow-hidden">
                        <img src={pkg.image} alt={pkg.nom} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="p-6 space-y-4">
                      <h3 className="text-2xl font-bold" style={textPrimary}>{pkg.nom}</h3>
                      <p className="text-gray-600 leading-relaxed line-clamp-3">{pkg.description}</p>
                      
                        <button
                        onClick={() => setSelectedPackage(pkg)}
                        className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                          style={bgPrimary}
                        >
                          Voir détails
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 max-w-4xl mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-3xl">✈️</span>
                </div>
                <h3 className="text-2xl font-bold mb-4" style={textSecondary}>Aucune offre disponible</h3>
                <p className="text-gray-600">Nos offres seront bientôt disponibles. Revenez plus tard !</p>
              </div>
            )}
          </main>
        );

      default:
        return null;
    }
  };

  // Page de détails du package
  if (selectedPackage) {
    return (
      <div className="min-h-screen w-full bg-gray-50 text-gray-800">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col items-start gap-2">
            <img 
              src={config.logo || '/placeholder-logo.svg'} 
              alt="Logo" 
              className="h-16 w-auto object-contain"
              onError={(e) => {
                console.log('Logo error in public page:', e.currentTarget.src);
                if (e.currentTarget.src !== '/placeholder-logo.svg') {
                  e.currentTarget.src = '/placeholder-logo.svg';
                }
              }}
            />
            <p className="text-sm font-medium text-gray-700 leading-tight">
              {config.slogan || 'Votre partenaire de voyage'}
            </p>
          </div>
          <nav className="hidden md:flex gap-8 text-base font-medium">
            <button
              onClick={() => setSelectedPackage(null)}
              className="hover:text-black transition-colors text-gray-600"
            >
              ← Retour
            </button>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className="mb-8">
            <button
              onClick={() => setSelectedPackage(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
            >
              ← Retour aux offres
            </button>
          </div>
          
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
            {selectedPackage.image && (
              <div className="h-80 overflow-hidden">
                <img 
                  src={selectedPackage.image} 
                  alt={selectedPackage.nom} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
              <div>
                  <h1 className="text-4xl font-bold mb-2" style={textPrimary}>{selectedPackage.nom}</h1>
                  <p className="text-xl text-gray-600">{selectedPackage.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold" style={textSecondary}>{selectedPackage.prix} DZD</div>
                  <div className="text-sm text-gray-500">Durée : {selectedPackage.duree}</div>
                </div>
              </div>

              {/* Informations de voyage */}
              {(selectedPackage.dateDebut || selectedPackage.dateFin || selectedPackage.placesDisponibles) && (
                <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-4" style={textSecondary}>Informations de voyage</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {selectedPackage.dateDebut && selectedPackage.dateFin && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 bg-blue-100">
                          📅
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Dates de voyage</div>
                          <div className="font-semibold text-gray-900">
                            {new Date(selectedPackage.dateDebut).toLocaleDateString('fr-FR')} - {new Date(selectedPackage.dateFin).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedPackage.placesDisponibles && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-green-600 bg-green-100">
                          👥
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Places disponibles</div>
                          <div className="font-semibold text-gray-900">{selectedPackage.placesDisponibles} places</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-purple-600 bg-purple-100">
                        ⏱️
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Durée</div>
                        <div className="font-semibold text-gray-900">{selectedPackage.duree}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {(selectedPackage.inclusions?.length || 0) > 0 && selectedPackage.itineraire && selectedPackage.itineraire.length > 0 && (
                <div className="mb-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Ce qui est inclus */}
                    <div>
                      <h2 className="text-2xl font-bold mb-4" style={textSecondary}>Ce qui est inclus</h2>
                      <div className="space-y-3">
                        {selectedPackage.inclusions?.map((item, i) => (
                          <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <span className="w-3 h-3 rounded-full mr-3" style={bgPrimary}></span>
                            <span className="text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Itinéraire */}
                    <div>
                      <h2 className="text-2xl font-bold mb-4" style={textSecondary}>Itinéraire</h2>
                      <div className="space-y-3">
                        {selectedPackage.itineraire.map((jour, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {jour.jour}
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">{jour.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Affichage séparé si seulement les inclusions existent */}
              {(selectedPackage.inclusions?.length || 0) > 0 && (!selectedPackage.itineraire || selectedPackage.itineraire.length === 0) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4" style={textSecondary}>Ce qui est inclus</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedPackage.inclusions?.map((item, i) => (
                      <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <span className="w-3 h-3 rounded-full mr-3" style={bgPrimary}></span>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Affichage séparé si seulement l'itinéraire existe */}
              {(!selectedPackage.inclusions || selectedPackage.inclusions.length === 0) && selectedPackage.itineraire && selectedPackage.itineraire.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4" style={textSecondary}>Itinéraire</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-4">
                      {selectedPackage.itineraire.map((jour, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                            {jour.jour}
                          </div>
                          <div className="flex-1 bg-white rounded-lg p-4 shadow-sm">
                            <p className="text-gray-700 leading-relaxed">{jour.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    console.log('Bouton Réserver maintenant cliqué');
                    console.log('selectedPackage:', selectedPackage);
                    console.log('isReservationModalOpen avant:', isReservationModalOpen);
                    setIsReservationModalOpen(true);
                    console.log('isReservationModalOpen après:', true);
                  }}
                  className="flex-1 py-4 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg"
                  style={bgPrimary}
                >
                  Réserver maintenant
                </button>
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="px-8 py-4 border-2 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  Retour
                </button>
              </div>
            </div>
          </div>
      </main>

        {/* Modal de réservation */}
        <ReservationModal
          isOpen={isReservationModalOpen}
          onClose={() => {
            console.log('Fermeture du modal');
            setIsReservationModalOpen(false);
          }}
          package={selectedPackage}
          agenceSlug={slug || ''}
          onSuccess={() => {
            console.log('Réservation réussie');
            // Rafraîchir les packages pour mettre à jour les places disponibles
            fetchPackages(slug || '');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col items-start gap-2">
          <img 
            src={config.logo || '/placeholder-logo.svg'} 
            alt="Logo" 
            className="h-16 w-auto object-contain"
            onError={(e) => {
              console.log('Logo error in public page:', e.currentTarget.src);
              if (e.currentTarget.src !== '/placeholder-logo.svg') {
                e.currentTarget.src = '/placeholder-logo.svg';
              }
            }}
          />
          <p className="text-sm font-medium text-gray-700 leading-tight">
            {config.slogan || 'Votre partenaire de voyage'}
          </p>
        </div>
        <nav className="hidden md:flex gap-8 text-base font-medium">
          <button
            onClick={() => setActiveSection('home')}
            className={`hover:text-black transition-colors ${activeSection === 'home' ? 'font-semibold' : 'text-gray-600'}`}
            style={activeSection === 'home' ? textPrimary : {}}
          >
            Accueil
          </button>
          <button
            onClick={() => setActiveSection('about')}
            className={`hover:text-black transition-colors ${activeSection === 'about' ? 'font-semibold' : 'text-gray-600'}`}
            style={activeSection === 'about' ? textPrimary : {}}
          >
            À propos
          </button>
          <button
            onClick={() => setActiveSection('packages')}
            className={`hover:text-black transition-colors ${activeSection === 'packages' ? 'font-semibold' : 'text-gray-600'}`}
            style={activeSection === 'packages' ? textPrimary : {}}
          >
            Nos Offres
          </button>
        </nav>
      </header>

      {/* Banner */}
      {config.bannerImage && activeSection === 'home' && (
        <div
          className="w-full h-96 bg-cover bg-center bg-gray-100 relative"
          style={{ 
            backgroundImage: `url(${config.bannerImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      )}

      {/* Contenu principal */}
      {renderContent()}

      {/* Footer Pro */}
      <footer style={bgPrimary} className="text-white px-6 py-160w-full">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4">{config.title}</h3>
            <p className="text-gray-100 leading-relaxed">{config.slogan}</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4">Nos Services</h4>
            <ul className="space-y-2 text-gray-100">
              {config.featuresSection?.enabled && config.featuresSection.features ? (
                config.featuresSection.features.slice(0, 4).map((service, index) => (
                  <li key={index}>{service.icon} {service.title}</li>
                ))
              ) : (
                <>
                  <li>✈️ Offres de Voyage</li>
                  <li>📋 Services Visa</li>
                  <li>🛡️ Assurance</li>
                  <li>🏨 Réservations Hôtel</li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <div className="space-y-2 text-gray-100">
              {config.contactInfo.phone && <p>📞 {config.contactInfo.phone}</p>}
              {config.contactInfo.email && <p>✉️ {config.contactInfo.email}</p>}
              {config.contactInfo.address && <p>📍 {config.contactInfo.address}</p>}
              {config.contactInfo.hours && <p>🕒 {config.contactInfo.hours}</p>}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4">Suivez-nous</h4>
            <div className="flex gap-4 text-white text-2xl">
              {config.socialLinks.facebook && (
                <a 
                  href={cleanSocialUrl(config.socialLinks.facebook)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-gray-200 transition-colors"
                >
                  📘
                </a>
              )}
              {config.socialLinks.instagram && (
                <a 
                  href={cleanSocialUrl(config.socialLinks.instagram)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-gray-200 transition-colors"
                >
                  📷
                </a>
              )}
              {config.socialLinks.twitter && (
                <a 
                  href={cleanSocialUrl(config.socialLinks.twitter)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-gray-200 transition-colors"
                >
                  🐦
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-white/20 mt-12 pt-8 text-center">
          <p className="text-gray-200 text-sm">© {new Date().getFullYear()} {config.title} – Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
};

export default VitrinePublicPage;
