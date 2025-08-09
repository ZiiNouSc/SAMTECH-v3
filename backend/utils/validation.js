const mongoose = require('mongoose');

// Valider si une chaîne est un ObjectId MongoDB valide
exports.validateObjectId = (id) => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

// Valider un email
exports.validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Valider un numéro de téléphone (format français)
exports.validatePhone = (phone) => {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone);
};

// Valider une chaîne non vide
exports.validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

// Valider une longueur minimale
exports.validateMinLength = (value, minLength) => {
  return value && value.toString().length >= minLength;
};

// Valider une longueur maximale
exports.validateMaxLength = (value, maxLength) => {
  return value && value.toString().length <= maxLength;
}; 