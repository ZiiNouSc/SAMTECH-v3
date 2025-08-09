const asyncHandler = require('express-async-handler');
const Document = require('../models/documentModel');

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  if (req.user.role !== 'superadmin') {
    if (!agenceId) return res.status(400).json({ success: false, message: "ID d'agence manquant" });
  }
  const documents = await Document.find(req.user.role === 'superadmin' ? {} : { agenceId }).populate('createur', 'nom prenom').sort({ dateCreation: -1 });
  res.json(documents);
});

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Private
const getDocumentById = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id).populate('createur', 'nom prenom');
  if (document) {
    res.json(document);
  } else {
    res.status(404);
    throw new Error('Document non trouvé');
  }
});

// @desc    Create new document
// @route   POST /api/documents
// @access  Private
const createDocument = asyncHandler(async (req, res) => {
  const { titre, description, type, fichier, categorie } = req.body;

  const document = await Document.create({
    titre,
    description,
    type,
    fichier,
    categorie,
    createur: req.user._id
  });

  if (document) {
    res.status(201).json(document);
  } else {
    res.status(400);
    throw new Error('Données invalides');
  }
});

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (document) {
    document.titre = req.body.titre || document.titre;
    document.description = req.body.description || document.description;
    document.type = req.body.type || document.type;
    document.fichier = req.body.fichier || document.fichier;
    document.categorie = req.body.categorie || document.categorie;

    const updatedDocument = await document.save();
    res.json(updatedDocument);
  } else {
    res.status(404);
    throw new Error('Document non trouvé');
  }
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (document) {
    await document.remove();
    res.json({ message: 'Document supprimé' });
  } else {
    res.status(404);
    throw new Error('Document non trouvé');
  }
});

module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument
};