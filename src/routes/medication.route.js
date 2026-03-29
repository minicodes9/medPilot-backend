const express = require('express');
const router = express.Router();
const {
  addMedication,
  getMedications,
  getMedication,
  updateMedication,
  deleteMedication,
  checkRefillStatus,
} = require('../controllers/medication.controller');
const { protect, patientOnly } = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validateRequest');
const validateObjectId = require('../middlewares/validateObjectID');
const {
  addMedicationSchema,
  updateMedicationSchema,
} = require('../validations/medication.validation');

// ── PROTECT ALL ROUTES ───────────────────────────────────
router.use(protect);

// ── SPECIAL ROUTES ───────────────────────────────────────
router.get('/refill-status', checkRefillStatus);

// ── COLLECTION ROUTES ────────────────────────────────────
router
  .route('/')
  .get(getMedications)
  .post(patientOnly, validateRequest(addMedicationSchema), addMedication);

// ── SINGLE RESOURCE ROUTES ───────────────────────────────
router
  .route('/:id')
  .get(validateObjectId, getMedication)
  .put(validateObjectId, patientOnly, validateRequest(updateMedicationSchema), updateMedication)
  .delete(validateObjectId, patientOnly, deleteMedication);

module.exports = router;