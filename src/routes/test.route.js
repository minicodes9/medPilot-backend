const express = require('express');
const router = express.Router();
const Medication = require('../models/medications.model');
const DoseLog = require('../models/doseLog.model');
const {
  sendDoseReminder,
  sendRefillAlert,
} = require('../services/email.service');

// ── TEST DOSE REMINDER ───────────────────────────────────
router.post('/test-reminder', async (req, res) => {
  try {
    const medications = await Medication.find({ isActive: true })
      .populate('user', 'name email')
      .lean();

    for (const med of medications) {
      await sendDoseReminder({
        to: med.user.email,
        name: med.user.name,
        medicationName: med.name,
        dosage: med.dosage,
        time: new Date().toTimeString().slice(0, 5),
      });
    }

    res.json({ success: true, message: `Reminders sent for ${medications.length} medications` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── TEST REFILL ALERT ────────────────────────────────────
router.post('/test-refill-alert', async (req, res) => {
  try {
    const medications = await Medication.find({
      isActive: true,
      $expr: { $lte: ['$remainingQuantity', '$refillThreshold'] },
    })
      .populate('user', 'name email')
      .lean();

    for (const med of medications) {
      await sendRefillAlert({
        to: med.user.email,
        name: med.user.name,
        medicationName: med.name,
        remainingQuantity: med.remainingQuantity,
      });
    }

    res.json({ success: true, message: `Refill alerts sent for ${medications.length} medications` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── TEST MISSED DOSES ────────────────────────────────────
router.post('/test-missed-doses', async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const end = new Date(yesterday);
    end.setHours(23, 59, 59, 999);

    const medications = await Medication.find({ isActive: true }).lean();
    const logs = await DoseLog.find({
      scheduledTime: { $gte: yesterday, $lte: end },
    }).lean();

    const loggedSet = new Set(
      logs.map((log) => `${log.user}-${log.medication}-${log.scheduledTime}`)
    );

    const bulkOps = [];

    for (const med of medications) {
      for (const time of med.times) {
        const [h, m] = time.split(':');
        const scheduledTime = new Date(yesterday);
        scheduledTime.setHours(+h, +m, 0, 0);
        const key = `${med.user}-${med._id}-${scheduledTime}`;
        if (!loggedSet.has(key)) {
          bulkOps.push({
            insertOne: {
              document: {
                user: med.user,
                medication: med._id,
                scheduledTime,
                status: 'missed',
              },
            },
          });
        }
      }
    }

    if (bulkOps.length) {
      await DoseLog.bulkWrite(bulkOps);
    }

    res.json({ success: true, message: `${bulkOps.length} missed doses marked` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;