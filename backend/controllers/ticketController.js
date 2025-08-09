const asyncHandler = require('express-async-handler');
const Ticket = require('../models/ticketModel');
const Agence = require('../models/agenceModel');

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({}).populate('createur', 'nom prenom').sort({ dateCreation: -1 });
  res.json(tickets);
});

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate('createur', 'nom prenom');
  if (ticket) {
    res.json(ticket);
  } else {
    res.status(404);
    throw new Error('Ticket non trouvé');
  }
});

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = asyncHandler(async (req, res) => {
  const { titre, description, priorite, categorie } = req.body;

  const ticket = await Ticket.create({
    titre,
    description,
    priorite: priorite || 'normale',
    categorie,
    statut: 'ouvert',
    createur: req.user._id
  });

  if (ticket) {
    res.status(201).json(ticket);
  } else {
    res.status(400);
    throw new Error('Données invalides');
  }
});

// @desc    Reply to a ticket
// @route   POST /api/tickets/:id/reply
// @access  Private
const replyToTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message manquant'
    });
  }
  
  const ticket = await Ticket.findById(req.params.id);
  
  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket non trouvé'
    });
  }
  
  // Vérifier que l'utilisateur a accès à ce ticket
  if (req.user.role !== 'superadmin' && req.user.agenceId.toString() !== ticket.agenceId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé à ce ticket'
    });
  }
  
  // Ajouter la réponse
  const reponse = {
    message,
    userId: req.user._id,
    userName: `${req.user.prenom} ${req.user.nom}`,
    userRole: req.user.role,
    date: Date.now()
  };
  
  ticket.reponses.push(reponse);
  
  // Mettre à jour le statut du ticket
  if (req.user.role === 'superadmin' && ticket.statut === 'ouvert') {
    ticket.statut = 'en_cours';
  }
  
  ticket.dateMAJ = Date.now();
  
  await ticket.save();
  
  res.status(200).json({
    success: true,
    message: 'Réponse ajoutée avec succès',
    data: {
      id: ticket._id,
      reponses: ticket.reponses,
      statut: ticket.statut,
      dateMAJ: ticket.dateMAJ
    }
  });
});

// @desc    Update ticket status
// @route   PUT /api/tickets/:id/status
// @access  Private
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!status || !['ouvert', 'en_cours', 'ferme'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Statut invalide'
    });
  }
  
  const ticket = await Ticket.findById(req.params.id).populate('agenceId', 'nom email telephone');
  
  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket non trouvé'
    });
  }
  
  // Vérifier que l'utilisateur a accès à ce ticket
  if (req.user.role !== 'superadmin' && req.user.agenceId.toString() !== ticket.agenceId._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé à ce ticket'
    });
  }
  
  ticket.statut = status;
  ticket.dateMAJ = Date.now();
  
  const updatedTicket = await ticket.save();
  
  const ticketWithAgence = {
    id: updatedTicket._id,
    agenceId: ticket.agenceId._id,
    sujet: updatedTicket.sujet,
    description: updatedTicket.description,
    statut: updatedTicket.statut,
    priorite: updatedTicket.priorite,
    dateCreation: updatedTicket.dateCreation,
    dateMAJ: updatedTicket.dateMAJ,
    reponses: updatedTicket.reponses || [],
    agence: {
      nom: ticket.agenceId.nom,
      email: ticket.agenceId.email,
      telephone: ticket.agenceId.telephone
    }
  };
  
  res.status(200).json({
    success: true,
    message: 'Statut du ticket mis à jour avec succès',
    data: ticketWithAgence
  });
});

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (ticket) {
    ticket.titre = req.body.titre || ticket.titre;
    ticket.description = req.body.description || ticket.description;
    ticket.priorite = req.body.priorite || ticket.priorite;
    ticket.categorie = req.body.categorie || ticket.categorie;
    ticket.statut = req.body.statut || ticket.statut;

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);
  } else {
    res.status(404);
    throw new Error('Ticket non trouvé');
  }
});

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (ticket) {
    await ticket.remove();
    res.json({ message: 'Ticket supprimé' });
  } else {
    res.status(404);
    throw new Error('Ticket non trouvé');
  }
});

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  replyToTicket,
  updateTicketStatus,
  updateTicket,
  deleteTicket
};