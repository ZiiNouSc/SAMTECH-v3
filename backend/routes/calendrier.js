const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/calendrierController');

// Get all events
router.get('/events', protect, getEvents);

// Create new event
router.post('/events', protect, createEvent);

// Update event
router.put('/events/:id', protect, updateEvent);

// Delete event
router.delete('/events/:id', protect, deleteEvent);

module.exports = router;