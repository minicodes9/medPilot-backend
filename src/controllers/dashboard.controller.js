const Medication = require('../models/medications.model');
const DoseLog = require('../models/doseLog.model');
const RefillRequest = require('../models/refillRequest.model');
const { successResponse } = require('../utils/response');

// GET DASHBOARD OVERVIEW 
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 🔥 Fix date (avoid timestamp bug)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalMedications,
      activeMedications,
      todaysDoses,
      adherenceStats,
      medicationsNeedingRefill,
      pendingRefillRequests,
    ] = await Promise.all([
      // Total medications
      Medication.countDocuments({ user: userId }),

      // Active medications
      Medication.countDocuments({ user: userId, isActive: true }),

      // Today's doses
      DoseLog.find({
        user: userId,
        scheduledTime: { $gte: startOfDay, $lte: endOfDay },
      })
        .populate('medication', 'name dosage')
        .lean(),

      // Adherence stats (optimized)
      DoseLog.aggregate([
        {
          $match: {
            user: userId,
            scheduledTime: { $gte: last30Days },
          },
        },
        {
          $group: {
            _id: null,
            taken: {
              $sum: { $cond: [{ $eq: ['$status', 'taken'] }, 1, 0] },
            },
            skipped: {
              $sum: { $cond: [{ $eq: ['$status', 'skipped'] }, 1, 0] },
            },
            missed: {
              $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] },
            },
          },
        },
      ]),

      // Medications needing refill
      Medication.find({
        user: userId,
        isActive: true,
        $expr: {
          $lte: ['$remainingQuantity', '$refillThreshold'],
        },
      })
        .select('name remainingQuantity refillThreshold')
        .lean(),

      // Pending refill requests
      RefillRequest.countDocuments({
        user: userId,
        status: { $in: ['pending', 'approved'] },
      }),
    ]);

    //  Better adherence calculation
    const stats = adherenceStats[0] || {
      taken: 0,
      skipped: 0,
      missed: 0,
    };

    const totalDoses = stats.taken + stats.skipped + stats.missed;

    const adherenceRate =
      totalDoses > 0
        ? Math.round((stats.taken / totalDoses) * 100)
        : 0;

    // Today's progress
    const takenToday = todaysDoses.filter((d) => d.status === 'taken').length;
    const totalToday = todaysDoses.length;

    return successResponse(res, 'Dashboard retrieved', {
      overview: {
        totalMedications,
        activeMedications,
        pendingRefillRequests,
        medicationsNeedingRefill: medicationsNeedingRefill.length,
      },
      today: {
        total: totalToday,
        taken: takenToday,
        remaining: totalToday - takenToday,
        doses: todaysDoses,
      },
      adherence: {
        rate: adherenceRate,
        last30Days: {
          ...stats,
          total: totalDoses,
        },
      },
      refills: {
        pendingRequests: pendingRefillRequests,
        medicationsLow: medicationsNeedingRefill,
      },
    });
  } catch (error) {
    next(error);
  }
};


// GET ADHERENCE HISTORY 
const getAdherenceHistory = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const history = await DoseLog.aggregate([
      {
        $match: {
          user: req.user._id,
          scheduledTime: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$scheduledTime',
              },
            },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          taken: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'taken'] }, '$count', 0],
            },
          },
          skipped: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'skipped'] }, '$count', 0],
            },
          },
          missed: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'missed'] }, '$count', 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return successResponse(res, 'Adherence history retrieved', history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getAdherenceHistory,
};