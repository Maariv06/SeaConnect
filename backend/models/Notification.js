// backend/models/Notification.js

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        // Order notifications
        "order_placed",
        "order_cancelled",
        "order_status_changed",
        "order_delivered",
        
        // Payment notifications
        "payment_success",
        "payment_failed",
        "payment_received",
        
        // Auction notifications
        "auction_created",
        "auction_approved",
        "auction_rejected",
        "auction_updated",        // ✅ ADD THIS
        "auction_started",
        "auction_ended",
        "auction_won",
        "auction_lost",
        "outbid",
        "auction_completed",
        
        // Fish listing notifications
        "listing_created",
        "listing_verified",
        "listing_rejected",
        "listing_sold",
        
        // Wallet notifications
        "wallet_credited",
        "wallet_debited",
        
        // System notifications
        "welcome",
        "account_updated",
        "password_changed",
        "system_update"
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    data: {
      type: Object,
      default: {}
    },

    read: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedAt: {
      type: Date
    },

    actionUrl: {
      type: String,
      default: null
    },

    image: {
      type: String,
      default: null
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    expiresAt: {
      type: Date,
      default: null
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for faster queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.read = false;
  this.readAt = null;
  return this.save();
};

// Method to soft delete
notificationSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ 
    userId, 
    read: false, 
    isDeleted: false,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, read: false, isDeleted: false },
    { $set: { read: true, readAt: new Date() } }
  );
};

// Static method to clear all (soft delete)
notificationSchema.statics.clearAll = function(userId) {
  return this.updateMany(
    { userId, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );
};

module.exports = mongoose.model("Notification", notificationSchema);