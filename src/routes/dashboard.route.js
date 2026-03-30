const express = require('express');
const router = express.Router();

const {
  getDashboard,
  getAdherenceHistory,
} = require('../controllers/dashboard.controller');

const { protect } = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validateRequest');
const { adherenceQuerySchema } = require('../validations/dashboard.validation');


router.use(protect);

//  DASHBOARD ROUTES 
router.get('/', getDashboard);

router.get(
  '/adherence-history',
  validateRequest(adherenceQuerySchema),
  getAdherenceHistory
);

module.exports = router;