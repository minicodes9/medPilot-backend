const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ message: "MedPilot API is running" });
});

module.exports = app;