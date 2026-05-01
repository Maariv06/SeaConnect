import React, { useState } from 'react';
import './MyOrders.css';
import { 
  FaFish, 
  FaBox, 
  FaTruck, 
  FaCheckCircle, 
  FaClock, 
  FaMapMarkerAlt, 
  FaRupeeSign,
  FaUser,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaDownload,
  FaStar,
  FaPlus,
  FaImage,
  FaWeight,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaHourglassHalf,
  FaShippingFast,
  FaShoppingBag
} from 'react-icons/fa';

function MyOrders() {
  const [activeTab, setActiveTab] = useState('selling'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddListing, setShowAddListing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Sample Data - Updated for Nagercoil/Thoothukudi and specific Fish types
  const [myListings, setMyListings] = useState([
    {
      id: 1,
      fishName: 'Seer Fish',
      price: 850,
      quantity: 50,
      unit: 'kg',
      location: 'Nagercoil',
      listedDate: '2024-01-15',
      status: 'active',
      totalSold: 30,
      remainingStock: 20,
      buyers: [
        { id: 101, name: 'Local Market A', quantity: 10, date: '2024-01-16', status: 'delivered' }
      ]
    },
    {
      id: 2,
      fishName: 'Mathi (Sardines)',
      price: 180,
      quantity: 200,
      unit: 'kg',
      location: 'Thoothukudi',
      listedDate: '2024-01-14',
      status: 'active',
      totalSold: 150,
      remainingStock: 50,
      buyers: [
        { id: 103, name: 'Coastal Traders', quantity: 50, date: '2024-01-15', status: 'delivered' }
      ]
    },
    {
      id: 3,
      fishName: 'Prawns',
      price: 550,
      quantity: 100,
      unit: 'kg',
      location: 'Thoothukudi',
      listedDate: '2024-01-13',
      status: 'active',
      totalSold: 40,
      remainingStock: 60,
      buyers: []
    }
  ]);

  const [myPurchases] = useState([
    {
      id: 201,
      fishName: 'Seer Fish',
      sellerName: 'Nagercoil Fresh Catch',
      sellerLocation: 'Nagercoil',
      quantity: 5,
      unit: 'kg',
      price: 850,
      totalAmount: 4250,
      orderDate: '2024-01-20',
      deliveryDate: '2024-01-21',
      status: 'delivered',
      trackingId: 'NG100234',
      estimatedDelivery: '2024-01-21',
      currentLocation: 'Delivered',
      timeline: [
        { status: 'Order Placed', date: '2024-01-20 09:00', completed: true },
        { status: 'Delivered', date: '2024-01-21 11:00', completed: true }
      ]
    }
  ]);

  const handleDeleteListing = (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      setMyListings(myListings.filter(listing => listing.id !== listingId));
    }
  };

  const handleViewBuyers = (listing) => {
    setSelectedOrder(listing);
    setShowOrderDetails(true);
  };

  const getStatusBadge = (status) => {
    return `status-badge ${status}`;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <FaCheckCircle />;
      case 'shipped': return <FaShippingFast />;
      case 'pending': return <FaHourglassHalf />;
      default: return <FaClock />;
    }
  };

  const filteredListings = myListings.filter(listing =>
    listing.fishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <h1>My Activity</h1>
          <p>Manage your Fish listings, track orders, and view purchases</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">{myListings.length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">₹{(myPurchases.reduce((acc, item) => acc + item.totalAmount, 0)).toLocaleString()}</span>
            <span className="stat-label">Total Spent</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button className={activeTab === 'selling' ? 'active' : ''} onClick={() => setActiveTab('selling')}>
          <FaFish /> <span>My Listings</span>
        </button>
        <button className={activeTab === 'buying' ? 'active' : ''} onClick={() => setActiveTab('buying')}>
          <FaShoppingBag /> <span>My Purchases</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-filter-bar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search fish or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {activeTab === 'selling' && (
          <button className="add-listing-btn" onClick={() => setShowAddListing(true)}>
            <FaPlus /> Add Listing
          </button>
        )}
      </div>

      <div className="dashboard-content">
        {activeTab === 'selling' && (
          <div className="listings-section">
            <div className="listings-grid">
              {filteredListings.map(listing => (
                <div className="listing-card" key={listing.id}>
                  <div className="listing-details">
                    <h3>{listing.fishName}</h3>
                    <div className="listing-price">
                      <FaRupeeSign /><span>{listing.price}/kg</span>
                    </div>
                    <div className="listing-location">
                      <FaMapMarkerAlt /> <span>{listing.location}</span>
                    </div>
                    <div className="listing-stats">
                      <FaWeight /> <span>Stock: {listing.remainingStock}kg</span>
                    </div>
                  </div>

                  <div className="listing-actions">
                    <button className="view-btn" onClick={() => handleViewBuyers(listing)}>
                      <FaEye /> Buyers
                    </button>
                    <button className="edit-btn"><FaEdit /></button>
                    <button className="delete-btn" onClick={() => handleDeleteListing(listing.id)}><FaTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'buying' && (
          <div className="purchases-section">
            <div className="purchases-list">
              {myPurchases.map(purchase => (
                <div className="purchase-card" key={purchase.id}>
                  <div className="purchase-details">
                    <div className="purchase-header">
                      <h3>{purchase.fishName}</h3>
                      <span className={getStatusBadge(purchase.status)}>
                        {getStatusIcon(purchase.status)} {purchase.status}
                      </span>
                    </div>
                    <div className="seller-info">
                      <FaUser /> <span>{purchase.sellerName} • {purchase.sellerLocation}</span>
                    </div>
                    <div className="purchase-meta">
                      <FaWeight /> <span>{purchase.quantity}kg</span>
                      <FaRupeeSign /> <span>Total: ₹{purchase.totalAmount}</span>
                    </div>
                    <div className="purchase-actions">
                      <button className="rate-btn"><FaStar /> Rate</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Listing Modal */}
      {showAddListing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Fish Listing</h2>
            <div className="modal-form">
              <div className="form-group">
                <label>Fish Type *</label>
                <select>
                  <option>Seer</option>
                  <option>Mathi</option>
                  <option>Prawns</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (per kg) *</label>
                  <input type="number" placeholder="₹" />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <select>
                    <option>Nagercoil</option>
                    <option>Thoothukudi</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowAddListing(false)}>Cancel</button>
                <button className="submit-btn"><FaPlus /> Add Listing</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;