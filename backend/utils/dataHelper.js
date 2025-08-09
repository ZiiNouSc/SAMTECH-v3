const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Helper function to read data from a JSON file
 * @param {string} fileName - The name of the JSON file (without extension)
 * @returns {Array} The parsed data from the file
 */
const readData = (fileName) => {
  try {
    const filePath = path.join(__dirname, `../data/${fileName}.json`);
    
    // Create directory if it doesn't exist
    const dataDir = path.dirname(filePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Create file with empty array if it doesn't exist
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${fileName} data:`, error);
    return [];
  }
};

/**
 * Helper function to write data to a JSON file
 * @param {string} fileName - The name of the JSON file (without extension)
 * @param {Array} data - The data to write to the file
 * @returns {boolean} Whether the write was successful
 */
const writeData = (fileName, data) => {
  try {
    const filePath = path.join(__dirname, `../data/${fileName}.json`);
    
    // Create directory if it doesn't exist
    const dataDir = path.dirname(filePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${fileName} data:`, error);
    return false;
  }
};

/**
 * Generate a unique ID
 * @returns {string} A unique ID
 */
const generateId = () => {
  return uuidv4();
};

/**
 * Format a date to ISO string
 * @param {Date|string} date - The date to format
 * @returns {string} The formatted date
 */
const formatDate = (date) => {
  if (!date) return new Date().toISOString();
  return new Date(date).toISOString();
};

module.exports = {
  readData,
  writeData,
  generateId,
  formatDate
};