const express = require('express');
const router = express.Router();

const {
  createRefillRequest,
  getRefillRequests,
  getRefillRequest,
  cancelRefillRequest,
  updateRefillStatus,
} = require('../controllers/refill.controller');

const { protect, adminOnly } = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validateRequest');
const validateObjectId = require('../middlewares/validateObjectID');

const {
  createRefillSchema,
  updateRefillStatusSchema,
} = require('../validations/refill.validation');


router.use(protect);

// COLLECTION ROUTES 
router
  .route('/')
  .get(getRefillRequests)
  .post(validateRequest(createRefillSchema), createRefillRequest);

//SINGLE RESOURCE ROUTES
router
  .route('/:id')
  .get(validateObjectId, getRefillRequest)
  .delete(validateObjectId, cancelRefillRequest);

// STATUS UPDATE (ADMIN ONLY) 
router
  .route('/:id/status')
  .put(
    validateObjectId,
    adminOnly,
    validateRequest(updateRefillStatusSchema),
    updateRefillStatus
  );

module.exports = router;