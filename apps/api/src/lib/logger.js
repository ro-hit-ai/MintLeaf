// src/lib/logger.js
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack }) => {
    return JSON.stringify({
      time: new Date(timestamp).getTime(),
      level,
      msg: stack || message,
    });
  })
);

const logger = createLogger({
  format: logFormat,
  transports: [
    // Always write to logs.log (for frontend)
    new transports.File({
      filename: 'logs.log',
      dirname: '.',
    }),
    // Daily rotated logs
    new transports.DailyRotateFile({
      filename: 'logs-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      dirname: '.',
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'exceptions.log' }),
  ],
});

module.exports = logger;