const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getTickets, getTicketById, createTicket, updateTicket, deleteTicket } = require('../controllers/ticketController');

// Get all tickets
router.get('/', protect, getTickets);

// Get ticket by ID
router.get('/:id', protect, getTicketById);

// Create new ticket
router.post('/', protect, createTicket);

// Update ticket
router.put('/:id', protect, updateTicket);

// Delete ticket
router.delete('/:id', protect, deleteTicket);

module.exports = router;