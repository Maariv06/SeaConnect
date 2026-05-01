// pages/Notifications.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Notifications.css";

const API = "http://localhost:5000/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Get user from localStorage on component mount
  useEffect(() => {
    const getUserData = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsLoggedIn(true);
        } catch (e) {
          console.error("Error parsing user:", e);
        }
      }
    };
    
    getUserData();
  }, []);

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchNotifications();
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get userId from user object
      const userId = user?._id || user?.id;
      console.log("Fetching notifications for user ID:", userId);
      
      if (!userId) {
        console.log("No user ID available");
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem("token");
      
      // Build URL based on filter
      let url = `${API}/notifications/user/${userId}?limit=100`;
      if (filter === "unread") {
        url += "&unreadOnly=true";
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      
      console.log("Notifications response:", response.data);
      
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unreadCount || 0);
      } else {
        setError(response.data.message || "Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(error.response?.data?.message || "Error loading notifications");
      
      // Load from localStorage for demo if backend not available
      const savedNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
      if (savedNotifications.length > 0) {
        setNotifications(savedNotifications);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    setUpdating(prev => ({ ...prev, [notificationId]: true }));
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${API}/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      
      if (response.data.success) {
        setNotifications(prevNotifications =>
          prevNotifications.map(notif =>
            notif._id === notificationId
              ? { ...notif, read: true, readAt: new Date() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setUpdating(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = user?._id || user?.id;
      const token = localStorage.getItem("token");
      
      const response = await axios.put(`${API}/notifications/mark-all-read/${userId}`, {}, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      
      if (response.data.success) {
        setNotifications(prevNotifications =>
          prevNotifications.map(notif => ({ ...notif, read: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      alert("Failed to mark all as read");
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm("Delete this notification?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${API}/notifications/${notificationId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      
      if (response.data.success) {
        const deletedNotification = notifications.find(n => n._id === notificationId);
        setNotifications(prevNotifications =>
          prevNotifications.filter(notif => notif._id !== notificationId)
        );
        
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("Failed to delete notification");
    }
  };

  const getFilteredNotifications = () => {
    if (filter === "unread") {
      return notifications.filter(n => !n.read);
    } else if (filter === "read") {
      return notifications.filter(n => n.read);
    }
    return notifications;
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      "order_placed": "📦",
      "order_cancelled": "❌",
      "order_status_changed": "🔄",
      "order_delivered": "✅",
      "payment_success": "💰",
      "payment_failed": "⚠️",
      "payment_received": "💵",
      "auction_created": "🔨",
      "auction_approved": "✅",
      "auction_rejected": "❌",
      "auction_updated": "✏️",
      "auction_started": "🚀",
      "auction_ended": "🏁",
      "auction_won": "🏆",
      "auction_lost": "😢",
      "outbid": "📈",
      "auction_completed": "✓",
      "listing_created": "🐟",
      "listing_verified": "✓",
      "listing_rejected": "❌",
      "listing_sold": "💵",
      "wallet_credited": "💰",
      "wallet_debited": "💸",
      "welcome": "👋",
      "account_updated": "⚙️",
      "password_changed": "🔒",
      "system_update": "🔔"
    };
    return iconMap[type] || "📢";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const filteredNotifications = getFilteredNotifications();

  // Show loading state
  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  // Check if user is logged in
  if (!isLoggedIn || !user) {
    return (
      <div className="notifications-error">
        <div className="error-container">
          <span className="error-icon">🔒</span>
          <h3>Please Login</h3>
          <p>You need to be logged in to view your notifications</p>
          <button onClick={() => window.location.href = "/"} className="retry-btn">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="notifications-error">
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <h3>Error loading notifications</h3>
          <p>{error}</p>
          <button onClick={fetchNotifications} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="header-left">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>
        
        <div className="header-actions">
          {notifications.length > 0 && unreadCount > 0 && (
            <button className="mark-all-btn" onClick={markAllAsRead}>
              Mark all as read
            </button>
          )}
          
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => {
                setFilter("all");
                fetchNotifications();
              }}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === "unread" ? "active" : ""}`}
              onClick={() => {
                setFilter("unread");
                fetchNotifications();
              }}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              className={`filter-btn ${filter === "read" ? "active" : ""}`}
              onClick={() => {
                setFilter("read");
                fetchNotifications();
              }}
            >
              Read
            </button>
          </div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-notifications">
          <span className="empty-icon">🔔</span>
          <h3>No notifications yet</h3>
          <p>When you receive notifications, they'll appear here</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-filtered">
              <p>No {filter} notifications found</p>
              {filter !== "all" && (
                <button onClick={() => setFilter("all")} className="view-all-btn">
                  View all notifications
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification._id}
                className={`notification-item ${!notification.read ? "unread" : ""}`}
                onClick={() => !notification.read && markAsRead(notification._id)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h3 className="notification-title">{notification.title}</h3>
                    <span className="notification-time">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  {notification.data && Object.keys(notification.data).length > 0 && (
                    <div className="notification-details">
                      {notification.data.amount && (
                        <span className="detail-amount">₹{notification.data.amount}</span>
                      )}
                      {notification.data.fishType && (
                        <span className="detail-fish">{notification.data.fishType}</span>
                      )}
                      {notification.data.quantity && (
                        <span className="detail-quantity">{notification.data.quantity} kg</span>
                      )}
                    </div>
                  )}
                  
                  {notification.actionUrl && (
                    <a href={notification.actionUrl} className="notification-action">
                      View Details →
                    </a>
                  )}
                </div>
                
                <button
                  className="delete-notification"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification._id);
                  }}
                  title="Delete notification"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;