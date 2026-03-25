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

const { protect } = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validateRequest');
const validateObjectId = require('../middlewares/validateObjectID');

const {
  addMedicationSchema,
  updateMedicationSchema,
} = require('../validations/medication.validation');

router.use(protect);

// SPECIAL ROUTES (place BEFORE /:id) 
router.get('/refill-status', checkRefillStatus);

//  COLLECTION ROUTES 
router
  .route('/')
  .get(getMedications)
  .post(validateRequest(addMedicationSchema), addMedication);

//SINGLE RESOURCE ROUTES 
router
  .route('/:id')
  .get(validateObjectId, getMedication)
  .put(
    validateObjectId,
    validateRequest(updateMedicationSchema),
    updateMedication
  )
  .delete(validateObjectId, deleteMedication);

module.exports = router;