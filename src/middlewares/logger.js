const fs = require('fs');
const path = require('path');

const logger = (req, res, next) => {
  const start = Date.now();
  const ip = req.ip;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} from ${ip} - ${duration}ms\n`;

    console.log(log);

    
    fs.appendFileSync(path.join(__dirname, '../logs/access.log'), log);
  });

  next();
};

module.exports = logger;