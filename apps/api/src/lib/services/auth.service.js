const express = require('express');
const EmailQueue = require('../../models/EmailQueue');
// import EmailQueue from "../../models/EmailQueue.js";
const AuthService = require('./services/authService');
const { requirePermission } = require('../lib/roles');
const { checkSession } = require('../lib/session');

const router = express.Router();

// Get all email queues
router.get(
  '/api/v1/email-queues',
  requirePermission(['email::read']),
  async (req, res) => {
    try {
      const queues = await EmailQueue.find({}).sort({ createdAt: -1 });

      res.status(200).json({
        queues,
        success: true
      });

    } catch (error) {
      console.error('Error fetching email queues:', error);
      res.status(500).json({
        message: 'Internal Server Error',
        success: false
      });
    }
  }
);

// Create email queue
router.post(
  '/api/v1/email-queues',
  requirePermission(['email::create']),
  async (req, res) => {
    try {
      const user = await checkSession(req);
      const {
        serviceType,
        username,
        hostname,
        password,
        clientId,
        clientSecret,
        refreshToken,
        tls
      } = req.body;

      if (!serviceType || !username || !hostname) {
        return res.status(400).json({
          message: 'Service type, username, and hostname are required',
          success: false
        });
      }

      if (serviceType === 'gmail' && (!clientId || !clientSecret || !refreshToken)) {
        return res.status(400).json({
          message: 'Client ID, Client Secret, and Refresh Token are required for Gmail',
          success: false
        });
      }

      if (serviceType === 'other' && !password) {
        return res.status(400).json({
          message: 'Password is required for non-Gmail services',
          success: false
        });
      }

      const queue = new EmailQueue({
        serviceType,
        username,
        hostname,
        password: password || '',
        clientId: clientId || '',
        clientSecret: clientSecret || '',
        refreshToken: refreshToken || '',
        tls: tls !== undefined ? tls : true
      });

      await queue.save();

      res.status(201).json({
        message: 'Email queue created successfully',
        success: true,
        queue
      });

    } catch (error) {
      console.error('Error creating email queue:', error);
      res.status(500).json({
        message: 'Internal Server Error',
        success: false
      });
    }
  }
);

// Test email queue configuration
router.post(
  '/api/v1/email-queues/:id/test',
  requirePermission(['email::update']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const queue = await EmailQueue.findById(id);
      
      if (!queue) {
        return res.status(404).json({
          message: 'Email queue not found',
          success: false
        });
      }

      try {
        const config = await AuthService.getEmailConfig(queue);
        
        res.status(200).json({
          message: 'Email configuration test successful',
          success: true,
          config: {
            ...config,
            password: config.password ? '***' : undefined,
            xoauth2: config.xoauth2 ? '***' : undefined
          }
        });

      } catch (error) {
        res.status(400).json({
          message: `Email configuration test failed: ${error.message}`,
          success: false
        });
      }

    } catch (error) {
      console.error('Error testing email queue:', error);
      res.status(500).json({
        message: 'Internal Server Error',
        success: false
      });
    }
  }
);

// Refresh OAuth2 token
router.post(
  '/api/v1/email-queues/:id/refresh-token',
  requirePermission(['email::update']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const queue = await EmailQueue.findById(id);
      
      if (!queue) {
        return res.status(404).json({
          message: 'Email queue not found',
          success: false
        });
      }

      if (queue.serviceType !== 'gmail') {
        return res.status(400).json({
          message: 'Token refresh is only available for Gmail services',
          success: false
        });
      }

      try {
        const accessToken = await AuthService.getValidAccessToken(queue);
        
        res.status(200).json({
          message: 'Token refreshed successfully',
          success: true,
          accessToken: '***' // Don't expose the actual token
        });

      } catch (error) {
        res.status(400).json({
          message: `Token refresh failed: ${error.message}`,
          success: false
        });
      }

    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).json({
        message: 'Internal Server Error',
        success: false
      });
    }
  }
);

// Update email queue
router.put(
  '/api/v1/email-queues/:id',
  requirePermission(['email::update']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        serviceType,
        username,
        hostname,
        password,
        clientId,
        clientSecret,
        refreshToken,
        tls,
        active
      } = req.body;

      const queue = await EmailQueue.findById(id);
      
      if (!queue) {
        return res.status(404).json({
          message: 'Email queue not found',
          success: false
        });
      }

      if (serviceType) queue.serviceType = serviceType;
      if (username) queue.username = username;
      if (hostname) queue.hostname = hostname;
      if (password !== undefined) queue.password = password;
      if (clientId !== undefined) queue.clientId = clientId;
      if (clientSecret !== undefined) queue.clientSecret = clientSecret;
      if (refreshToken !== undefined) queue.refreshToken = refreshToken;
      if (tls !== undefined) queue.tls = tls;
      if (active !== undefined) queue.active = active;
      
      queue.updatedAt = new Date();

      await queue.save();

      res.status(200).json({
        message: 'Email queue updated successfully',
        success: true,
        queue
      });

    } catch (error) {
      console.error('Error updating email queue:', error);
      res.status(500).json({
        message: 'Internal Server Error',
        success: false
      });
    }
  }
);

// Delete email queue
router.delete(
  '/api/v1/email-queues/:id',
  requirePermission(['email::delete']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const queue = await EmailQueue.findByIdAndDelete(id);
      
      if (!queue) {
        return res.status(404).json({
          message: 'Email queue not found',
          success: false
        });
      }

      res.status(200).json({
        message: 'Email queue deleted successfully',
        success: true
      });

    } catch (error) {
      console.error('Error deleting email queue:', error);
      res.status(500).json({
        message: 'Internal Server Error',
        success: false
      });
    }
  }
);

module.exports = router;