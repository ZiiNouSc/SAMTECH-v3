const asyncHandler = require('express-async-handler');
const Log = require('../models/logModel');

// @desc    Get all logs
// @route   GET /api/logs
// @access  Private/Admin
const getLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, level, action, module, startDate, endDate, search } = req.query;
  
  // Build filter
  const filter = {};
  
  if (level) filter.level = level;
  if (action) filter.action = action;
  if (module) filter.module = module;
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }
  
  if (search) {
    filter.$or = [
      { action: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { module: { $regex: search, $options: 'i' } }
    ];
  }
  
  const logs = await Log.find(filter)
    .populate('userId', 'nom prenom email')
    .populate('agenceId', 'nom')
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await Log.countDocuments(filter);
  
  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  });
});

// @desc    Get log by ID
// @route   GET /api/logs/:id
// @access  Private/Admin
const getLogById = asyncHandler(async (req, res) => {
  const log = await Log.findById(req.params.id)
    .populate('userId', 'nom prenom email')
    .populate('agenceId', 'nom');
  
  if (log) {
    res.status(200).json({
      success: true,
      data: log
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Log non trouvé'
    });
  }
});

// @desc    Create new log
// @route   POST /api/logs
// @access  Private/Admin
const createLog = asyncHandler(async (req, res) => {
  const { 
    level, 
    action, 
    description, 
    module, 
    userId, 
    agenceId,
    ipAddress,
    userAgent,
    method,
    url,
    statusCode,
    duration,
    details,
    erreur,
    metadata
  } = req.body;
  
  if (!level || !action || !description) {
    return res.status(400).json({
      success: false,
      message: 'Level, action et description sont requis'
    });
  }
  
  const log = await Log.create({
    level,
    action,
    description,
    module,
    userId,
    agenceId,
    ipAddress,
    userAgent,
    method,
    url,
    statusCode,
    duration,
    details,
    erreur,
    metadata,
    timestamp: new Date()
  });
  
  res.status(201).json({
    success: true,
    message: 'Log créé avec succès',
    data: log
  });
});

// @desc    Delete log
// @route   DELETE /api/logs/:id
// @access  Private/Admin
const deleteLog = asyncHandler(async (req, res) => {
  const log = await Log.findByIdAndDelete(req.params.id);
  
  if (log) {
    res.status(200).json({
      success: true,
      message: 'Log supprimé avec succès'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Log non trouvé'
    });
  }
});

// @desc    Clear old logs
// @route   DELETE /api/logs/clear
// @access  Private/Admin
const clearOldLogs = asyncHandler(async (req, res) => {
  const { days = 90, level } = req.query;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const filter = { timestamp: { $lt: cutoffDate } };
  if (level) filter.level = level;
  
  const result = await Log.deleteMany(filter);
  
  res.status(200).json({
    success: true,
    message: `${result.deletedCount} logs supprimés`,
    deletedCount: result.deletedCount
  });
});

// @desc    Get log statistics
// @route   GET /api/logs/stats
// @access  Private/Admin
const getLogStats = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Logs by level
  const byLevel = await Log.aggregate([
    { $match: { timestamp: { $gte: startDate } } },
    { $group: { _id: '$level', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Logs by action
  const byAction = await Log.aggregate([
    { $match: { timestamp: { $gte: startDate } } },
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Logs by module
  const byModule = await Log.aggregate([
    { $match: { timestamp: { $gte: startDate } } },
    { $group: { _id: '$module', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Logs by day
  const byDay = await Log.aggregate([
    { $match: { timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  // Error logs
  const errorLogs = await Log.find({
    timestamp: { $gte: startDate },
    level: { $in: ['error', 'fatal'] }
  })
  .populate('userId', 'nom prenom')
  .populate('agenceId', 'nom')
  .sort({ timestamp: -1 })
  .limit(10);
  
  const totalLogs = byLevel.reduce((sum, item) => sum + item.count, 0);
  const errorCount = byLevel.find(item => ['error', 'fatal'].includes(item._id))?.count || 0;
  
  res.status(200).json({
    success: true,
    data: {
      periode: {
        debut: startDate,
        fin: new Date(),
        jours: days
      },
      totalLogs,
      errorCount,
      byLevel,
      byAction,
      byModule,
      byDay,
      recentErrors: errorLogs
    }
  });
});

module.exports = {
  getLogs,
  getLogById,
  createLog,
  deleteLog,
  clearOldLogs,
  getLogStats
}; 