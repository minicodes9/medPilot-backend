const Medication = require('../models/medications.model');
const { successResponse, errorResponse } = require('../utils/response');


// ADD MEDICATION 
const addMedication = async (req, res, next) => {
  try {
    const medication = await Medication.create({
      ...req.body,
      user: req.user._id,
    });

    return successResponse(res, 'Medication added successfully', medication, 201);
  } catch (error) {
    next(error);
  }
};


// GET ALL MEDICATIONS

const getMedications = async (req, res, next) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const [medications, total] = await Promise.all([
      Medication.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),

      Medication.countDocuments(filter),
    ]);

    return successResponse(res, 'Medications retrieved', {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: medications,
    });
  } catch (error) {
    next(error);
  }
};


// GET SINGLE MEDICATION 

const getMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!medication) {
      return errorResponse(res, 'Medication not found', 404);
    }

    return successResponse(res, 'Medication retrieved', medication);
  } catch (error) {
    next(error);
  }
};


//  UPDATE MEDICATION 

const updateMedication = async (req, res, next) => {
  try {
    //  Only allow specific fields
    const allowedFields = [
      'name',
      'dosage',
      'frequency',
      'times',
      'startDate',
      'endDate',
      'quantity',
      'refillThreshold',
      'instructions',
      'isActive',
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const medication = await Medication.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!medication) {
      return errorResponse(res, 'Medication not found', 404);
    }

    return successResponse(res, 'Medication updated', medication);
  } catch (error) {
    next(error);
  }
};

//  DELETE MEDICATION 

const deleteMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!medication) {
      return errorResponse(res, 'Medication not found', 404);
    }

    return successResponse(res, 'Medication deactivated');
  } catch (error) {
    next(error);
  }
};

//
// ── CHECK REFILL STATUS ──────────────────────────────────
//
const checkRefillStatus = async (req, res, next) => {
  try {
    const medications = await Medication.find({
      user: req.user._id,
      isActive: true,
    }).lean();

    const needsRefill = medications.filter(
      (med) => med.remainingQuantity <= med.refillThreshold
    );

    return successResponse(res, 'Refill status retrieved', {
      total: medications.length,
      needsRefill: needsRefill.length,
      medications: needsRefill.map((med) => ({
        id: med._id,
        name: med.name,
        remainingQuantity: med.remainingQuantity,
        refillThreshold: med.refillThreshold,
        isUrgent: med.remainingQuantity === 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addMedication,
  getMedications,
  getMedication,
  updateMedication,
  deleteMedication,
  checkRefillStatus,
};