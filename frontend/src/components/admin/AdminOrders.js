// components/admin/AdminOrders.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminOrders.css";

const API = "http://localhost:5000/api";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState({});
  const [showCancelled, setShowCancelled] = useState(false);
  const [orderType, setOrderType] = useState("all");

  useEffect(() => {
    fetchOrders();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Apply filters whenever orders, filter, searchTerm, showCancelled, or orderType changes
  useEffect(() => {
    let filtered = [...orders];
    
    // Apply order type filter
    if (orderType !== "all") {
      filtered = filtered.filter(o => o.orderType === orderType);
    }
    
    // Apply cancelled filter
    if (!showCancelled) {
      filtered = filtered.filter(o => o.status !== "Cancelled");
    }
    
    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter(o => o.status === filter);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        (o.customerName?.toLowerCase() || "").includes(term) ||
        (o.customerPhone?.toLowerCase() || "").includes(term) ||
        (o.fishType?.toLowerCase() || "").includes(term) ||
        (o.sellerName?.toLowerCase() || "").includes(term) ||
        (o._id?.toString().toLowerCase() || "").includes(term) ||
        (o.auctionId?.toString().toLowerCase() || "").includes(term)
      );
    }
    
    setFilteredOrders(filtered);
  }, [orders, filter, searchTerm, showCancelled, orderType]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/orders/all`);
      
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      // Load from localStorage for demo
      const savedOrders = JSON.parse(localStorage.getItem("myOrders") || "[]");
      setOrders(savedOrders);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id, status) => {
    setUpdating(prev => ({ ...prev, [id]: true }));
    
    try {
      const response = await axios.put(`${API}/orders/${id}/status`, { 
        status
      });
      
      if (response.data.success) {
        // Update local state immediately for UI responsiveness
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === id 
              ? { 
                  ...order, 
                  status,
                  updatedAt: new Date().toISOString()
                } 
              : order
          )
        );
        
        alert(`✅ Order status updated to ${status}`);
      }
    } catch (err) {
      console.error("Error updating order:", err);
      alert("❌ Failed to update order status");
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const markAsPaid = async (id) => {
    setUpdating(prev => ({ ...prev, [id]: true }));
    
    try {
      const response = await axios.put(`${API}/orders/${id}/payment`, { 
        paymentStatus: "Paid"
      });
      
      if (response.data.success) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === id 
              ? { ...order, paymentStatus: "Paid" } 
              : order
          )
        );
        alert("✅ Payment marked as paid successfully!");
      }
    } catch (err) {
      console.error("Error marking as paid:", err);
      alert("❌ Failed to mark as paid");
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "Pending": return "status-badge pending";
      case "Shipped": return "status-badge shipped";
      case "Delivered": return "status-badge delivered";
      case "Cancelled": return "status-badge cancelled";
      default: return "status-badge";
    }
  };

  const getPaymentBadge = (paymentStatus) => {
    return paymentStatus === "Paid" ? "payment-badge paid" : "payment-badge pending";
  };

  const getAvailableStatuses = (currentStatus, orderType) => {
    // If order is cancelled, no actions available
    if (currentStatus === "Cancelled") {
      return [{ value: "Cancelled", label: "❌ Cancelled (No actions)" }];
    }
    
    const statuses = [
      { value: "Pending", label: "⏳ Pending" },
      { value: "Shipped", label: "🚚 Shipped" },
      { value: "Delivered", label: "📦 Delivered" }
    ];
    
    // Only show cancelled if order is not already delivered
    if (currentStatus !== "Delivered") {
      statuses.push({ value: "Cancelled", label: "❌ Cancel Order" });
    }
    
    return statuses;
  };

  const getOrderTypeBadge = (orderType) => {
    if (orderType === "auction") {
      return <span className="order-type-badge auction">🔨 Auction</span>;
    }
    return <span className="order-type-badge regular">🛒 Regular</span>;
  };

  const stats = {
    total: orders.length,
    regular: orders.filter(o => o.orderType !== "auction").length,
    auction: orders.filter(o => o.orderType === "auction").length,
    pending: orders.filter(o => o.status === "Pending").length,
    shipped: orders.filter(o => o.status === "Shipped").length,
    delivered: orders.filter(o => o.status === "Delivered").length,
    cancelled: orders.filter(o => o.status === "Cancelled").length,
    
    paidOrders: orders.filter(o => o.paymentStatus === "Paid").length,
    pendingPayment: orders.filter(o => o.paymentStatus !== "Paid" && o.status !== "Cancelled").length
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-modern">
      <div className="section-header">
        <h1>Order Management</h1>
        <button className="refresh-btn" onClick={fetchOrders}>
          <span>⟳</span> Refresh
        </button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="order-stats">
        <div className="stat-card total">
          <span className="stat-label">Total Orders</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card regular">
          <span className="stat-label">Regular</span>
          <span className="stat-value">{stats.regular}</span>
        </div>
        <div className="stat-card auction">
          <span className="stat-label">Auction</span>
          <span className="stat-value">{stats.auction}</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-label">Pending</span>
          <span className="stat-value pending">{stats.pending}</span>
        </div>
        <div className="stat-card shipped">
          <span className="stat-label">Shipped</span>
          <span className="stat-value shipped">{stats.shipped}</span>
        </div>
        <div className="stat-card delivered">
          <span className="stat-label">Delivered</span>
          <span className="stat-value delivered">{stats.delivered}</span>
        </div>
        <div className="stat-card cancelled">
          <span className="stat-label">Cancelled</span>
          <span className="stat-value cancelled">{stats.cancelled}</span>
        </div>
        <div className="stat-card paid">
          <span className="stat-label">Paid</span>
          <span className="stat-value paid">{stats.paidOrders}</span>
        </div>
        <div className="stat-card pending-payment">
          <span className="stat-label">Pending Payment</span>
          <span className="stat-value warning">{stats.pendingPayment}</span>
        </div>
        {stats.pendingAuction > 0 && (
          <div className="stat-card auction-pending">
            <span className="stat-label">Auction Pending</span>
            <span className="stat-value warning">{stats.pendingAuction}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <select 
            onChange={(e) => setOrderType(e.target.value)} 
            value={orderType}
            className="filter-select"
          >
            <option value="all">All Order Types</option>
            <option value="regular">Regular Orders</option>
            <option value="auction">Auction Orders</option>
          </select>
        </div>

        <div className="filter-group">
          <select 
            onChange={(e) => setFilter(e.target.value)} 
            value={filter}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Search by customer, fish, seller, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className="toggle-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
            />
            <span>Show Cancelled Orders</span>
          </label>
        </div>
      </div>

      {/* Results count */}
      <div className="results-count">
        Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
        {!showCancelled && stats.cancelled > 0 && (
          <span className="cancelled-note">
            ({stats.cancelled} cancelled hidden - 
            <button onClick={() => setShowCancelled(true)} className="show-cancelled-link">
              show them
            </button>)
          </span>
        )}
        {orderType === "auction" && (
          <span className="filter-note">🔨 Showing auction orders only</span>
        )}
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Type</th>
              <th>Customer</th>
              <th>Fish</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Seller</th>
              <th>Delivery</th>
              <th>Payment Status</th>
              <th>Order Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="11" className="no-data">
                  <div className="no-data-content">
                    <span className="no-data-icon">📦</span>
                    <p>No orders found</p>
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")}>
                        Clear Search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order._id} className={`order-row ${order.status.toLowerCase()} ${order.orderType}`}>
                  <td className="order-id">#{order._id?.toString().slice(-6)}</td>
                  <td>{getOrderTypeBadge(order.orderType)}</td>
                  <td>
                    <div className="customer-info">
                      <strong>{order.customerName}</strong>
                      <small>{order.customerPhone}</small>
                    </div>
                  </td>
                  <td className="fish-type">
                    {order.fishType}
                    {order.auctionId && (
                      <small className="auction-id">Auction: {order.auctionId?.toString().slice(-6)}</small>
                    )}
                  </td>
                  <td className="quantity">{order.quantity} kg</td>
                  <td className="total-amount">₹{order.totalAmount?.toLocaleString()}</td>
                  <td>
                    <div className="seller-info">
                      <strong>{order.sellerName}</strong>
                    </div>
                  </td>
                  <td className="delivery-location">
                    {order.deliveryLocation === "Pending" ? (
                      <span className="pending-delivery">⏳ Pending</span>
                    ) : (
                      order.deliveryLocation
                    )}
                  </td>
                  <td>
                    <div className="payment-info">
                      <span className={getPaymentBadge(order.paymentStatus)}>
                        {order.paymentStatus || "Pending"}
                      </span>
                      {/* Show Mark Paid button for all orders that are not paid and not cancelled */}
                      {order.paymentStatus !== "Paid" && order.status !== "Cancelled" && (
                        <button
                          className="mark-paid-btn"
                          onClick={() => markAsPaid(order._id)}
                          disabled={updating[order._id]}
                          title={`Mark as paid (Payment Method: ${order.paymentMethod})`}
                        >
                          {updating[order._id] ? "⏳" : "💰 Mark Paid"}
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={getStatusBadge(order.status)}>
                      {order.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {order.status === "Cancelled" ? (
                      <span className="no-actions">No actions</span>
                    ) : (
                      <select
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        value={order.status}
                        className="status-select"
                        disabled={updating[order._id] || order.status === "Delivered"}
                      >
                        {getAvailableStatuses(order.status, order.orderType).map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      {filteredOrders.length > 0 && (
        <div className="orders-summary">
          <div className="summary-left">
            <span>Showing {filteredOrders.length} orders</span>
            <span className="summary-divider">|</span>
            <span>Regular: {filteredOrders.filter(o => o.orderType !== "auction").length}</span>
            <span className="summary-divider">|</span>
            <span>Auction: {filteredOrders.filter(o => o.orderType === "auction").length}</span>
            <span className="summary-divider">|</span>
            <span>Paid: {filteredOrders.filter(o => o.paymentStatus === "Paid").length}</span>
            <span className="summary-divider">|</span>
            <span>Pending Payment: {filteredOrders.filter(o => o.paymentStatus !== "Paid" && o.status !== "Cancelled").length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;