// components/admin/AdminDashboard.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API = "http://localhost:5000/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalBuyers: 0,
    totalFish: 0,
    pendingFish: 0,
    verifiedFish: 0,
    rejectedFish: 0,
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    recentActivities: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching dashboard data...");
      
      // Fetch all data in parallel with correct endpoints
      const [usersRes, fishRes, ordersRes] = await Promise.all([
        axios.get(`${API}/auth/users`).catch(err => {
          console.error("Users API error:", err);
          return { data: { data: [] } };
        }),
        axios.get(`${API}/fish/all`).catch(err => {
          console.error("Fish API error:", err);
          return { data: { data: [] } };
        }),
        axios.get(`${API}/orders/all`).catch(err => {
          console.error("Orders API error:", err);
          return { data: { data: [] } };
        })
      ]);

      console.log("Users response:", usersRes.data);
      console.log("Fish response:", fishRes.data);
      console.log("Orders response:", ordersRes.data);

      // Extract data from responses (handle different response structures)
      let users = [];
      if (usersRes.data && usersRes.data.data) {
        users = usersRes.data.data;
      } else if (Array.isArray(usersRes.data)) {
        users = usersRes.data;
      } else if (usersRes.data && usersRes.data.users) {
        users = usersRes.data.users;
      }

      // Filter out admin users - ONLY SELLERS AND BUYERS
      const nonAdminUsers = users.filter(user => user.role !== "admin");
      const sellers = nonAdminUsers.filter(user => user.role === "seller");
      const buyers = nonAdminUsers.filter(user => user.role === "buyer");

      let fishPosts = [];
      if (fishRes.data && fishRes.data.data) {
        fishPosts = fishRes.data.data;
      } else if (Array.isArray(fishRes.data)) {
        fishPosts = fishRes.data;
      } else if (fishRes.data && fishRes.data.fish) {
        fishPosts = fishRes.data.fish;
      }

      let orders = [];
      if (ordersRes.data && ordersRes.data.data) {
        orders = ordersRes.data.data;
      } else if (Array.isArray(ordersRes.data)) {
        orders = ordersRes.data;
      }

      // Calculate user stats (excluding admins)
      const totalUsers = nonAdminUsers.length;
      const totalSellers = sellers.length;
      const totalBuyers = buyers.length;

      // Calculate fish stats
      const totalFish = fishPosts.length;
      const pendingFish = fishPosts.filter(f => f?.status === "Pending").length;
      const verifiedFish = fishPosts.filter(f => f?.status === "Verified").length;
      const rejectedFish = fishPosts.filter(f => f?.status === "Rejected").length;

      // Calculate order stats
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o?.status === "Pending").length;
      const deliveredOrders = orders.filter(o => o?.status === "Delivered").length;
      const cancelledOrders = orders.filter(o => o?.status === "Cancelled").length;

      // Create recent activities (excluding admin activities)
      const recentActivities = [
        ...fishPosts.slice(0, 3).map(f => ({
          type: "fish",
          message: `New fish listing: ${f.fishType || f.name || "Fish"} by ${f.sellerName || f.seller || "Unknown"}`,
          time: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "Recently",
          icon: "🐟"
        })),
        ...orders.slice(0, 3).map(o => ({
          type: "order",
          message: `New order for ${o.fishType || "fish"} from ${o.customerName || o.buyer || "Customer"}`,
          time: o.orderDate ? new Date(o.orderDate).toLocaleDateString() : "Recently",
          icon: "📦"
        })),
        ...nonAdminUsers.slice(0, 2).map(u => ({
          type: "user",
          message: `New ${u.role || "user"} registered: ${u.fullName || u.name || "Unknown"}`,
          time: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recently",
          icon: u.role === "seller" ? "👨‍🌾" : "🛒"
        }))
      ].sort((a, b) => {
        // Sort by date (newest first)
        if (a.time === "Recently") return -1;
        if (b.time === "Recently") return 1;
        return new Date(b.time) - new Date(a.time);
      }).slice(0, 5);

      setStats({
        totalUsers,
        totalSellers,
        totalBuyers,
        totalFish,
        pendingFish,
        verifiedFish,
        rejectedFish,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        recentActivities
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please refresh the page.");
      
      // Set empty data on error
      setStats({
        totalUsers: 0,
        totalSellers: 0,
        totalBuyers: 0,
        totalFish: 0,
        pendingFish: 0,
        verifiedFish: 0,
        rejectedFish: 0,
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        recentActivities: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>❌ {error}</p>
        <button onClick={fetchDashboardData} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-modern">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
      </div>

      {/* Main Stats Cards */}
      <div className="cards-modern">
        <div className="card-modern users-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
            <div className="card-substats">
              <span className="seller-badge">👨‍🌾 Sellers: {stats.totalSellers}</span>
              <span className="buyer-badge">🛒 Buyers: {stats.totalBuyers}</span>
            </div>
          </div>
        </div>

        <div className="card-modern fish-card">
          <div className="card-icon">🐟</div>
          <div className="card-content">
            <h3>Fish Listings</h3>
            <p className="stat-number">{stats.totalFish}</p>
            <div className="card-substats">
              <span className="pending">⏳ Pending: {stats.pendingFish}</span>
              <span className="verified">✅ Verified: {stats.verifiedFish}</span>
              <span className="rejected">❌ Rejected: {stats.rejectedFish}</span>
            </div>
          </div>
        </div>

        <div className="card-modern orders-card">
          <div className="card-icon">📦</div>
          <div className="card-content">
            <h3>Orders</h3>
            <p className="stat-number">{stats.totalOrders}</p>
            <div className="card-substats">
              <span className="pending">⏳ Pending: {stats.pendingOrders}</span>
              <span className="delivered">✅ Delivered: {stats.deliveredOrders}</span>
              <span className="cancelled">❌ Cancelled: {stats.cancelledOrders}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Total Sellers</span>
          <span className="stat-value seller">{stats.totalSellers}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Buyers</span>
          <span className="stat-value buyer">{stats.totalBuyers}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending Fish</span>
          <span className="stat-value pending">{stats.pendingFish}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Verified Fish</span>
          <span className="stat-value verified">{stats.verifiedFish}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending Orders</span>
          <span className="stat-value pending">{stats.pendingOrders}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Delivered Orders</span>
          <span className="stat-value delivered">{stats.deliveredOrders}</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>📋 Recent Activity</h2>
        <div className="activity-list">
          {stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity, index) => (
              <div key={index} className={`activity-item ${activity.type}`}>
                <span className="activity-icon">{activity.icon}</span>
                <div className="activity-content">
                  <p className="activity-message">{activity.message}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="no-activity">No recent activity</p>
          )}
        </div>
      </div>

      
    </div>
  );
};

export default AdminDashboard;