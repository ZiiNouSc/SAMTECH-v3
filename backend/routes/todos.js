const express = require('express');
const router = express.Router();
const { 
  getTodos, 
  getTodoById, 
  createTodo, 
  updateTodo, 
  toggleTodoStatus, 
  deleteTodo 
} = require('../controllers/todoController');
const { protect, hasPermission } = require('../middlewares/authMiddleware');

// Get all todos
router.get('/', protect, hasPermission('todos', 'lire'), getTodos);

// Get todo by ID
router.get('/:id', protect, hasPermission('todos', 'lire'), getTodoById);

// Create new todo
router.post('/', protect, hasPermission('todos', 'creer'), createTodo);

// Update todo
router.put('/:id', protect, hasPermission('todos', 'modifier'), updateTodo);

// Toggle todo status
router.put('/:id/toggle', protect, hasPermission('todos', 'modifier'), toggleTodoStatus);

// Delete todo
router.delete('/:id', protect, hasPermission('todos', 'supprimer'), deleteTodo);

module.exports = router;