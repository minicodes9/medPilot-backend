const cron = require('node-cron');
const Medication = require('../models/medications.model');
const DoseLog = require('../models/doseLog.model');
const {
  sendDoseReminder,
  sendRefillAlert,
} = require('./email.service');


// HELPER: GET TODAY RANGE 

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};


// DOSE REMINDERS 

const scheduleDoseReminders = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM

      const { start, end } = getTodayRange();

      //  Get medications + user in ONE query
      const medications = await Medication.find({
        isActive: true,
        times: currentTime,
      })
        .populate('user', 'name email')
        .lean();

      if (!medications.length) return;

      //  Get all logs for today in ONE query
      const logs = await DoseLog.find({
        scheduledTime: { $gte: start, $lte: end },
      }).lean();

      const loggedSet = new Set(
        logs.map(
          (log) => `${log.user}-${log.medication}-${currentTime}`
        )
      );

      for (const med of medications) {
        const key = `${med.user._id}-${med._id}-${currentTime}`;

        if (!loggedSet.has(key)) {
          await sendDoseReminder({
            to: med.user.email,
            name: med.user.name,
            medicationName: med.name,
            dosage: med.dosage,
            time: currentTime,
          });

          console.log(`⏰ Reminder sent → ${med.user.email}`);
        }
      }
    } catch (error) {
      console.error('❌ Dose reminder error:', error.message);
    }
  });
};


// REFILL ALERTS 

const scheduleRefillAlerts = () => {
  cron.schedule('0 8 * * *', async () => {
    try {
      const medications = await Medication.find({
        isActive: true,
        $expr: {
          $lte: ['$remainingQuantity', '$refillThreshold'],
        },
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

      console.log('📦 Refill alerts sent');
    } catch (error) {
      console.error('❌ Refill alert error:', error.message);
    }
  });
};


// MARK MISSED DOSES 

const scheduleMissedDoses = () => {
  cron.schedule('5 0 * * *', async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);

      const medications = await Medication.find({
        isActive: true,
      }).lean();

      const logs = await DoseLog.find({
        scheduledTime: { $gte: yesterday, $lte: end },
      }).lean();

      const loggedSet = new Set(
        logs.map(
          (log) =>
            `${log.user}-${log.medication}-${log.scheduledTime}`
        )
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

      console.log('📉 Missed doses processed');
    } catch (error) {
      console.error('❌ Missed dose error:', error.message);
    }
  });
};


// START SCHEDULERS 

let started = false;

const startSchedulers = () => {
  if (started) {
    console.log('⚠️ Schedulers already running');
    return;
  }

  scheduleDoseReminders();
  scheduleRefillAlerts();
  scheduleMissedDoses();

  started = true;

  console.log('🚀 All schedulers started');
};

module.exports = { startSchedulers };