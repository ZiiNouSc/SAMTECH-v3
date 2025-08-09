import React from 'react';
import { ArticleWithPrestation } from '../../types/prestations';
import { prestationConfigs } from '../../utils/prestationUtils';

interface PrestationSummaryProps {
  articles: ArticleWithPrestation[];
  maxDisplay?: number;
}

const PrestationSummary: React.FC<PrestationSummaryProps> = ({ 
  articles, 
  maxDisplay = 3 
}) => {
  // Compter les types de prestations
  const prestationCounts = articles.reduce((acc, article) => {
    if (article.prestation?.type) {
      acc[article.prestation.type] = (acc[article.prestation.type] || 0) + 1;
    } else {
      acc['standard'] = (acc['standard'] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Convertir en array et trier par nombre
  const sortedPrestations = Object.entries(prestationCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxDisplay);

  const remainingCount = Object.keys(prestationCounts).length - maxDisplay;

  if (sortedPrestations.length === 0) {
    return <span className="text-xs text-gray-400">Aucun article</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {sortedPrestations.map(([type, count]) => {
        if (type === 'standard') {
          return (
            <span 
              key={type}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
            >
              📄 Standard ({count})
            </span>
          );
        }

        const config = prestationConfigs[type as keyof typeof prestationConfigs];
        if (!config) return null;

        return (
          <span 
            key={type}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
            title={config.label}
          >
            {config.icon} {count > 1 ? `${count}x` : ''}
          </span>
        );
      })}
      
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

export default PrestationSummary; 