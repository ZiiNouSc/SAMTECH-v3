const asyncHandler = require('express-async-handler');
const AuditLog = require('../models/auditModel');

// @desc    Get audit logs
// @route   GET /api/audit/logs
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    action, 
    module, 
    userRole, 
    success, 
    startDate, 
    endDate,
    search 
  } = req.query;

  // Construire le filtre
  const filter = {};
  
  if (action) filter.action = action;
  if (module) filter.module = module;
  if (userRole) filter.userRole = userRole;
  if (success !== undefined) filter.success = success === 'true';
  
  if (startDate && endDate) {
    filter.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (search) {
    filter.$or = [
      { userName: { $regex: search, $options: 'i' } },
      { action: { $regex: search, $options: 'i' } },
      { module: { $regex: search, $options: 'i' } },
      { details: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  
  const logs = await AuditLog.find(filter)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'nom prenom email role');

  const total = await AuditLog.countDocuments(filter);

  const logsWithUserData = logs.map(log => ({
    id: log._id,
    timestamp: log.timestamp,
    userId: log.userId ? log.userId._id : null,
    userName: log.userId ? `${log.userId.nom} ${log.userId.prenom}` : 'Utilisateur supprimé',
    userRole: log.userId ? log.userId.role : 'inconnu',
    action: log.action,
    module: log.module,
    details: log.details,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    success: log.success,
    duration: log.duration,
    affectedResource: log.affectedResource,
    oldValue: log.oldValue,
    newValue: log.newValue
  }));

  res.status(200).json({
    success: true,
    data: logsWithUserData,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get audit log by ID
// @route   GET /api/audit/logs/:id
// @access  Private/Admin
const getAuditLogById = asyncHandler(async (req, res) => {
  const log = await AuditLog.findById(req.params.id)
    .populate('userId', 'nom prenom email role');

  if (!log) {
    res.status(404);
    throw new Error('Log d\'audit non trouvé');
  }

  const logData = {
    id: log._id,
    timestamp: log.timestamp,
    userId: log.userId._id,
    userName: `${log.userId.nom} ${log.userId.prenom}`,
    userRole: log.userId.role,
    action: log.action,
    module: log.module,
    details: log.details,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    success: log.success,
    duration: log.duration,
    affectedResource: log.affectedResource,
    oldValue: log.oldValue,
    newValue: log.newValue
  };

  res.status(200).json({
    success: true,
    data: logData
  });
});

// @desc    Get audit statistics
// @route   GET /api/audit/stats
// @access  Private/Admin
const getAuditStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const filter = {};
  if (startDate && endDate) {
    filter.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const totalLogs = await AuditLog.countDocuments(filter);
  const successCount = await AuditLog.countDocuments({ ...filter, success: true });
  const failureCount = await AuditLog.countDocuments({ ...filter, success: false });

  // Calculer la durée moyenne
  const avgDurationResult = await AuditLog.aggregate([
    { $match: filter },
    { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
  ]);

  const avgDuration = avgDurationResult.length > 0 ? Math.round(avgDurationResult[0].avgDuration) : 0;

  // Statistiques par action
  const actionStats = await AuditLog.aggregate([
    { $match: filter },
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Statistiques par module
  const moduleStats = await AuditLog.aggregate([
    { $match: filter },
    { $group: { _id: '$module', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalLogs,
      successCount,
      failureCount,
      avgDuration,
      actionStats,
      moduleStats
    }
  });
});

// @desc    Export audit logs
// @route   GET /api/audit/export
// @access  Private/Admin
const exportAuditLogs = asyncHandler(async (req, res) => {
  const { format = 'csv', ...filters } = req.query;

  // Appliquer les mêmes filtres que getAuditLogs
  const filter = {};
  
  if (filters.action) filter.action = filters.action;
  if (filters.module) filter.module = filters.module;
  if (filters.userRole) filter.userRole = filters.userRole;
  if (filters.success !== undefined) filter.success = filters.success === 'true';
  
  if (filters.startDate && filters.endDate) {
    filter.timestamp = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  const logs = await AuditLog.find(filter)
    .sort({ timestamp: -1 })
    .populate('userId', 'nom prenom email role');

  if (format === 'csv') {
    const csvData = logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      userName: `${log.userId.nom} ${log.userId.prenom}`,
      userRole: log.userId.role,
      action: log.action,
      module: log.module,
      details: log.details,
      ipAddress: log.ipAddress,
      success: log.success,
      duration: log.duration
    }));

    const csv = convertToCSV(csvData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } else {
    res.status(200).json({
      success: true,
      data: logs
    });
  }
});

// Fonction utilitaire pour convertir en CSV
const convertToCSV = (data) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getAuditStats,
  exportAuditLogs
}; 