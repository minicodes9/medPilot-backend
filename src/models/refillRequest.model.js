const mongoose = require('mongoose');

const refillRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },

    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      required: [true, 'Medication is required'],
    },

    pharmacyName: {
      type: String,
      required: [true, 'Pharmacy name is required'],
      trim: true,
    },

    pharmacyAddress: {
      type: String,
      trim: true,
    },

    pharmacyPhone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, 'Please use a valid phone number'],
    },

    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },

    isUrgent: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      trim: true,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//  Prevent duplicate active requests
refillRequestSchema.index(
  { user: 1, medication: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'approved'] } },
  }
);

//  Other indexes
refillRequestSchema.index({ user: 1 });
refillRequestSchema.index({ user: 1, status: 1 });
refillRequestSchema.index({ user: 1, medication: 1 });

//  Pre-save logic
refillRequestSchema.pre('save', function () {
  if (this.status === 'completed') {
    if (!this.completedAt) this.completedAt = new Date();
  } else {
    this.completedAt = undefined;
  };
});

//  Virtual: days since request
refillRequestSchema.virtual('daysSinceRequest').get(function () {
  if (!this.requestedAt) return 0;
  const diff = Date.now() - this.requestedAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

const RefillRequest = mongoose.model('RefillRequest', refillRequestSchema);

module.exports = RefillRequest;