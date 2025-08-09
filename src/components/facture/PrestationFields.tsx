import React from 'react';
import { PrestationFields as PrestationFieldsType, PrestationType } from '../../types/prestations';
import { prestationConfigs } from '../../utils/prestationUtils';

interface PrestationFieldsProps {
  prestation: PrestationFieldsType;
  onChange: (updatedPrestation: PrestationFieldsType) => void;
  errors?: string[];
}

const PrestationFields: React.FC<PrestationFieldsProps> = ({ 
  prestation, 
  onChange, 
  errors = [] 
}) => {
  const config = prestationConfigs[prestation.type];
  
  if (!config) return null;

  const handleFieldChange = (fieldKey: string, value: string) => {
    const updatedPrestation = {
      ...prestation,
      [fieldKey]: value
    };
    onChange(updatedPrestation);
  };

  const renderField = (field: any) => {
    const value = (prestation as any)[field.key] || '';
    const hasError = errors.some(error => error.includes(field.label));

    switch (field.type) {
      case 'select':
        return (
          <div key={field.key} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className={`input-field ${hasError ? 'border-red-500 focus:border-red-500' : ''}`}
              required={field.required}
            >
              <option value="">Sélectionner...</option>
              {field.options?.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'date':
        return (
          <div key={field.key} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className={`input-field ${hasError ? 'border-red-500 focus:border-red-500' : ''}`}
              required={field.required}
            />
          </div>
        );

      default: // text
        return (
          <div key={field.key} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={`input-field ${hasError ? 'border-red-500 focus:border-red-500' : ''}`}
              required={field.required}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
        <span className="text-lg">{config.icon}</span>
        <span className="font-medium text-blue-900">{config.label}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.fields.map(renderField)}
      </div>
      
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <ul className="text-red-700 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PrestationFields; 