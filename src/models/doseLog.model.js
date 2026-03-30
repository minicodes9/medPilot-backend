const mongoose = require('mongoose');

const doseLogSchema = new mongoose.Schema(
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

    scheduledTime: {
      type: Date,
      required: [true, 'Scheduled time is required'],
    },

    takenAt: {
      type: Date,
      validate: {
        validator: function (value) {
          if (this.status === 'taken') return !!value;
          return true;
        },
        message: 'takenAt is required when status is taken',
      },
    },

    status: {
      type: String,
      enum: ['taken', 'skipped', 'missed'],
      required: [true, 'Status is required'],
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//  Prevent duplicate logs
doseLogSchema.index(
  { user: 1, medication: 1, scheduledTime: 1 },
  { unique: true }
);

//  Other indexes
doseLogSchema.index({ user: 1 });
doseLogSchema.index({ user: 1, status: 1 });
doseLogSchema.index({ scheduledTime: 1 });

//  Pre-save logic
doseLogSchema.pre('save', function () {
  if (this.status === 'taken') {
    if (!this.takenAt) this.takenAt = new Date();
  } else {
    this.takenAt = undefined;
  };
});

//  Virtual: taken on time
doseLogSchema.virtual('takenOnTime').get(function () {
  if (!this.takenAt || !this.scheduledTime) return null;

  const diff = Math.abs(this.takenAt - this.scheduledTime);
  return diff <= 30 * 60 * 1000;
});

const DoseLog = mongoose.model('DoseLog', doseLogSchema);

module.exports = DoseLog;