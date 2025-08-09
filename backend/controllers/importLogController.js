const asyncHandler = require('express-async-handler');
const ImportLog = require('../models/importLogModel');
const { checkPermission } = require('../middleware/auth');

// @desc    Get import logs with filters
// @route   GET /api/import-logs
// @access  Private
const getImportLogs = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId && req.user.role !== 'superadmin') {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    // Construction des filtres
    const filters = {};
    
    // Filtre par agence (sauf pour superadmin)
    if (req.user.role === 'superadmin') {
      if (req.query.agenceId) {
        filters.agenceId = req.query.agenceId;
      }
    } else {
      filters.agenceId = agenceId;
    }

    // Filtres optionnels
    if (req.query.module) {
      filters.finalModule = req.query.module;
    }

    if (req.query.reclassified !== undefined) {
      filters.reclassified = req.query.reclassified === 'true';
    }

    if (req.query.status) {
      filters.status = req.query.status;
    }

    // Filtre par date
    if (req.query.dateFrom || req.query.dateTo) {
      filters.timestamp = {};
      if (req.query.dateFrom) {
        filters.timestamp.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filters.timestamp.$lte = new Date(req.query.dateTo);
      }
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Requête avec population des références
    const logs = await ImportLog.find(filters)
      .populate('userId', 'nom prenom email')
      .populate('agenceId', 'nom')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    // Compter le total pour la pagination
    const total = await ImportLog.countDocuments(filters);

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

  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des logs'
    });
  }
});

// @desc    Create new import log
// @route   POST /api/import-logs
// @access  Private
const createImportLog = asyncHandler(async (req, res) => {
  try {
    const {
      emailId,
      originalModule,
      finalModule,
      reclassified,
      confidence,
      indicators,
      status,
      message,
      emailSubject,
      emailSender,
      emailBody,
      attachmentNames,
      extractedData,
      createdEntryId,
      processingTime,
      errorDetails
    } = req.body;

    // Validation des champs requis
    if (!emailId || !originalModule || !finalModule || confidence === undefined || !message) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants'
      });
    }

    const importLog = await ImportLog.create({
      emailId,
      originalModule,
      finalModule,
      reclassified: reclassified || false,
      confidence,
      indicators: indicators || [],
      status: status || 'pending',
      message,
      userId: req.user._id,
      agenceId: req.user.agenceId,
      emailSubject,
      emailSender,
      emailBody,
      attachmentNames: attachmentNames || [],
      extractedData,
      createdEntryId,
      processingTime,
      errorDetails
    });

    res.status(201).json({
      success: true,
      data: importLog,
      message: 'Log d\'import créé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la création du log:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du log'
    });
  }
});

// @desc    Get import statistics
// @route   GET /api/import-logs/stats
// @access  Private
const getImportStats = asyncHandler(async (req, res) => {
  const agenceId = req.user?.agenceId;
  
  if (!agenceId && req.user.role !== 'superadmin') {
    return res.status(400).json({
      success: false,
      message: 'ID d\'agence manquant'
    });
  }

  try {
    const targetAgenceId = req.user.role === 'superadmin' && req.query.agenceId 
      ? req.query.agenceId 
      : agenceId;

    // Statistiques générales
    const stats = await ImportLog.getStatsByAgence(
      targetAgenceId,
      req.query.dateFrom,
      req.query.dateTo
    );

    // Patterns de reclassification
    const reclassificationPatterns = await ImportLog.getReclassificationPatterns(
      targetAgenceId,
      10
    );

    // Distribution par module
    const moduleDistribution = await ImportLog.aggregate([
      { 
        $match: { 
          agenceId: targetAgenceId,
          ...(req.query.dateFrom && { timestamp: { $gte: new Date(req.query.dateFrom) } }),
          ...(req.query.dateTo && { timestamp: { $lte: new Date(req.query.dateTo) } })
        }
      },
      {
        $group: {
          _id: '$finalModule',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          reclassifiedCount: {
            $sum: { $cond: ['$reclassified', 1, 0] }
          },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Tendance temporelle (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timeline = await ImportLog.aggregate([
      {
        $match: {
          agenceId: targetAgenceId,
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          totalImports: { $sum: 1 },
          reclassifiedImports: {
            $sum: { $cond: ['$reclassified', 1, 0] }
          },
          successfulImports: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        general: stats[0] || {
          totalImports: 0,
          successfulImports: 0,
          reclassifiedImports: 0,
          avgConfidence: 0
        },
        reclassificationPatterns,
        moduleDistribution,
        timeline
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

// @desc    Get import log by ID
// @route   GET /api/import-logs/:id
// @access  Private
const getImportLogById = asyncHandler(async (req, res) => {
  try {
    const agenceId = req.user?.agenceId;
    
    const filters = { _id: req.params.id };
    if (req.user.role !== 'superadmin') {
      filters.agenceId = agenceId;
    }

    const log = await ImportLog.findOne(filters)
      .populate('userId', 'nom prenom email')
      .populate('agenceId', 'nom');

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log d\'import non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: log
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du log:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du log'
    });
  }
});

// @desc    Update import log status
// @route   PUT /api/import-logs/:id
// @access  Private
const updateImportLog = asyncHandler(async (req, res) => {
  try {
    const agenceId = req.user?.agenceId;
    const { status, message, createdEntryId, errorDetails } = req.body;

    const filters = { _id: req.params.id };
    if (req.user.role !== 'superadmin') {
      filters.agenceId = agenceId;
    }

    const log = await ImportLog.findOne(filters);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log d\'import non trouvé'
      });
    }

    // Mise à jour des champs
    if (status) log.status = status;
    if (message) log.message = message;
    if (createdEntryId) log.createdEntryId = createdEntryId;
    if (errorDetails) log.errorDetails = errorDetails;

    await log.save();

    res.status(200).json({
      success: true,
      data: log,
      message: 'Log mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du log:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du log'
    });
  }
});

// @desc    Delete old import logs (cleanup)
// @route   DELETE /api/import-logs/cleanup
// @access  Private/Admin
const cleanupOldLogs = asyncHandler(async (req, res) => {
  // Vérifier les permissions d'admin
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Permissions insuffisantes'
    });
  }

  try {
    const daysToKeep = parseInt(req.query.days) || 90;
    const result = await ImportLog.cleanupOldLogs(daysToKeep);

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} anciens logs supprimés`,
      data: {
        deletedCount: result.deletedCount,
        daysKept: daysToKeep
      }
    });

  } catch (error) {
    console.error('Erreur lors du nettoyage des logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du nettoyage des logs'
    });
  }
});

module.exports = {
  getImportLogs,
  createImportLog,
  getImportStats,
  getImportLogById,
  updateImportLog,
  cleanupOldLogs
}; 