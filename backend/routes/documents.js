const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getDocuments, getDocumentById, createDocument, updateDocument, deleteDocument } = require('../controllers/documentController');

// Get all documents
router.get('/', protect, getDocuments);

// Get document by ID
router.get('/:id', protect, getDocumentById);

// Create new document
router.post('/', protect, createDocument);

// Update document
router.put('/:id', protect, updateDocument);

// Delete document
router.delete('/:id', protect, deleteDocument);

module.exports = router;