const RefillRequest = require('../models/refillRequest.model');
const Medication = require('../models/medications.model');
const User = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/response');
const { sendRefillConfirmation } = require('../services/email.service');

//  CREATE REFILL REQUEST 
const createRefillRequest = async (req, res, next) => {
  try {
    const {
      medication,
      pharmacyName,
      pharmacyAddress,
      pharmacyPhone,
      quantity,
      isUrgent,
      notes,
    } = req.body;

    const med = await Medication.findOne({
      _id: medication,
      user: req.user._id,
      isActive: true,
    }).lean();

    if (!med) {
      return errorResponse(res, 'Medication not found', 404);
    }

    const existingRequest = await RefillRequest.findOne({
      user: req.user._id,
      medication,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingRequest) {
      return errorResponse(
        res,
        'An active refill request already exists for this medication',
        409
      );
    }

    const refillRequest = await RefillRequest.create({
      user: req.user._id,
      medication,
      pharmacyName,
      pharmacyAddress,
      pharmacyPhone,
      quantity,
      isUrgent: isUrgent ?? med.remainingQuantity === 0,
      notes,
    });

    return successResponse(
      res,
      'Refill request submitted successfully',
      refillRequest,
      201
    );
  } catch (error) {
    next(error);
  }
};

// GET ALL REFILL REQUESTS 
const getRefillRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [refillRequests, total] = await Promise.all([
      RefillRequest.find(filter)
        .populate('medication', 'name dosage remainingQuantity')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      RefillRequest.countDocuments(filter),
    ]);

    return successResponse(res, 'Refill requests retrieved', {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: refillRequests,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE REFILL REQUEST 
const getRefillRequest = async (req, res, next) => {
  try {
    const refillRequest = await RefillRequest.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('medication', 'name dosage frequency remainingQuantity')
      .lean();

    if (!refillRequest) {
      return errorResponse(res, 'Refill request not found', 404);
    }

    return successResponse(res, 'Refill request retrieved', refillRequest);
  } catch (error) {
    next(error);
  }
};


// ── CANCEL REFILL REQUEST 

const cancelRefillRequest = async (req, res, next) => {
  try {
    const refillRequest = await RefillRequest.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!refillRequest) {
      return errorResponse(res, 'Refill request not found', 404);
    }

    if (refillRequest.status !== 'pending') {
      return errorResponse(
        res,
        `Cannot cancel a request that is ${refillRequest.status}`,
        400
      );
    }

    refillRequest.status = 'rejected';
    await refillRequest.save();

    return successResponse(res, 'Refill request cancelled');
  } catch (error) {
    next(error);
  }
};

// UPDATE REFILL STATUS 
const updateRefillStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const allowedTransitions = {
      pending: ['approved', 'rejected'],
      approved: ['completed', 'rejected'],
    };

    // Get current request
    const refillRequest = await RefillRequest.findById(req.params.id);

    if (!refillRequest) {
      return errorResponse(res, 'Refill request not found', 404);
    }

    const currentStatus = refillRequest.status;

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return errorResponse(
        res,
        `Cannot change status from ${currentStatus} to ${status}`,
        400
      );
    }

    //  Atomic update (prevents double execution)
    const updatedRequest = await RefillRequest.findOneAndUpdate(
      {
        _id: req.params.id,
        status: currentStatus, 
      },
      { status },
      { new: true }
    ).populate('medication', 'name');

    if (!updatedRequest) {
      return errorResponse(res, 'Update conflict, try again', 409);
    }

    //  If completed → update stock + send email
    if (status === 'completed') {
      await Medication.updateOne(
        { _id: updatedRequest.medication._id },
        { $inc: { remainingQuantity: updatedRequest.quantity } }
      );

      const user = await User.findById(updatedRequest.user).lean();

      if (user) {
        await sendRefillConfirmation({
          to: user.email,
          name: user.name,
          medicationName: updatedRequest.medication.name,
          pharmacyName: updatedRequest.pharmacyName,
        });

        console.log(`📧 Refill confirmation sent → ${user.email}`);
      }
    }

    return successResponse(res, 'Refill request updated', updatedRequest);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRefillRequest,
  getRefillRequests,
  getRefillRequest,
  cancelRefillRequest,
  updateRefillStatus,
};