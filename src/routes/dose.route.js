const express = require('express');
const router = express.Router();

const {
  logDose,
  getDoseLogs,
  getDoseLog,
  updateDoseLog,
  deleteDoseLog,
} = require('../controllers/dose.controller');

const { protect } = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validateRequest');
const validateObjectId = require('../middlewares/validateObjectID');
const { logDoseSchema } = require('../validations/dose.validation');
router.use(protect);

//  COLLECTION ROUTES 
router
  .route('/')
  .get(getDoseLogs) 
  .post(validateRequest(logDoseSchema), logDose);

// SINGLE RESOURCE ROUTES 
router
  .route('/:id')
  .get(validateObjectId, getDoseLog)
  .put(
    validateObjectId,
    validateRequest(logDoseSchema),
    updateDoseLog
  )
  .delete(validateObjectId, deleteDoseLog);

module.exports = router;