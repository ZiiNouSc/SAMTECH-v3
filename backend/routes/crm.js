const express = require('express');
const router = express.Router();
const contactCrmController = require('../controllers/contactCrmController');
const { protect, agent } = require('../middlewares/authMiddleware');

router.get('/', protect, agent, contactCrmController.getAllContacts);
router.get('/:id', protect, agent, contactCrmController.getContactById);
router.post('/', protect, agent, contactCrmController.createContact);
router.put('/:id', protect, agent, contactCrmController.updateContact);
router.delete('/:id', protect, agent, contactCrmController.deleteContact);

module.exports = router; 