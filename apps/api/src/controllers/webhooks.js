const express = require('express');
const mongoose = require('mongoose');
const { track } = require('../lib/hog');
const { requirePermission } = require('../lib/roles');
const { checkSession } = require('../lib/session');
const Webhook = require('../models/Webhook');

const router = express.Router();

 // Mongoose model

// Create a new webhook
router.post(
  '/api/v1/webhook/create',
  requirePermission(['webhook::create']),
  async (req, res) => {
    try {
      const user = await checkSession(req);
      const { name, url, type, active, secret } = req.body;

      const webhook = new Webhook({
        name,
        url,
        type,
        active,
        secret,
        createdBy: user.id,
      });

      await webhook.save();

      const client = track();
      client.capture({
        event: 'webhook_created',
        distinctId: 'uuid',
      });
      client.shutdownAsync();

      res.status(200).json({ message: 'Hook created!', success: true });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error', success: false });
    }
  }
);

// Get all webhooks
router.get(
  '/api/v1/webhooks/all',
  requirePermission(['webhook::read']),
  async (req, res) => {
    try {
      const webhooks = await Webhook.find({});
      res.status(200).json({ webhooks, success: true });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error', success: false });
    }
  }
);

// Delete a webhook
router.delete(
  '/api/v1/admin/webhook/:id/delete',
  requirePermission(['webhook::delete']),
  async (req, res) => {
    try {
      const { id } = req.params;
      await Webhook.findByIdAndDelete(id);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error', success: false });
    }
  }
);

module.exports = router;
