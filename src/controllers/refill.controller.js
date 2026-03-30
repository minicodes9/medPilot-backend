const RefillRequest = require('../models/refillRequest.model');
const Medication = require('../models/medications.model');
const User = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/response');
const { sendRefillConfirmation } = require('../services/email.service');


// ── CREATE REFILL REQUEST ────────────────────────────────
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
      quantity: Number(quantity), // ✅ ensure number
      isUrgent: isUrgent ?? med.remainingQuantity === 2,
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


// ── GET ALL REFILL REQUESTS ──────────────────────────────
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


// ── GET SINGLE REFILL REQUEST ────────────────────────────
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


// ── CANCEL REFILL REQUEST ────────────────────────────────
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

const updateRefillRequest = async (req, res, next) => {
  try {
    const refillRequest = await RefillRequest.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!refillRequest) {
      return errorResponse(res, 'Refill request not found', 404);
    }

    if (refillRequest.status !== 'pending') {
      return errorResponse(res, 'Only pending requests can be updated', 400);
    }

    // ── Whitelist allowed fields ──────────────────────────
    const allowedFields = [
      'pharmacyName',
      'pharmacyAddress',
      'pharmacyPhone',
      'quantity',
      'isUrgent',
      'notes',
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (updateData.quantity) {
      updateData.quantity = Number(updateData.quantity);
    }

    const updated = await RefillRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after' }
    ).populate('medication', 'name dosage');

    return successResponse(res, 'Refill request updated', updated);
  } catch (error) {
    next(error);
  }
};

//  update refill request status (admin only, with medication restock and confirmation email on completion)
const updateRefillStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const allowedTransitions = {
      pending: ['approved', 'rejected'],
      approved: ['completed', 'rejected'],
    };

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

    const updatedRequest = await RefillRequest.findOneAndUpdate(
      { _id: req.params.id, status: currentStatus },
      { status },
      { returnDocument: 'after' }
    ).populate('medication', 'name');

    if (!updatedRequest) {
      return errorResponse(res, 'Update conflict, please try again', 409);
    }

    // ── IF COMPLETED → RESTOCK MEDICATION ────────────────
    if (status === 'completed') {
      const medicationId = updatedRequest.medication?._id;
      const quantityToAdd = Number(updatedRequest.quantity);

      if (!medicationId) {
        return errorResponse(res, 'Medication ID missing', 500);
      }

      if (isNaN(quantityToAdd)) {
        return errorResponse(res, 'Invalid quantity', 400);
      }

      await Medication.updateOne(
        { _id: medicationId },
        { $inc: { remainingQuantity: quantityToAdd } }
      );

      console.log(`✅ Restocked ${quantityToAdd} pills for medication ${medicationId}`);

      // ── SEND CONFIRMATION EMAIL ───────────────────────
      const user = await User.findById(updatedRequest.user).lean();

      if (user) {
        await sendRefillConfirmation({
          to: user.email,
          name: user.name,
          medicationName: updatedRequest.medication.name,
          pharmacyName: updatedRequest.pharmacyName,
        });

        console.log(`📧 Refill confirmation sent to ${user.email}`);
      }
    }

    return successResponse(res, 'Refill request updated', updatedRequest);
  } catch (error) {
    console.error('❌ Error updating refill:', error);
    next(error);
  }
};


module.exports = {
  createRefillRequest,
  getRefillRequests,
  getRefillRequest,
  cancelRefillRequest,
  updateRefillRequest,
  updateRefillStatus,
};