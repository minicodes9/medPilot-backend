const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

// Middleware
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Routes
const authRoutes = require('./routes/auth.route');
const medicationRoutes = require('./routes/medication.route');
const doseRoutes = require('./routes/dose.route');
const refillRoutes = require('./routes/refill.route');
const dashboardRoutes = require('./routes/dashboard.route');

const app = express();

// -----------------------------
// Logs folder setup
// -----------------------------
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Ensure error.log exists
const errorLogPath = path.join(logsDir, 'error.log');
if (!fs.existsSync(errorLogPath)) {
  fs.writeFileSync(errorLogPath, '');
}

// Access log stream
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// -----------------------------
// Logging
// -----------------------------
// Log to console
app.use(morgan('dev'));
// Log to file
app.use(morgan('combined', { stream: accessLogStream }));

// -----------------------------
// Security & Proxy
// -----------------------------
app.set('trust proxy', 1); // correct client IP behind proxy
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);

// -----------------------------
// Rate limiting
// -----------------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/auth', limiter);

// -----------------------------
// Body parser
// -----------------------------
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// -----------------------------
// Health check
// -----------------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MedPilot API is running',
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// -----------------------------
// Routes
// -----------------------------
app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/doses', doseRoutes);
app.use('/api/refills', refillRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── TEST ROUTES (DEVELOPMENT ONLY) ───────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use('/api/test', require('./routes/test.route'));
}

// -----------------------------
// 404 Handler
// -----------------------------
app.use(notFound);

// -----------------------------
// Error Logging Middleware
// -----------------------------
app.use((err, req, res, next) => {
  // Write error to error.log in project root logs folder
  const errorLogStream = fs.createWriteStream(
    path.join(logsDir, 'error.log'),
    { flags: 'a' }
  );

  const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.url} - ${err.stack}\n`;
  errorLogStream.write(logMessage); // write to file
  console.error(logMessage);        // also print to console

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;

