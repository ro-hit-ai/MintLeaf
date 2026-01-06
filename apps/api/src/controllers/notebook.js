const express = require('express');
const { track } = require('../lib/hog');
const { requirePermission } = require('../lib/roles');
const { checkSession } = require('../lib/session');
const Note = require('../models/Note');

async function tracking(event, properties) {
  const client = track();
  client.capture({
    event,
    properties,
    distinctId: "uuid",
  });
  client.shutdownAsync();
}

const router = express.Router();

// Create a new entry
router.post(
  "/note/create",
  requirePermission(["document::create"]),
  async (req, res) => {
    try {
      const { content, title } = req.body;
      const user = await checkSession(req);

      const data = await Note.create({
        title,
        note: content,
        userId: user.id,
      });

      await tracking("note_created", {});
      res.status(200).json({ success: true, id: data._id });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get all entries
router.get(
  "/all",
  requirePermission(["document::read"]),
  async (req, res) => {
    try {
      const user = await checkSession(req);
      const notebooks = await Note.find({ userId: user.id });
      res.status(200).json({ success: true, notebooks });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get a single entry
router.get(
  "/note/:id",
  requirePermission(["document::read"]),
  async (req, res) => {
    try {
      const user = await checkSession(req);
      const { id } = req.params;
      const note = await Note.findOne({ _id: id, userId: user.id });
      if (!note) return res.status(404).json({ success: false, error: "Note not found" });
      res.status(200).json({ success: true, note });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Update an entry
router.put(
  "/note/:id/update",
  requirePermission(["document::update"]),
  async (req, res) => {
    try {
      const user = await checkSession(req);
      const { id } = req.params;
      const { content, title } = req.body;

      await Note.findOneAndUpdate(
        { _id: id, userId: user.id },
        { title, note: content },
        { new: true }
      );

      await tracking("note_updated", {});
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Delete an entry
router.delete(
  "/note/:id",
  requirePermission(["document::delete"]),
  async (req, res) => {
    try {
      const user = await checkSession(req);
      const { id } = req.params;

      await Note.findOneAndDelete({ _id: id, userId: user.id });

      await tracking("note_deleted", {});
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

module.exports = router; // ✅ export router directly
