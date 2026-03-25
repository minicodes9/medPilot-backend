const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import middleware
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const logger = require('./middlewares/logger'); // make sure logger.js exists and exports a function

// Import routes
const authRoutes = require('./routes/auth.route');
const medicationRoutes = require('./routes/medication.route');
const doseRoutes = require('./routes/dose.route');
const refillRoutes = require('./routes/refill.route');
const dashboardRoutes = require('./routes/dashboard.route');

const app = express();

// ── GLOBAL MIDDLEWARE ────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(logger); // optional custom logger

// ── HEALTH CHECK ROUTE ───────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({ message: 'MedPilot API is running' });
});

// ── API ROUTES ───────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/doses', doseRoutes);
app.use('/api/refills', refillRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── 404 HANDLER ──────────────────────────────────────
app.use(notFound);

// ── ERROR HANDLER ───────────────────────────────────
app.use(errorHandler);

module.exports = app;