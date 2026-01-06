const express = require('express');
const Notification = require('../../../models/Notification');
const Ticket = require('../../../models/Ticket');
const User = require('../../../models/User');

const router = express.Router();

// ==================== NOTIFICATION HELPER FUNCTIONS ====================

/**
 * Creates assignment notifications for all ticket followers.
 */
async function assignedNotification(assignee, ticket, assigner) {
  try {
    const text = `Ticket #${ticket.Number} was assigned to ${assignee.name} by ${assigner.name}`;

    const followers = [
      ...(ticket.following || []),
      ...(ticket.following && ticket.following.includes(ticket.createdBy.toString())
        ? []
        : [ticket.createdBy])
    ];

    const notificationData = followers
      .filter(userId => userId.toString() !== assigner._id.toString())
      .map(userId => ({
        text,
        userId,
        ticketId: ticket._id
      }));

    if (notificationData.length > 0) {
      await Notification.insertMany(notificationData);
    }

  } catch (error) {
    console.error("Error creating assignment notifications:", error);
    throw error;
  }
}

/**
 * Creates comment notifications for all ticket followers.
 */
async function commentNotification(issue, commenter) {
  try {
    const text = `New comment on #${issue.Number} by ${commenter.name}`;

    const followers = [
      ...(issue.following || []),
      ...(issue.following && issue.following.includes(issue.createdBy.toString())
        ? []
        : [issue.createdBy])
    ];

    const notificationData = followers
      .filter(userId => userId.toString() !== commenter._id.toString())
      .map(userId => ({
        text,
        userId,
        ticketId: issue._id
      }));

    if (notificationData.length > 0) {
      await Notification.insertMany(notificationData);
    }

  } catch (error) {
    console.error("Error creating comment notifications:", error);
    throw error;
  }
}

/**
 * Creates priority change notifications for all ticket followers.
 */
async function priorityNotification(issue, updatedBy, oldPriority, newPriority) {
  try {
    const text = `Priority changed on #${issue.Number} from ${oldPriority} to ${newPriority} by ${updatedBy.name}`;

    const followers = [
      ...(issue.following || []),
      ...(issue.following && issue.following.includes(issue.createdBy.toString())
        ? []
        : [issue.createdBy])
    ];

    const notificationData = followers
      .filter(userId => userId.toString() !== updatedBy._id.toString())
      .map(userId => ({
        text,
        userId,
        ticketId: issue._id
      }));

    if (notificationData.length > 0) {
      await Notification.insertMany(notificationData);
    }

  } catch (error) {
    console.error("Error creating priority change notifications:", error);
    throw error;
  }
}

/**
 * Creates active status change notifications for all ticket followers.
 */
async function activeStatusNotification(ticket, updater, newStatus) {
  try {
    const statusText = newStatus ? "Closed" : "Open";
    const text = `#${ticket.Number} status changed to ${statusText} by ${updater.name}`;

    const followers = [
      ...(ticket.following || []),
      ...(ticket.following && ticket.following.includes(ticket.createdBy.toString())
        ? []
        : [ticket.createdBy])
    ];

    const notificationData = followers
      .filter(userId => userId && updater && updater._id && userId.toString() !== updater._id.toString())
      .map(userId => ({
        text,
        userId,
        ticketId: ticket._id
      }));

    if (notificationData.length > 0) {
      await Notification.insertMany(notificationData);
    }

  } catch (error) {
    console.error("Error creating status change notifications:", error);
    throw error;
  }
}

/**
 * Creates status update notifications for all ticket followers.
 */
async function statusUpdateNotification(ticket, updater, newStatus) {
  try {
    const text = `#${ticket.Number} status changed to ${newStatus} by ${updater.name}`;

    const followers = [
      ...(ticket.following || []),
      ...(ticket.following && ticket.following.includes(ticket.createdBy.toString())
        ? []
        : [ticket.createdBy])
    ];

    const notificationData = followers
      .filter(userId => userId.toString() !== updater._id.toString())
      .map(userId => ({
        text,
        userId,
        ticketId: ticket._id
      }));

    if (notificationData.length > 0) {
      await Notification.insertMany(notificationData);
    }

  } catch (error) {
    console.error("Error creating status update notifications:", error);
    throw error;
  }
}

// ==================== ROUTE HANDLERS ====================

// Create assignment notification endpoint
router.post('/api/v1/notifications/assigned', async (req, res) => {
  try {
    const { assigneeId, ticketId, assignerId } = req.body;

    if (!assigneeId || !ticketId || !assignerId) {
      return res.status(400).json({
        message: 'Assignee ID, Ticket ID, and Assigner ID are required',
        success: false
      });
    }

    const [assignee, ticket, assigner] = await Promise.all([
      User.findById(assigneeId),
      Ticket.findById(ticketId).populate('createdBy', 'name'),
      User.findById(assignerId)
    ]);

    if (!assignee || !ticket || !assigner) {
      return res.status(404).json({
        message: 'Assignee, Ticket, or Assigner not found',
        success: false
      });
    }

    await assignedNotification(assignee, ticket, assigner);

    res.status(200).json({
      message: 'Assignment notifications created successfully',
      success: true
    });

  } catch (error) {
    console.error('Error creating assignment notifications:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false
    });
  }
});

// Create comment notification endpoint
router.post('/api/v1/notifications/comment', async (req, res) => {
  try {
    const { issueId, commenterId } = req.body;

    if (!issueId || !commenterId) {
      return res.status(400).json({
        message: 'Issue ID and Commenter ID are required',
        success: false
      });
    }

    const [issue, commenter] = await Promise.all([
      Ticket.findById(issueId).populate('createdBy', 'name'),
      User.findById(commenterId)
    ]);

    if (!issue || !commenter) {
      return res.status(404).json({
        message: 'Issue or Commenter not found',
        success: false
      });
    }

    await commentNotification(issue, commenter);

    res.status(200).json({
      message: 'Comment notifications created successfully',
      success: true
    });

  } catch (error) {
    console.error('Error creating comment notifications:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false
    });
  }
});

// Create priority change notification endpoint
router.post('/api/v1/notifications/priority-change', async (req, res) => {
  try {
    const { issueId, updatedById, oldPriority, newPriority } = req.body;

    if (!issueId || !updatedById || !oldPriority || !newPriority) {
      return res.status(400).json({
        message: 'Issue ID, Updated By ID, Old Priority, and New Priority are required',
        success: false
      });
    }

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(oldPriority) || !validPriorities.includes(newPriority)) {
      return res.status(400).json({
        message: 'Invalid priority values. Must be one of: low, medium, high, critical',
        success: false
      });
    }

    const [issue, updatedBy] = await Promise.all([
      Ticket.findById(issueId).populate('createdBy', 'name'),
      User.findById(updatedById)
    ]);

    if (!issue || !updatedBy) {
      return res.status(404).json({
        message: 'Issue or User not found',
        success: false
      });
    }

    await priorityNotification(issue, updatedBy, oldPriority, newPriority);

    res.status(200).json({
      message: 'Priority change notifications created successfully',
      success: true
    });

  } catch (error) {
    console.error('Error creating priority change notifications:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false
    });
  }
});

// Create active status change notification endpoint
router.post('/api/v1/notifications/active-status-change', async (req, res) => {
  try {
    const { ticketId, updaterId, newStatus } = req.body;

    if (!ticketId || !updaterId || typeof newStatus !== 'boolean') {
      return res.status(400).json({
        message: 'Ticket ID, Updater ID, and New Status (boolean) are required',
        success: false
      });
    }

    const [ticket, updater] = await Promise.all([
      Ticket.findById(ticketId).populate('createdBy', 'name'),
      User.findById(updaterId)
    ]);

    if (!ticket || !updater) {
      return res.status(404).json({
        message: 'Ticket or User not found',
        success: false
      });
    }

    await activeStatusNotification(ticket, updater, newStatus);

    res.status(200).json({
      message: 'Active status change notifications created successfully',
      success: true
    });

  } catch (error) {
    console.error('Error creating active status change notifications:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false
    });
  }
});

// Create status update notification endpoint
router.post('/api/v1/notifications/status-update', async (req, res) => {
  try {
    const { ticketId, updaterId, newStatus } = req.body;

    if (!ticketId || !updaterId || !newStatus) {
      return res.status(400).json({
        message: 'Ticket ID, Updater ID, and New Status are required',
        success: false
      });
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        message: 'Invalid status value. Must be one of: open, in_progress, resolved, closed',
        success: false
      });
    }

    const [ticket, updater] = await Promise.all([
      Ticket.findById(ticketId).populate('createdBy', 'name'),
      User.findById(updaterId)
    ]);

    if (!ticket || !updater) {
      return res.status(404).json({
        message: 'Ticket or User not found',
        success: false
      });
    }

    await statusUpdateNotification(ticket, updater, newStatus);

    res.status(200).json({
      message: 'Status update notifications created successfully',
      success: true
    });

  } catch (error) {
    console.error('Error creating status update notifications:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false
    });
  }
});

// Get user notifications
router.get('/api/v1/notifications/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const notifications = await Notification.find({ userId })
      .populate('ticketId', 'Number title status')
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      notifications,
      success: true
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false
    });
  }
});

// Mark notification as read
router.patch('/api/v1/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true, updatedAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found',
        success: false
      });
    }

    res.status(200).json({
      message: 'Notification marked as read',
      success: true,
      notification
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false
    });
  }
});

// Mark all notifications as read for user
router.patch('/api/v1/notifications/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;

    await Notification.updateMany(
      { userId, read: false },
      { read: true, updatedAt: new Date() }
    );

    res.status(200).json({
      message: 'All notifications marked as read',
      success: true
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false
    });
  }
});

// Delete notification
router.delete('/api/v1/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found',
        success: false
      });
    }

    res.status(200).json({
      message: 'Notification deleted successfully',
      success: true
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      success: false
    });
  }
});

// ==================== EXPORTS ====================

module.exports = {
  router,
  assignedNotification,
  commentNotification,
  priorityNotification,
  activeStatusNotification,
  statusUpdateNotification
};