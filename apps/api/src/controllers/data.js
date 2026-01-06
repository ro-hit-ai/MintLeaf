// src/controllers/data.js
const express = require('express');
const path = require('path'); // ← ADD THIS
const fs = require('fs').promises;
const logger = require('../lib/logger');

const router = express.Router();

router.get('/logs', async (req, res) => {
  try {
    const logDir = process.cwd();
    const files = await fs.readdir(logDir);

    // Find latest log file: logs-YYYY-MM-DD.log or logs.log
    const logFiles = files
      .filter(f => /^logs(-[0-9]{4}-[0-9]{2}-[0-9]{2})?\.log$/.test(f))
      .sort()
      .reverse();

    if (logFiles.length === 0) {
      return res.json({ logs: "", success: true });
    }

    const latestFile = path.join(logDir, logFiles[0]); // ← NOW WORKS
    const logs = await fs.readFile(latestFile, 'utf-8');

    res.json({ logs, success: true });
  } catch (error) {
    logger.error("Failed to read log file: " + error.message);
    res.status(500).json({
      success: false,
      message: "Could not read log file",
      error: error.message
    });
  }
});

module.exports = router;