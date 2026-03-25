const DoseLog = require('../models/doseLog.model');
const Medication = require('../models/medications.model');
const { successResponse, errorResponse } = require('../utils/response');

// LOG DOSE
const logDose = async (req, res, next) => {
  try {
    const { medication, scheduledTime, status, takenAt, notes } = req.body;

    //  Check medication ownership
    const med = await Medication.findOne({
      _id: medication,
      user: req.user._id,
      isActive: true,
    });

    if (!med) {
      return errorResponse(res, 'Medication not found', 404);
    }

    //  Prevent duplicate log
    const existingLog = await DoseLog.findOne({
      user: req.user._id,
      medication,
      scheduledTime,
    });

    if (existingLog) {
      return errorResponse(res, 'Dose already logged for this time', 409);
    }

    //  Create log
    const doseLog = await DoseLog.create({
      user: req.user._id,
      medication,
      scheduledTime,
      status,
      takenAt: status === 'taken' ? takenAt || new Date() : undefined,
      notes,
    });

    // 🔥 Atomic decrement
    if (status === 'taken') {
      await Medication.updateOne(
        { _id: medication, remainingQuantity: { $gt: 0 } },
        { $inc: { remainingQuantity: -1 } }
      );
    }

    return successResponse(res, 'Dose logged successfully', doseLog, 201);
  } catch (error) {
    next(error);
  }
};


// GET DOSE LOGS

const getDoseLogs = async (req, res, next) => {
  try {
    const { medicationId, status, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };

    if (medicationId) filter.medication = medicationId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [doseLogs, total] = await Promise.all([
      DoseLog.find(filter)
        .populate('medication', 'name dosage')
        .sort({ scheduledTime: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),

      DoseLog.countDocuments(filter),
    ]);

    return successResponse(res, 'Dose logs retrieved', {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: doseLogs,
    });
  } catch (error) {
    next(error);
  }
};


// GET SINGLE DOSE LOG 

const getDoseLog = async (req, res, next) => {
  try {
    const doseLog = await DoseLog.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('medication', 'name dosage frequency')
      .lean();

    if (!doseLog) {
      return errorResponse(res, 'Dose log not found', 404);
    }

    return successResponse(res, 'Dose log retrieved', doseLog);
  } catch (error) {
    next(error);
  }
};

// UPDATE DOSE LOG 

const updateDoseLog = async (req, res, next) => {
  try {
    const { status, takenAt, notes } = req.body;

    const doseLog = await DoseLog.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!doseLog) {
      return errorResponse(res, 'Dose log not found', 404);
    }

    // 🔥 Handle quantity adjustments safely
    if (doseLog.status !== status) {
      if (doseLog.status === 'taken' && status !== 'taken') {
        // give pill back
        await Medication.updateOne(
          { _id: doseLog.medication },
          { $inc: { remainingQuantity: 1 } }
        );
      }

      if (doseLog.status !== 'taken' && status === 'taken') {
        // reduce pill if available
        await Medication.updateOne(
          { _id: doseLog.medication, remainingQuantity: { $gt: 0 } },
          { $inc: { remainingQuantity: -1 } }
        );
      }
    }

    // 🔥 Update fields
    doseLog.status = status ?? doseLog.status;
    doseLog.takenAt =
      status === 'taken'
        ? takenAt || new Date()
        : undefined;

    if (notes !== undefined) {
      doseLog.notes = notes;
    }

    await doseLog.save();

    return successResponse(res, 'Dose log updated', doseLog);
  } catch (error) {
    next(error);
  }
};
// DELETE DOSE LOG
const deleteDoseLog = async (req, res, next) => {
  try {
    const doseLog = await DoseLog.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!doseLog) {
      return errorResponse(res, 'Dose log not found', 404);
    }

    // If status was taken give pill back
    if (doseLog.status === 'taken') {
      await Medication.updateOne(
        { _id: doseLog.medication },
        { $inc: { remainingQuantity: 1 } }
      );
    }

    await doseLog.deleteOne();

    return successResponse(res, 'Dose log deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logDose,
  getDoseLogs,
  getDoseLog,
  updateDoseLog,
  deleteDoseLog,
};


