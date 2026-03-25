const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },

    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
    },

    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
    },

    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      enum: [
        'once_daily',
        'twice_daily',
        'three_times_daily',
        'weekly',
        'as_needed',
      ],
    },

    times: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one time is required',
      },
    },

    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || value >= this.startDate;
        },
        message: 'End date must be after start date',
      },
    },

    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },

    remainingQuantity: {
      type: Number,
      min: [0, 'Remaining quantity cannot be negative'],
    },

    refillThreshold: {
      type: Number,
      default: 7,
    },

    instructions: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//  Pre-save hook
medicationSchema.pre('save', function (next) {
  if (this.isNew) {
    this.remainingQuantity = this.quantity;
  }

  if (this.remainingQuantity > this.quantity) {
    this.remainingQuantity = this.quantity;
  }

  next();
});

//  Virtual: refill status
medicationSchema.virtual('needsRefill').get(function () {
  return this.remainingQuantity <= this.refillThreshold;
});

//  Indexes
medicationSchema.index({ user: 1 });
medicationSchema.index({ user: 1, isActive: 1 });
medicationSchema.index({ user: 1, name: 1 }, { unique: true });

const Medication = mongoose.model('Medication', medicationSchema);

module.exports = Medication;