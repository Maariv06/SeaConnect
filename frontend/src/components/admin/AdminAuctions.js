// components/admin/AdminAuctions.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminAuctions.css";

// Import fish images
import seerFishImg from "../../assets/fish/seer-fish.jpg";
import tunaImg from "../../assets/fish/tuna.jpg";
import sardineImg from "../../assets/fish/sardine.jpg";
import mackerelImg from "../../assets/fish/mackerel.jpg";
import anchovyImg from "../../assets/fish/anchovy.jpg";
import pomfretImg from "../../assets/fish/pomfret.jpg";
import barracudaImg from "../../assets/fish/barracuda.jpg";
import snapperImg from "../../assets/fish/snapper.jpg";
import grouperImg from "../../assets/fish/grouper.jpg";
import silverBellyImg from "../../assets/fish/silver-belly.jpg";
import threadfinImg from "../../assets/fish/threadfin.jpg";
import prawnsImg from "../../assets/fish/prawns.jpg";
import tigerPrawnsImg from "../../assets/fish/tiger-prawns.jpg";
import shrimpImg from "../../assets/fish/shrimp.jpg";
import crabImg from "../../assets/fish/crab.jpg";
import squidImg from "../../assets/fish/squid.jpg";
import defaultFishImg from "../../assets/fish/default-fish.jpg";

const API = "http://localhost:5000/api";
const UPLOADS_URL = "http://localhost:5000/uploads";

// Fish image mapping for fallback (actual images, not filenames)
const fishImageMap = {
  "Seer Fish": seerFishImg,
  "Tuna": tunaImg,
  "Sardine": sardineImg,
  "Mackerel": mackerelImg,
  "Anchovy": anchovyImg,
  "Pomfret": pomfretImg,
  "Barracuda": barracudaImg,
  "Snapper": snapperImg,
  "Grouper": grouperImg,
  "Silver Belly": silverBellyImg,
  "Threadfin": threadfinImg,
  "Prawns": prawnsImg,
  "Tiger Prawns": tigerPrawnsImg,
  "Shrimp": shrimpImg,
  "Crab": crabImg,
  "Squid": squidImg
};

const AdminAuctions = ({ setActiveTab }) => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [imageErrors, setImageErrors] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);
  const [endTimeData, setEndTimeData] = useState({
    auctionEnd: "",
    duration: 24
  });
  const [endTimeError, setEndTimeError] = useState("");
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fishType: "",
    quantity: "",
    startingPrice: "",
    currentBid: "",
    location: "",
    description: ""
  });
  const [editError, setEditError] = useState("");

  useEffect(() => {
    fetchAuctions();
    
    // Refresh every 30 seconds to get updated data
    const interval = setInterval(fetchAuctions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/auction/all`);
      
      if (res.data.success) {
        setAuctions(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching auctions:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateAuctionStatus = async (id, status) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      const res = await axios.put(`${API}/auction/${id}/status`, { status });
      
      if (res.data.success) {
        alert(`✅ Auction ${status} successfully!`);
        fetchAuctions();
      }
    } catch (err) {
      console.error("Error updating auction:", err);
      alert("❌ Failed to update auction");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // OPEN EDIT MODAL
  const openEditModal = (auction) => {
    setSelectedAuction(auction);
    setEditFormData({
      fishType: auction.fishType || "",
      quantity: auction.quantity || "",
      startingPrice: auction.startingPrice || "",
      currentBid: auction.currentBid || "",
      location: auction.location || "",
      description: auction.description || ""
    });
    setEditError("");
    setShowEditModal(true);
  };

  // HANDLE EDIT FORM CHANGE
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    setEditError("");
  };

  // UPDATE AUCTION
  const updateAuction = async () => {
    // Validate
    if (!editFormData.quantity || editFormData.quantity <= 0) {
      setEditError("Quantity must be greater than 0");
      return;
    }
    if (!editFormData.startingPrice || editFormData.startingPrice <= 0) {
      setEditError("Starting price must be greater than 0");
      return;
    }
    if (!editFormData.location) {
      setEditError("Location is required");
      return;
    }

    setActionLoading(prev => ({ ...prev, [selectedAuction._id]: true }));

    try {
      const updateData = {
        quantity: Number(editFormData.quantity),
        startingPrice: Number(editFormData.startingPrice),
        location: editFormData.location,
        description: editFormData.description || "",
        fishType: editFormData.fishType
      };
      
      // Only update currentBid if auction is not live yet
      if (selectedAuction.status !== "Live") {
        updateData.currentBid = Number(editFormData.startingPrice);
      }

      console.log("Updating auction with data:", updateData);

      const res = await axios.put(`${API}/auction/${selectedAuction._id}/update`, updateData);
      
      if (res.data.success) {
        alert("✅ Auction updated successfully!");
        setShowEditModal(false);
        fetchAuctions();
      }
    } catch (err) {
      console.error("Error updating auction:", err);
      alert(err.response?.data?.message || "❌ Failed to update auction");
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedAuction._id]: false }));
    }
  };

  const openEndTimeModal = (auction) => {
    setSelectedAuction(auction);
    
    // Set default end time to 24 hours from now
    const defaultEnd = new Date();
    defaultEnd.setHours(defaultEnd.getHours() + 24);
    
    setEndTimeData({
      auctionEnd: defaultEnd.toISOString().slice(0, 16),
      duration: 24
    });
    setEndTimeError("");
    setShowEndTimeModal(true);
  };

  const handleEndTimeChange = (e) => {
    const { name, value } = e.target;
    setEndTimeData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (endTimeError) setEndTimeError("");
  };

  const handleDurationSelect = (hours) => {
    const newEnd = new Date();
    newEnd.setHours(newEnd.getHours() + hours);
    
    setEndTimeData({
      auctionEnd: newEnd.toISOString().slice(0, 16),
      duration: hours
    });
  };

  const approveWithEndTime = async () => {
    if (!endTimeData.auctionEnd) {
      setEndTimeError("Please select an end time");
      return;
    }

    const endTime = new Date(endTimeData.auctionEnd);
    const now = new Date();
    
    if (endTime <= now) {
      setEndTimeError("End time must be in the future");
      return;
    }

    setActionLoading(prev => ({ ...prev, [selectedAuction._id]: true }));

    try {
      // First update status to Live with end time
      const res = await axios.put(`${API}/auction/${selectedAuction._id}/status`, {
        status: "Live",
        auctionEnd: endTimeData.auctionEnd
      });
      
      if (res.data.success) {
        alert(`✅ Auction approved and set to end at ${new Date(endTimeData.auctionEnd).toLocaleString()}`);
        setShowEndTimeModal(false);
        fetchAuctions();
      }
    } catch (err) {
      console.error("Error approving auction:", err);
      alert("❌ Failed to approve auction");
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedAuction._id]: false }));
    }
  };

  const completeAuction = async (id) => {
    if (!window.confirm("Complete this auction now? The highest bidder will win immediately.")) return;
    
    setActionLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      console.log("Completing auction:", id);
      
      const response = await axios.post(`${API}/auction/${id}/complete`);
      
      console.log("Response:", response.data);
      
      if (response.data.success) {
        alert("✅ Auction completed successfully! Order created for winner.");
        fetchAuctions();
      }
    } catch (err) {
      console.error("Error completing auction:", err);
      
      if (err.response) {
        console.error("Server response:", err.response.data);
        alert(`❌ Failed to complete auction: ${err.response.data?.message || err.response.status}`);
      } else if (err.request) {
        alert("❌ No response from server. Please check your connection.");
      } else {
        alert("❌ Error: " + err.message);
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const deleteAuction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this auction? This action cannot be undone.")) return;
    
    setActionLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      await axios.delete(`${API}/auction/${id}`);
      alert("✅ Auction deleted successfully");
      fetchAuctions();
    } catch (err) {
      console.error("Error deleting auction:", err);
      alert("❌ Failed to delete auction");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleImageError = (auctionId) => {
    setImageErrors(prev => ({
      ...prev,
      [auctionId]: true
    }));
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleViewDetails = (auction) => {
    setSelectedAuction(auction);
    setShowDetailsModal(true);
  };

  const getImageUrl = (auction) => {
    if (imageErrors[auction._id]) {
      return fishImageMap[auction.fishType] || defaultFishImg;
    }
    
    if (auction.image && auction.image !== "default-fish.jpg") {
      return `${UPLOADS_URL}/${auction.image}`;
    }
    
    if (auction.fishType && fishImageMap[auction.fishType]) {
      return fishImageMap[auction.fishType];
    }
    
    return defaultFishImg;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "Pending": return "status-badge pending";
      case "Live": return "status-badge live";
      case "Completed": return "status-badge completed";
      case "Cancelled": return "status-badge cancelled";
      default: return "status-badge";
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getAutoCompleteReason = (auction) => {
    if (!auction.autoCompleteReason) return null;
    
    switch(auction.autoCompleteReason) {
      case "time_end":
        return <span className="auto-complete-badge time">⏰ Auto-completed (End time reached)</span>;
      case "inactivity":
        return <span className="auto-complete-badge inactivity">⏳ Auto-completed (10min inactivity)</span>;
      case "admin_complete":
        return <span className="auto-complete-badge admin">👨‍💼 Completed by admin</span>;
      default:
        return null;
    }
  };

  const filteredAuctions = filter === "all" 
    ? auctions 
    : auctions.filter(a => a.status === filter);

  if (loading) {
    return <div className="loading">Loading auctions...</div>;
  }

  return (
    <div className="auctions-admin">
      <div className="section-header">
        <h1>Auction Management</h1>

        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            className="add-btn"
            onClick={() => setActiveTab("addAuction")}
          >
            ➕ Add Auction
          </button>

          <button 
            className="refresh-btn" 
            onClick={fetchAuctions}
          >
            ⟳ Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="auction-stats">
        <div className="stat-card">
          <span className="stat-label">Total</span>
          <span className="stat-value">{auctions.length}</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{auctions.filter(a => a.status === "Pending").length}</span>
        </div>
        <div className="stat-card live">
          <span className="stat-label">Live</span>
          <span className="stat-value">{auctions.filter(a => a.status === "Live").length}</span>
        </div>
        <div className="stat-card completed">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{auctions.filter(a => a.status === "Completed").length}</span>
        </div>
        <div className="stat-card cancelled">
          <span className="stat-label">Cancelled</span>
          <span className="stat-value">{auctions.filter(a => a.status === "Cancelled").length}</span>
        </div>
      </div>

      <div className="filter-section">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Auctions ({auctions.length})</option>
          <option value="Pending">Pending ({auctions.filter(a => a.status === "Pending").length})</option>
          <option value="Live">Live ({auctions.filter(a => a.status === "Live").length})</option>
          <option value="Completed">Completed ({auctions.filter(a => a.status === "Completed").length})</option>
          <option value="Cancelled">Cancelled ({auctions.filter(a => a.status === "Cancelled").length})</option>
        </select>
      </div>

      <div className="auctions-grid">
        {filteredAuctions.length === 0 ? (
          <div className="no-results">
            <p>No auctions found</p>
          </div>
        ) : (
          filteredAuctions.map(auction => (
            <div key={auction._id} className={`auction-card ${auction.status.toLowerCase()}`}>
              {/* Auction Image */}
              <div className="auction-image-container">
                <img 
                  src={getImageUrl(auction)}
                  alt={auction.fishType}
                  className="auction-image"
                  onClick={() => handleImageClick(getImageUrl(auction))}
                  onError={() => handleImageError(auction._id)}
                />
                <div className="image-overlay" onClick={() => handleImageClick(getImageUrl(auction))}>
                  <span className="zoom-icon">🔍</span>
                </div>
                
                {auction.status === "Live" && (
                  <div className="live-badge-small">
                    <span className="pulse-dot"></span>
                    LIVE
                  </div>
                )}
              </div>

              <div className="card-header">
                <h3>{auction.fishType}</h3>
                <span className={getStatusBadge(auction.status)}>{auction.status}</span>
              </div>
              
              <div className="card-body">
                <p><strong>Seller:</strong> {auction.sellerName}</p>
                <p><strong>Quantity:</strong> {auction.quantity} kg</p>
                <p><strong>Starting Price:</strong> ₹{auction.startingPrice?.toLocaleString()}</p>
                <p><strong>Current Bid:</strong> <span className="highlight">₹{auction.currentBid?.toLocaleString()}</span></p>
                <p><strong>Bids:</strong> {auction.bidCount}</p>
                <p><strong>Location:</strong> 📍 {auction.location}</p>
                {auction.status === "Live" && auction.auctionEnd && (
                  <>
                    <p><strong>Ends:</strong> {formatDateTime(auction.auctionEnd)}</p>
                    {auction.timeRemaining && (
                      <p className={`time-remaining ${auction.timeRemaining.includes('m') && parseInt(auction.timeRemaining) < 10 ? 'urgent' : ''}`}>
                        <strong>Time Left:</strong> {auction.timeRemaining}
                      </p>
                    )}
                  </>
                )}
                {auction.status === "Pending" && (
                  <p className="pending-note">⏳ Waiting for admin to set end time</p>
                )}
                
                {auction.status === "Completed" && getAutoCompleteReason(auction)}
                
                {auction.status === "Completed" && auction.winner && (
                  <div className="winner-info-mini">
                    <p><strong>Winner:</strong> {auction.winner.bidderName}</p>
                    <p><strong>Winning Bid:</strong> ₹{auction.winner.winningBid?.toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button 
                  className="edit-btn"
                  onClick={() => openEditModal(auction)}
                  disabled={actionLoading[auction._id]}
                  title="Edit Quantity & Price"
                >
                  ✎ Edit
                </button>
                
                <button 
                  className="view-btn" 
                  onClick={() => handleViewDetails(auction)}
                  disabled={actionLoading[auction._id]}
                >
                  👁️ Details
                </button>
                
                {auction.status === "Pending" && (
                  <>
                    <button 
                      className="approve-btn" 
                      onClick={() => openEndTimeModal(auction)}
                      disabled={actionLoading[auction._id]}
                    >
                      {actionLoading[auction._id] ? "⏳" : "✓ Set Time"}
                    </button>
                    <button 
                      className="reject-btn" 
                      onClick={() => updateAuctionStatus(auction._id, "Cancelled")}
                      disabled={actionLoading[auction._id]}
                    >
                      {actionLoading[auction._id] ? "⏳" : "✗ Reject"}
                    </button>
                  </>
                )}
                
                {auction.status === "Live" && (
                  <>
                    <button 
                      className="complete-btn" 
                      onClick={() => completeAuction(auction._id)}
                      disabled={actionLoading[auction._id]}
                    >
                      {actionLoading[auction._id] ? "⏳" : "✓ Complete"}
                    </button>
                  </>
                )}
                
                <button 
                  className="delete-btn" 
                  onClick={() => deleteAuction(auction._id)}
                  disabled={actionLoading[auction._id]}
                >
                  {actionLoading[auction._id] ? "⏳" : "🗑 Delete"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT MODAL */}
      {showEditModal && selectedAuction && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            
            <h2>Edit Auction Details</h2>
            
            <div className="edit-content">
              <div className="auction-summary">
                <img 
                  src={getImageUrl(selectedAuction)} 
                  alt={selectedAuction.fishType}
                  className="summary-image"
                />
                <div className="summary-details">
                  <h3>{selectedAuction.fishType}</h3>
                  <p>Seller: {selectedAuction.sellerName}</p>
                  <p>Status: <span className={getStatusBadge(selectedAuction.status)}>{selectedAuction.status}</span></p>
                </div>
              </div>

              {editError && <div className="edit-error">{editError}</div>}

              <div className="edit-form">
                <div className="form-group">
                  <label>Fish Type *</label>
                  <input
                    type="text"
                    name="fishType"
                    value={editFormData.fishType}
                    onChange={handleEditChange}
                    disabled={selectedAuction.status === "Live" || selectedAuction.status === "Completed"}
                    placeholder="Fish type"
                  />
                  <small>Cannot edit if auction is Live or Completed</small>
                </div>

                <div className="form-group">
                  <label>Quantity (KG) *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={editFormData.quantity}
                    onChange={handleEditChange}
                    min="0.5"
                    step="0.5"
                    required
                    placeholder="Quantity in kg"
                  />
                </div>

                <div className="form-group">
                  <label>Starting Price (₹) *</label>
                  <input
                    type="number"
                    name="startingPrice"
                    value={editFormData.startingPrice}
                    onChange={handleEditChange}
                    min="1"
                    required
                    placeholder="Starting price"
                  />
                  {selectedAuction.status === "Live" && (
                    <small className="warning">⚠️ Changing starting price will not affect current bids</small>
                  )}
                </div>

                {selectedAuction.status === "Live" && (
                  <div className="form-group">
                    <label>Current Bid (₹) - Read Only</label>
                    <input
                      type="number"
                      value={selectedAuction.currentBid?.toLocaleString()}
                      disabled
                      className="readonly-field"
                    />
                    <small>Current bid cannot be edited while auction is live</small>
                  </div>
                )}

                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={editFormData.location}
                    onChange={handleEditChange}
                    required
                    placeholder="Location"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditChange}
                    rows="3"
                    placeholder="Auction description"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="save-btn"
                  onClick={updateAuction}
                  disabled={actionLoading[selectedAuction._id]}
                >
                  {actionLoading[selectedAuction._id] ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Time Modal */}
      {showEndTimeModal && selectedAuction && (
        <div className="modal-overlay" onClick={() => setShowEndTimeModal(false)}>
          <div className="modal-content endtime-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEndTimeModal(false)}>×</button>
            
            <h2>Set Auction End Time</h2>
            
            <div className="endtime-content">
              <div className="auction-summary">
                <img 
                  src={getImageUrl(selectedAuction)} 
                  alt={selectedAuction.fishType}
                  className="summary-image"
                />
                <div className="summary-details">
                  <h3>{selectedAuction.fishType}</h3>
                  <p>Seller: {selectedAuction.sellerName}</p>
                  <p>Quantity: {selectedAuction.quantity} kg</p>
                  <p>Starting Price: ₹{selectedAuction.startingPrice?.toLocaleString()}</p>
                </div>
              </div>

              <div className="duration-options">
                <p>Quick Duration:</p>
                <div className="duration-buttons">
                  <button 
                    type="button"
                    className={`duration-btn ${endTimeData.duration === 12 ? 'active' : ''}`}
                    onClick={() => handleDurationSelect(12)}
                  >
                    12 Hours
                  </button>
                  <button 
                    type="button"
                    className={`duration-btn ${endTimeData.duration === 24 ? 'active' : ''}`}
                    onClick={() => handleDurationSelect(24)}
                  >
                    24 Hours
                  </button>
                  <button 
                    type="button"
                    className={`duration-btn ${endTimeData.duration === 48 ? 'active' : ''}`}
                    onClick={() => handleDurationSelect(48)}
                  >
                    48 Hours
                  </button>
                  <button 
                    type="button"
                    className={`duration-btn ${endTimeData.duration === 72 ? 'active' : ''}`}
                    onClick={() => handleDurationSelect(72)}
                  >
                    72 Hours
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Custom End Time:</label>
                <input
                  type="datetime-local"
                  name="auctionEnd"
                  value={endTimeData.auctionEnd}
                  onChange={handleEndTimeChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className={endTimeError ? "error" : ""}
                />
                {endTimeError && <span className="error-message">{endTimeError}</span>}
              </div>

              <div className="endtime-note">
                <p>⏰ The auction will end at this time unless extended by new bids (10min rule)</p>
              </div>

              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowEndTimeModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="approve-btn"
                  onClick={approveWithEndTime}
                  disabled={actionLoading[selectedAuction._id]}
                >
                  {actionLoading[selectedAuction._id] ? "Processing..." : "Approve & Start Auction"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-content image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowImageModal(false)}>×</button>
            <img src={selectedImage} alt="Auction" className="modal-image-full" />
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAuction && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content details-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            
            <h2>Auction Details</h2>
            
            <div className="details-container">
              <div className="details-image">
                <img 
                  src={getImageUrl(selectedAuction)}
                  alt={selectedAuction.fishType}
                  onClick={() => handleImageClick(getImageUrl(selectedAuction))}
                />
              </div>

              <div className="details-info">
                <h3>{selectedAuction.fishType}</h3>
                <span className={getStatusBadge(selectedAuction.status)}>{selectedAuction.status}</span>
              </div>

              {selectedAuction.status === "Completed" && getAutoCompleteReason(selectedAuction)}

              {selectedAuction.winner && (
                <div className="winner-section">
                  <h4>🏆 Winner</h4>
                  <div className="winner-details">
                    <p><strong>Name:</strong> {selectedAuction.winner.bidderName}</p>
                    <p><strong>Winning Bid:</strong> ₹{selectedAuction.winner.winningBid?.toLocaleString()}</p>
                    <p><strong>Won At:</strong> {formatDateTime(selectedAuction.winner.wonAt)}</p>
                    
                    {selectedAuction.winner.deliveryDetails && (
                      <div className="delivery-details">
                        <h5>Delivery Details</h5>
                        <p><strong>Customer:</strong> {selectedAuction.winner.deliveryDetails.customerName || 'Pending'}</p>
                        <p><strong>Phone:</strong> {selectedAuction.winner.deliveryDetails.customerPhone || 'Pending'}</p>
                        <p><strong>Location:</strong> {selectedAuction.winner.deliveryDetails.deliveryLocation || 'Pending'}</p>
                        <p><strong>Payment:</strong> {selectedAuction.winner.deliveryDetails.paymentMethod || 'Pending'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="details-grid">
                <div className="details-section">
                  <h4>Seller Information</h4>
                  <p><strong>Name:</strong> {selectedAuction.sellerName}</p>
                  <p><strong>Phone:</strong> {selectedAuction.sellerPhone}</p>
                </div>

                <div className="details-section">
                  <h4>Auction Information</h4>
                  <p><strong>Quantity:</strong> {selectedAuction.quantity} kg</p>
                  <p><strong>Location:</strong> {selectedAuction.location}</p>
                  <p><strong>Starting Price:</strong> ₹{selectedAuction.startingPrice?.toLocaleString()}</p>
                  <p><strong>Current Bid:</strong> <span className="highlight">₹{selectedAuction.currentBid?.toLocaleString()}</span></p>
                  <p><strong>Total Bids:</strong> {selectedAuction.bidCount}</p>
                </div>

                <div className="details-section">
                  <h4>Time Information</h4>
                  <p><strong>Started:</strong> {formatDateTime(selectedAuction.createdAt)}</p>
                  {selectedAuction.auctionEnd && (
                    <>
                      <p><strong>Ends:</strong> {formatDateTime(selectedAuction.auctionEnd)}</p>
                      <p><strong>Time Remaining:</strong> {selectedAuction.timeRemaining || 'Ended'}</p>
                    </>
                  )}
                  {selectedAuction.lastBidTime && (
                    <p><strong>Last Bid:</strong> {formatDateTime(selectedAuction.lastBidTime)}</p>
                  )}
                  {selectedAuction.autoCompleteAt && (
                    <p><strong>Completed At:</strong> {formatDateTime(selectedAuction.autoCompleteAt)}</p>
                  )}
                </div>
              </div>

              {selectedAuction.description && (
                <div className="details-description">
                  <h4>Description</h4>
                  <p>{selectedAuction.description}</p>
                </div>
              )}

              {selectedAuction.bids && selectedAuction.bids.length > 0 && (
                <div className="bids-history">
                  <h4>Bid History ({selectedAuction.bidCount} bids)</h4>
                  <div className="bids-list">
                    <table>
                      <thead>
                        <tr>
                          <th>Bidder</th>
                          <th>Amount</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAuction.bids.slice().reverse().map((bid, index) => (
                          <tr key={index}>
                            <td>{bid.bidderName}</td>
                            <td className="bid-amount">₹{bid.amount?.toLocaleString()}</td>
                            <td className="bid-time">{formatDateTime(bid.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              {selectedAuction.status === "Live" && (
                <button 
                  className="complete-btn"
                  onClick={() => {
                    setShowDetailsModal(false);
                    completeAuction(selectedAuction._id);
                  }}
                >
                  Complete Auction Now
                </button>
              )}
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuctions;