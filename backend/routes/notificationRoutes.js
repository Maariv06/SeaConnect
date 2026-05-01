// backend/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// =====================================
// GET NOTIFICATIONS FOR A USER
// =====================================
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0, type, unreadOnly } = req.query;

    // Build query
    let query = { 
      userId, 
      isDeleted: false,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    };

    // Filter by type
    if (type && type !== "all") {
      query.type = type;
    }

    // Filter unread only
    if (unreadOnly === "true") {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: skip + notifications.length < total
      },
      unreadCount
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message
    });
  }
});

// =====================================
// MARK NOTIFICATION AS READ
// =====================================
router.put("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });

  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notification",
      error: error.message
    });
  }
});

// =====================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================
router.put("/mark-all-read/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: "All notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notifications",
      error: error.message
    });
  }
});

// =====================================
// DELETE NOTIFICATION (Soft Delete)
// =====================================
router.delete("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    await notification.softDelete();

    res.json({
      success: true,
      message: "Notification deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message
    });
  }
});

// =====================================
// CLEAR ALL NOTIFICATIONS (Soft Delete All)
// =====================================
router.delete("/clear-all/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.clearAll(userId);

    res.json({
      success: true,
      message: "All notifications cleared",
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing notifications",
      error: error.message
    });
  }
});

// =====================================
// GET UNREAD COUNT FOR USER
// =====================================
router.get("/unread-count/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Error getting unread count",
      error: error.message
    });
  }
});

// =====================================
// CREATE NOTIFICATION (Helper function for other routes)
// =====================================
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return { success: true, data: notification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: error.message };
  }
};

// Export the createNotification function for use in other routes
router.createNotification = createNotification;

module.exports = router;