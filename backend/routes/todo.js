const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getTodos, getTodoById, createTodo, updateTodo, deleteTodo } = require('../controllers/todoController');

router.get('/', protect, getTodos);
router.get('/:id', protect, getTodoById);
router.post('/', protect, createTodo);
router.put('/:id', protect, updateTodo);
router.delete('/:id', protect, deleteTodo);

module.exports = router; 