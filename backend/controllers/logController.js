const asyncHandler = require('express-async-handler');
const Log = require('../models/logModel');

// @desc    Get all logs
// @route   GET /api/logs
// @access  Private/Admin
const getLogs = asyncHandler(async (req, res) => {
  const logs = await Log.find({}).populate('utilisateur', 'nom prenom').sort({ dateCreation: -1 });
  res.json(logs);
});

// @desc    Get log by ID
// @route   GET /api/logs/:id
// @access  Private/Admin
const getLogById = asyncHandler(async (req, res) => {
  const log = await Log.findById(req.params.id).populate('utilisateur', 'nom prenom');
  if (log) {
    res.json(log);
  } else {
    res.status(404);
    throw new Error('Log non trouvé');
  }
});

// @desc    Delete log
// @route   DELETE /api/logs/:id
// @access  Private/Admin
const deleteLog = asyncHandler(async (req, res) => {
  const log = await Log.findById(req.params.id);

  if (log) {
    await log.remove();
    res.json({ message: 'Log supprimé' });
  } else {
    res.status(404);
    throw new Error('Log non trouvé');
  }
});

// @desc    Clear all logs
// @route   DELETE /api/logs
// @access  Private/Admin
const clearLogs = asyncHandler(async (req, res) => {
  await Log.deleteMany({});
  res.json({ message: 'Tous les logs ont été supprimés' });
});

// @desc    Clear old logs
// @route   DELETE /api/logs/old
// @access  Private/Admin
const clearOldLogs = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await Log.deleteMany({ dateCreation: { $lt: thirtyDaysAgo } });
  res.json({ message: 'Logs anciens supprimés' });
});

// @desc    Get log stats
// @route   GET /api/logs/stats
// @access  Private/Admin
const getLogStats = asyncHandler(async (req, res) => {
  const total = await Log.countDocuments();
  const today = await Log.countDocuments({
    dateCreation: { $gte: new Date().setHours(0, 0, 0, 0) }
  });
  const thisWeek = await Log.countDocuments({
    dateCreation: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });
  
  res.json({
    total,
    today,
    thisWeek
  });
});

module.exports = {
  getLogs,
  getLogById,
  deleteLog,
  clearLogs,
  clearOldLogs,
  getLogStats
}; 