/**
 * Utilitaire pour gérer les URLs des images selon l'environnement
 */

// Fonction pour construire l'URL complète d'une image
const buildImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // Si c'est déjà une URL complète, la retourner
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // En production, utiliser le domaine de production
  if (process.env.NODE_ENV === 'production') {
    const baseUrl = process.env.BASE_URL || 'https://samtech.app';
    return `${baseUrl}${imagePath}`;
  }
  
  // En développement, utiliser localhost
  const baseUrl = process.env.BASE_URL || 'http://localhost:81';
  return `${baseUrl}${imagePath}`;
};

// Fonction pour construire lURL de base selon l'environnement
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.BASE_URL || 'https://samtech.app';
  }
  return process.env.BASE_URL || 'http://localhost:8001';
};

// Fonction pour nettoyer une URL dimage (retirer le domaine si nécessaire)
const cleanImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // Si cest une URL complète, extraire le chemin relatif
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    try {
      const url = new URL(imagePath);
      return url.pathname;
    } catch (error) {
      return imagePath;
    }
  }
  
  return imagePath;
};

module.exports = {
  buildImageUrl,
  getBaseUrl,
  cleanImageUrl
}; 