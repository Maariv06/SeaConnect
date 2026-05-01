import React, { useState } from 'react';
import './AdminPanel.css';
import { 
  FaTachometerAlt,
  FaFish,
  FaUsers,
  FaShoppingCart,
  FaClipboardList,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaTruck,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaUserCircle,
  FaChartLine,
  FaDownload,
  FaPrint,
  FaPlus,
  FaBan,
  FaCheck,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaBox,
  FaTag,
  FaWallet,
  FaMoneyBillWave,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaLock,
  FaUnlock,
  FaUserPlus,
  FaStore,
  FaGlobe,
  FaDatabase,
  FaCloud,
  FaKey
} from 'react-icons/fa';

function AdminPanel() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddFishModal, setShowAddFishModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dashboard Statistics
  const dashboardStats = {
    totalUsers: 2458,
    newUsersToday: 45,
    totalSellers: 892,
    totalBuyers: 1566,
    totalFishListings: 1234,
    activeListings: 987,
    pendingApprovals: 23,
    totalOrders: 3456,
    pendingOrders: 89,
    shippedOrders: 234,
    deliveredOrders: 3133,
    totalRevenue: 4567890,
    todayRevenue: 234567
  };

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New user registered', time: '5 min ago', read: false },
    { id: 2, message: 'New order placed #1234', time: '10 min ago', read: false },
    { id: 3, message: 'Payment received ₹12,500', time: '1 hour ago', read: true },
    { id: 4, message: 'Fish listing reported', time: '2 hours ago', read: true }
  ]);

  // Users Data
  const usersData = [
    { id: 1, name: 'Rajesh Kumar', email: 'rajesh@example.com', role: 'seller', status: 'active', joined: '2024-01-15', orders: 45, revenue: 125000, phone: '9876543210', location: 'Chennai' },
    { id: 2, name: 'Priya Sharma', email: 'priya@example.com', role: 'buyer', status: 'active', joined: '2024-01-16', orders: 12, spent: 35000, phone: '9876543211', location: 'Mumbai' },
    { id: 3, name: 'Ahmed Khan', email: 'ahmed@example.com', role: 'seller', status: 'pending', joined: '2024-01-17', orders: 0, revenue: 0, phone: '9876543212', location: 'Goa' },
    { id: 4, name: 'Suresh Patel', email: 'suresh@example.com', role: 'buyer', status: 'active', joined: '2024-01-14', orders: 8, spent: 28000, phone: '9876543213', location: 'Mangalore' },
    { id: 5, name: 'Lakshmi Devi', email: 'lakshmi@example.com', role: 'seller', status: 'blocked', joined: '2024-01-13', orders: 23, revenue: 89000, phone: '9876543214', location: 'Kerala' }
  ];

  // Fish Listings Data
  const fishListings = [
    { id: 1, name: 'Fresh Tuna', seller: 'Rajesh Kumar', category: 'Premium', price: 450, quantity: 100, location: 'Chennai', status: 'approved', views: 1245, orders: 23, revenue: 10350 },
    { id: 2, name: 'Silver Pomfret', seller: 'Ahmed Khan', category: 'Premium', price: 650, quantity: 50, location: 'Mumbai', status: 'pending', views: 567, orders: 0, revenue: 0 },
    { id: 3, name: 'King Mackerel', seller: 'Lakshmi Devi', category: 'Medium', price: 380, quantity: 200, location: 'Goa', status: 'approved', views: 2345, orders: 45, revenue: 17100 },
    { id: 4, name: 'Indian Seer', seller: 'Suresh Patel', category: 'Premium', price: 720, quantity: 75, location: 'Mangalore', status: 'rejected', views: 456, orders: 0, revenue: 0 },
    { id: 5, name: 'Pink Perch', seller: 'Priya Sharma', category: 'Budget', price: 280, quantity: 150, location: 'Kerala', status: 'approved', views: 3456, orders: 67, revenue: 18760 }
  ];

  // Orders Data
  const ordersData = [
    { id: 'ORD001', customer: 'Priya Sharma', fish: 'Fresh Tuna', quantity: 25, total: 11250, status: 'delivered', date: '2024-01-16', payment: 'online', seller: 'Rajesh Kumar' },
    { id: 'ORD002', customer: 'Ahmed Khan', fish: 'Silver Pomfret', quantity: 10, total: 6500, status: 'shipped', date: '2024-01-15', payment: 'cod', seller: 'Lakshmi Devi' },
    { id: 'ORD003', customer: 'Suresh Patel', fish: 'King Mackerel', quantity: 40, total: 15200, status: 'pending', date: '2024-01-16', payment: 'online', seller: 'Rajesh Kumar' },
    { id: 'ORD004', customer: 'Lakshmi Devi', fish: 'Pink Perch', quantity: 30, total: 8400, status: 'processing', date: '2024-01-14', payment: 'online', seller: 'Priya Sharma' },
    { id: 'ORD005', customer: 'Mohan Das', fish: 'Indian Seer', quantity: 15, total: 10800, status: 'cancelled', date: '2024-01-13', payment: 'cod', seller: 'Ahmed Khan' }
  ];

  // Get status badge class
  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return 'status-badge active';
      case 'inactive': return 'status-badge inactive';
      case 'pending': return 'status-badge pending';
      case 'approved': return 'status-badge approved';
      case 'rejected': return 'status-badge rejected';
      case 'blocked': return 'status-badge blocked';
      case 'delivered': return 'status-badge delivered';
      case 'shipped': return 'status-badge shipped';
      case 'processing': return 'status-badge processing';
      case 'cancelled': return 'status-badge cancelled';
      default: return 'status-badge';
    }
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <FaFish className="logo-icon" />
            {!sidebarCollapsed && <span>SeaConnect Admin</span>}
          </div>
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <div className="sidebar-menu">
          <button 
            className={activeSection === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveSection('dashboard')}
          >
            <FaTachometerAlt />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          <button 
            className={activeSection === 'users' ? 'active' : ''}
            onClick={() => setActiveSection('users')}
          >
            <FaUsers />
            {!sidebarCollapsed && <span>Users</span>}
          </button>

          <button 
            className={activeSection === 'listings' ? 'active' : ''}
            onClick={() => setActiveSection('listings')}
          >
            <FaFish />
            {!sidebarCollapsed && <span>Fish Listings</span>}
          </button>

          <button 
            className={activeSection === 'orders' ? 'active' : ''}
            onClick={() => setActiveSection('orders')}
          >
            <FaShoppingCart />
            {!sidebarCollapsed && <span>Orders</span>}
          </button>

          <button 
            className={activeSection === 'reports' ? 'active' : ''}
            onClick={() => setActiveSection('reports')}
          >
            <FaClipboardList />
            {!sidebarCollapsed && <span>Reports</span>}
          </button>

          <button 
            className={activeSection === 'settings' ? 'active' : ''}
            onClick={() => setActiveSection('settings')}
          >
            <FaCog />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </div>

        <div className="sidebar-footer">
          <button className="logout-btn">
            <FaSignOutAlt />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Header */}
        <div className="admin-top-header">
          <div className="header-left">
            <h1>Welcome back, Admin</h1>
            <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="header-right">
            <div className="notification-dropdown">
              <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <FaBell />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notification-menu">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    <button>Mark all as read</button>
                  </div>
                  {notifications.map(notification => (
                    <div className={`notification-item ${!notification.read ? 'unread' : ''}`} key={notification.id}>
                      <p>{notification.message}</p>
                      <span>{notification.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-profile">
              <FaUserCircle className="profile-icon" />
              <div className="profile-info">
                <span className="profile-name">Admin User</span>
                <span className="profile-role">Super Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="admin-search-bar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search users, listings, orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <FaFilter className="filter-icon" />
            <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="users">Users</option>
              <option value="listings">Listings</option>
              <option value="orders">Orders</option>
            </select>
          </div>
          <button className="export-btn">
            <FaDownload /> Export
          </button>
        </div>

        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <div className="dashboard-section">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <FaUsers />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Total Users</span>
                  <span className="stat-value">{dashboardStats.totalUsers}</span>
                  <span className="stat-change positive">+{dashboardStats.newUsersToday} today</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">
                  <FaFish />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Active Listings</span>
                  <span className="stat-value">{dashboardStats.activeListings}</span>
                  <span className="stat-change">{dashboardStats.pendingApprovals} pending</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">
                  <FaShoppingCart />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Total Orders</span>
                  <span className="stat-value">{dashboardStats.totalOrders}</span>
                  <span className="stat-change">{dashboardStats.pendingOrders} pending</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">
                  <FaMoneyBillWave />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Total Revenue</span>
                  <span className="stat-value">₹{(dashboardStats.totalRevenue / 1000000).toFixed(1)}M</span>
                  <span className="stat-change positive">+{dashboardStats.todayRevenue} today</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h3>Recent Users</h3>
              <div className="activity-list">
                {usersData.slice(0, 5).map(user => (
                  <div className="activity-item" key={user.id}>
                    <FaUserCircle className="activity-icon" />
                    <div className="activity-details">
                      <span className="activity-title">{user.name} joined as {user.role}</span>
                      <span className="activity-time">{user.joined}</span>
                    </div>
                    <span className={getStatusBadge(user.status)}>{user.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Section */}
        {activeSection === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>User Management</h2>
              <button className="add-btn">
                <FaUserPlus /> Add User
              </button>
            </div>

            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Orders</th>
                    <th>Revenue/Spent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.map(user => (
                    <tr key={user.id}>
                      <td className="user-cell">
                        <FaUserCircle className="user-avatar" />
                        <span>{user.name}</span>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(user.status)}>
                          {user.status}
                        </span>
                      </td>
                      <td>{user.location}</td>
                      <td>{user.orders}</td>
                      <td>₹{user.role === 'seller' ? user.revenue : user.spent}</td>
                      <td className="actions-cell">
                        <button className="action-btn view" onClick={() => { setSelectedUser(user); setShowUserModal(true); }}>
                          <FaEye />
                        </button>
                        <button className="action-btn edit">
                          <FaEdit />
                        </button>
                        <button className="action-btn delete">
                          <FaTrash />
                        </button>
                        {user.status === 'active' ? (
                          <button className="action-btn block">
                            <FaBan />
                          </button>
                        ) : (
                          <button className="action-btn unblock">
                            <FaUnlock />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fish Listings Section */}
        {activeSection === 'listings' && (
          <div className="listings-section">
            <div className="section-header">
              <h2>Fish Listings</h2>
              <button className="add-btn" onClick={() => setShowAddFishModal(true)}>
                <FaPlus /> Add Listing
              </button>
            </div>

            <div className="listings-table-container">
              <table className="listings-table">
                <thead>
                  <tr>
                    <th>Fish Name</th>
                    <th>Seller</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Orders</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fishListings.map(listing => (
                    <tr key={listing.id}>
                      <td className="fish-name">{listing.name}</td>
                      <td>{listing.seller}</td>
                      <td>{listing.category}</td>
                      <td className="price">₹{listing.price}</td>
                      <td>{listing.quantity} kg</td>
                      <td>{listing.location}</td>
                      <td>
                        <span className={getStatusBadge(listing.status)}>
                          {listing.status}
                        </span>
                      </td>
                      <td>{listing.views}</td>
                      <td>{listing.orders}</td>
                      <td className="actions-cell">
                        <button className="action-btn view">
                          <FaEye />
                        </button>
                        <button className="action-btn edit">
                          <FaEdit />
                        </button>
                        <button className="action-btn delete">
                          <FaTrash />
                        </button>
                        {listing.status === 'pending' && (
                          <>
                            <button className="action-btn approve">
                              <FaCheck />
                            </button>
                            <button className="action-btn reject">
                              <FaTimesCircle />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Section */}
        {activeSection === 'orders' && (
          <div className="orders-section">
            <div className="section-header">
              <h2>Orders</h2>
              <button className="export-btn">
                <FaDownload /> Export
              </button>
            </div>

            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Fish</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Seller</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersData.map(order => (
                    <tr key={order.id}>
                      <td className="order-id">{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.fish}</td>
                      <td>{order.quantity} kg</td>
                      <td className="amount">₹{order.total}</td>
                      <td>
                        <span className={getStatusBadge(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td>{order.date}</td>
                      <td>
                        <span className={`payment-badge ${order.payment}`}>
                          {order.payment}
                        </span>
                      </td>
                      <td>{order.seller}</td>
                      <td className="actions-cell">
                        <button className="action-btn view">
                          <FaEye />
                        </button>
                        <button className="action-btn edit">
                          <FaEdit />
                        </button>
                        <button className="action-btn track">
                          <FaTruck />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Section */}
        {activeSection === 'reports' && (
          <div className="reports-section">
            <div className="section-header">
              <h2>Reports</h2>
              <button className="add-btn">
                <FaPlus /> Generate Report
              </button>
            </div>

            <div className="reports-grid">
              <div className="report-card">
                <div className="report-icon blue">
                  <FaChartLine />
                </div>
                <h3>Sales Report</h3>
                <p>Daily, weekly, and monthly sales</p>
                <div className="report-preview">
                  <div className="preview-row">
                    <span>Today's Sales:</span>
                    <span className="amount">₹{dashboardStats.todayRevenue}</span>
                  </div>
                  <div className="preview-row">
                    <span>Total Revenue:</span>
                    <span className="amount">₹{dashboardStats.totalRevenue}</span>
                  </div>
                </div>
                <button className="view-report-btn">Download</button>
              </div>

              <div className="report-card">
                <div className="report-icon green">
                  <FaUsers />
                </div>
                <h3>User Report</h3>
                <p>User growth and activity</p>
                <div className="report-preview">
                  <div className="preview-row">
                    <span>Total Users:</span>
                    <span className="amount">{dashboardStats.totalUsers}</span>
                  </div>
                  <div className="preview-row">
                    <span>New Today:</span>
                    <span className="amount">{dashboardStats.newUsersToday}</span>
                  </div>
                </div>
                <button className="view-report-btn">Download</button>
              </div>

              <div className="report-card">
                <div className="report-icon orange">
                  <FaFish />
                </div>
                <h3>Listings Report</h3>
                <p>Fish listings performance</p>
                <div className="report-preview">
                  <div className="preview-row">
                    <span>Total Listings:</span>
                    <span className="amount">{dashboardStats.totalFishListings}</span>
                  </div>
                  <div className="preview-row">
                    <span>Active:</span>
                    <span className="amount">{dashboardStats.activeListings}</span>
                  </div>
                </div>
                <button className="view-report-btn">Download</button>
              </div>

              <div className="report-card">
                <div className="report-icon purple">
                  <FaShoppingCart />
                </div>
                <h3>Orders Report</h3>
                <p>Order statistics</p>
                <div className="report-preview">
                  <div className="preview-row">
                    <span>Total Orders:</span>
                    <span className="amount">{dashboardStats.totalOrders}</span>
                  </div>
                  <div className="preview-row">
                    <span>Pending:</span>
                    <span className="amount">{dashboardStats.pendingOrders}</span>
                  </div>
                </div>
                <button className="view-report-btn">Download</button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Settings</h2>
              <button className="add-btn">
                Save Changes
              </button>
            </div>

            <div className="settings-grid">
              <div className="settings-card">
                <h3><FaGlobe /> General Settings</h3>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Site Name</label>
                    <input type="text" defaultValue="SeaConnect" />
                  </div>
                  <div className="form-group">
                    <label>Admin Email</label>
                    <input type="email" defaultValue="admin@seaconnect.com" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" defaultValue="+91 98765 43210" />
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <h3><FaWallet /> Financial Settings</h3>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Commission Rate (%)</label>
                    <input type="number" defaultValue="5" />
                  </div>
                  <div className="form-group">
                    <label>Shipping Fee (₹)</label>
                    <input type="number" defaultValue="50" />
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <h3><FaDatabase /> Backup Settings</h3>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Auto Backup</label>
                    <select>
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>
                  <button className="backup-btn">
                    <FaCloud /> Backup Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>User Details</h2>
            <div className="user-profile-header">
              <FaUserCircle className="user-avatar-large" />
              <div className="user-info">
                <h3>{selectedUser.name}</h3>
                <p>{selectedUser.email}</p>
                <span className={getStatusBadge(selectedUser.status)}>{selectedUser.status}</span>
              </div>
            </div>

            <div className="user-details-grid">
              <div className="detail-item">
                <label>Phone</label>
                <p>{selectedUser.phone}</p>
              </div>
              <div className="detail-item">
                <label>Location</label>
                <p>{selectedUser.location}</p>
              </div>
              <div className="detail-item">
                <label>Role</label>
                <p className={`role-badge ${selectedUser.role}`}>{selectedUser.role}</p>
              </div>
              <div className="detail-item">
                <label>Joined</label>
                <p>{selectedUser.joined}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowUserModal(false)}>Close</button>
              <button className="edit-btn">Edit User</button>
              <button className="message-btn">
                <FaEnvelope /> Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Fish Modal */}
      {showAddFishModal && (
        <div className="modal-overlay" onClick={() => setShowAddFishModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add New Fish Listing</h2>
            
            <div className="modal-form">
              <div className="form-group">
                <label>Fish Name</label>
                <input type="text" placeholder="e.g., Fresh Tuna" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select>
                    <option>Premium</option>
                    <option>Medium</option>
                    <option>Budget</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (per kg)</label>
                  <input type="number" placeholder="₹" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity (kg)</label>
                  <input type="number" placeholder="Quantity" />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" placeholder="City" />
                </div>
              </div>

              <div className="form-group">
                <label>Seller</label>
                <select>
                  <option>Select Seller</option>
                  {usersData.filter(u => u.role === 'seller').map(user => (
                    <option key={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowAddFishModal(false)}>Cancel</button>
                <button className="submit-btn">Add Listing</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;