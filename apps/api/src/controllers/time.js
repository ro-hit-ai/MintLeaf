const express = require('express');
const router = express.Router();
const TimeTracking = require('../models/TimeTracking');

// Create a new entry
router.post('/new', async (req, res) => {
  try {
    const { time, ticket, title, user, startTime, endTime } = req.body;
    console.log(req.body);

    const timeEntry = new TimeTracking({
      time: Number(time),
      title,
      userId: user,
      ticketId: ticket,
      startTime: startTime ? new Date(startTime) : Date.now(), // default to now
      endTime: endTime ? new Date(endTime) : null
    });

    await timeEntry.save();

    res.send({
      success: true,
      data: timeEntry
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      error: 'Failed to create time entry'
    });
  }
});

// Get all entries
router.get('/all', async (req, res) => {
  try {
    const timeEntries = await TimeTracking.find()
      .populate('userId', 'name email')
      .populate('ticketId', 'ticketNumber title');
    
    res.send({
      success: true,
      data: timeEntries
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      error: 'Failed to fetch time entries'
    });
  }
});

// Delete an entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedEntry = await TimeTracking.findByIdAndDelete(id);
    
    if (!deletedEntry) {
      return res.status(404).send({
        success: false,
        error: 'Time entry not found'
      });
    }
    
    res.send({
      success: true,
      message: 'Time entry deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      error: 'Failed to delete time entry'
    });
  }
});

module.exports = router;
