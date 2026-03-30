const express = require('express');
const router = express.Router();
const {
  logDose,
  getDoseLogs,
  getDoseLog,
  updateDoseLog,
  deleteDoseLog,
} = require('../controllers/dose.controller');
const { protect, patientOnly } = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validateRequest');
const validateObjectId = require('../middlewares/validateObjectID');
const { logDoseSchema } = require('../validations/dose.validation');

// ── GLOBAL MIDDLEWARE ────────────────────────────────────
router.use(protect);

// ── COLLECTION ROUTES ────────────────────────────────────
router
  .route('/')
  .get(getDoseLogs)
  .post(patientOnly, validateRequest(logDoseSchema), logDose);

// ── SINGLE RESOURCE ROUTES ───────────────────────────────
router
  .route('/:id')
  .get(validateObjectId, getDoseLog)
  .put(validateObjectId, patientOnly, validateRequest(logDoseSchema), updateDoseLog)
  .delete(validateObjectId, patientOnly, deleteDoseLog);

module.exports = router;