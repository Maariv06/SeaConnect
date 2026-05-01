// pages/LiveAuctions.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './LiveAuctions.css';
import { 
  FaClock, FaMapMarkerAlt, FaWeight, FaGavel, FaFire, 
  FaUser, FaPhone, FaInfoCircle, FaTimes, FaBolt,
  FaChartLine, FaTrophy, FaHistory, FaCheckCircle,
  FaArrowUp, FaStar
} from 'react-icons/fa';

// Import fish images for fallback
import seerFishImg from "../assets/fish/seer-fish.jpg";
import tunaImg from "../assets/fish/tuna.jpg";
import sardineImg from "../assets/fish/sardine.jpg";
import mackerelImg from "../assets/fish/mackerel.jpg";
import anchovyImg from "../assets/fish/anchovy.jpg";
import pomfretImg from "../assets/fish/pomfret.jpg";
import barracudaImg from "../assets/fish/barracuda.jpg";
import snapperImg from "../assets/fish/snapper.jpg";
import grouperImg from "../assets/fish/grouper.jpg";
import silverBellyImg from "../assets/fish/silver-belly.jpg";
import threadfinImg from "../assets/fish/threadfin.jpg";
import prawnsImg from "../assets/fish/prawns.jpg";
import tigerPrawnsImg from "../assets/fish/tiger-prawns.jpg";
import shrimpImg from "../assets/fish/shrimp.jpg";
import crabImg from "../assets/fish/crab.jpg";
import squidImg from "../assets/fish/squid.jpg";
import defaultFishImg from "../assets/fish/default-fish.jpg";

const API = "http://localhost:5000/api";
const UPLOADS_URL = "http://localhost:5000/uploads";

// Map fish types to their imported images for fallback
const fishImages = {
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

// Quick bid amounts
const QUICK_BID_AMOUNTS = [50, 100, 200, 500];

function LiveAuctions() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmounts, setBidAmounts] = useState({});
  const [bidding, setBidding] = useState({});
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [bidError, setBidError] = useState("");
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchLiveAuctions();
    
    // Check for expired auctions every 10 seconds
    const checkExpiredInterval = setInterval(checkExpiredAuctions, 10000);
    
    // Refresh auctions every 5 seconds
    const refreshInterval = setInterval(fetchLiveAuctions, 5000);
    
    return () => {
      clearInterval(checkExpiredInterval);
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchLiveAuctions = async () => {
    try {
      const response = await axios.get(`${API}/auction/live`);
      
      if (response.data.success) {
        setAuctions(response.data.data);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching auctions:", err);
      setError("Failed to load auctions");
    } finally {
      setLoading(false);
    }
  };

  // Check for expired auctions (time ended or inactivity)
  const checkExpiredAuctions = async () => {
    try {
      const response = await axios.post(`${API}/auction/check-expired`);
      
      if (response.data.success) {
        const results = response.data.data;
        
        // If any auctions were completed, show notification and refresh
        if (results.timeEnded?.length > 0 || results.inactivityEnded?.length > 0) {
          console.log("✅ Auctions auto-completed:", results);
          
          // Show notification for completed auctions
          const totalCompleted = (results.timeEnded?.length || 0) + (results.inactivityEnded?.length || 0);
          alert(`🔔 ${totalCompleted} auction(s) have ended automatically!`);
          
          // Refresh auctions
          fetchLiveAuctions();
        }
      }
    } catch (err) {
      console.error("Error checking expired auctions:", err);
    }
  };

  const handleImageError = (auctionId) => {
    setImageErrors(prev => ({
      ...prev,
      [auctionId]: true
    }));
  };

  const getFishImage = (auction) => {
    if (imageErrors[auction._id]) {
      return fishImages[auction.fishType] || defaultFishImg;
    }
    
    if (auction.image && auction.image !== "default-fish.jpg") {
      return `${UPLOADS_URL}/${auction.image}`;
    }
    
    return fishImages[auction.fishType] || defaultFishImg;
  };

  const handleViewDetails = (auction) => {
    setSelectedAuction(auction);
    setShowDetailsModal(true);
  };

  const handlePlaceBid = (auction) => {
    if (!user) {
      alert("Please login to place a bid");
      return;
    }
    setSelectedAuction(auction);
    const defaultBid = auction.currentBid + 50;
    setBidAmounts({ ...bidAmounts, [auction._id]: defaultBid });
    setBidError("");
    setShowBidModal(true);
  };

  const handleBidChange = (auctionId, value) => {
    setBidAmounts({ ...bidAmounts, [auctionId]: value });
    setBidError("");
  };

  const handleQuickBid = (auctionId, amount) => {
    const currentAmount = bidAmounts[auctionId] ? parseFloat(bidAmounts[auctionId]) : 0;
    const newAmount = currentAmount + amount;
    setBidAmounts({ ...bidAmounts, [auctionId]: newAmount });
    setBidError("");
  };

  const handleBidSubmit = async () => {
    const bidAmount = bidAmounts[selectedAuction._id];
    
    if (!bidAmount) {
      setBidError("Please enter a bid amount");
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setBidError("Please enter a valid amount");
      return;
    }

    const minIncrement = 50;
    const minBid = selectedAuction.currentBid + minIncrement;
    
    if (amount <= selectedAuction.currentBid) {
      setBidError(`Bid must be greater than current bid ₹${selectedAuction.currentBid}`);
      return;
    }

    if (amount < minBid) {
      setBidError(`Minimum bid increment is ₹${minIncrement}. Minimum bid: ₹${minBid}`);
      return;
    }

    setBidding(prev => ({ ...prev, [selectedAuction._id]: true }));

    try {
      console.log("Placing bid:", {
        auctionId: selectedAuction._id,
        bidderId: user._id || user.id,
        bidderName: user.fullName || user.name || "Anonymous",
        amount: amount
      });

      const response = await axios.post(`${API}/auction/${selectedAuction._id}/bid`, {
        bidderId: user._id || user.id,
        bidderName: user.fullName || user.name || "Anonymous",
        amount: amount
      });

      if (response.data.success) {
        alert(`✅ Your bid of ₹${amount} was placed successfully!`);
        setShowBidModal(false);
        
        // Refresh auctions immediately to show updated bid
        fetchLiveAuctions();
      }
    } catch (err) {
      console.error("Error placing bid:", err);
      
      if (err.response) {
        console.error("Server response:", err.response.data);
        setBidError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setBidError("No response from server. Please check your connection.");
      } else {
        setBidError("Error: " + err.message);
      }
    } finally {
      setBidding(prev => ({ ...prev, [selectedAuction._id]: false }));
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const isSeller = (auction) => {
    return user && (user._id === auction.sellerId || user.id === auction.sellerId);
  };

  const isHighestBidder = (auction) => {
    if (!user || !auction.bids || auction.bids.length === 0) return false;
    const lastBid = auction.bids[auction.bids.length - 1];
    return lastBid.bidderId === (user._id || user.id);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // UPDATED: Enhanced time formatting function
  const formatTimeRemaining = (timeRemaining, auctionEnd) => {
    // If no time remaining string provided
    if (!timeRemaining || timeRemaining === "Ended") {
      // Calculate from auctionEnd if available
      if (auctionEnd) {
        const now = new Date();
        const end = new Date(auctionEnd);
        const diffMs = end - now;
        
        if (diffMs <= 0) {
          return "Ending soon";
        }
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        if (hours === 0 && minutes === 0) {
          return `${seconds}s`;
        }
        if (hours === 0) {
          return `${minutes}m ${seconds}s`;
        }
        return `${hours}h ${minutes}m`;
      }
      return "Ending soon"; // Default message instead of "Ended"
    }
    
    // Parse the timeRemaining string
    const hoursMatch = timeRemaining.match(/(\d+)h/);
    const minutesMatch = timeRemaining.match(/(\d+)m/);
    const secondsMatch = timeRemaining.match(/(\d+)s/);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;
    
    // If total time is less than 1 minute
    if (hours === 0 && minutes === 0) {
      if (seconds <= 10) {
        return "Ending now";
      }
      return `${seconds}s`;
    }
    
    // If less than 5 minutes remaining
    if (hours === 0 && minutes < 5) {
      return `${minutes}m ${seconds}s`;
    }
    
    // Regular format
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    
    return "Ending soon";
  };

  // Calculate time remaining until auction end
  const getTimeUntilEnd = (auctionEnd) => {
    const now = new Date();
    const end = new Date(auctionEnd);
    const diffMs = end - now;
    
    if (diffMs <= 0) return 0;
    
    return Math.floor(diffMs / 1000); // Return seconds
  };

  // Check if auction is ending soon
  const isEndingSoon = (auctionEnd) => {
    const secondsUntilEnd = getTimeUntilEnd(auctionEnd);
    return secondsUntilEnd > 0 && secondsUntilEnd < 300; // Less than 5 minutes
  };

  // Check if auction is critical (ending within 1 minute)
  const isCritical = (auctionEnd) => {
    const secondsUntilEnd = getTimeUntilEnd(auctionEnd);
    return secondsUntilEnd > 0 && secondsUntilEnd < 60; // Less than 1 minute
  };

  if (loading) {
    return (
      <div className="auctions-loading">
        <div className="loading-spinner"></div>
        <p>Loading live auctions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auctions-error">
        <p>❌ {error}</p>
        <button onClick={fetchLiveAuctions} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="auctions-container">
      <div className="auctions-header">
        <div className="header-content">
          <h1><FaGavel className="header-icon" /> LIVE AUCTIONS</h1>
          <p className="subtitle">Real-time fish bidding platform</p>
        </div>
        <div className="live-indicator red">
          <span className="pulse-dot red-dot"></span>
          <span className="live-text">{auctions.length} Active Auction{auctions.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {auctions.length === 0 ? (
        <div className="no-auctions">
          <div className="no-auctions-icon">🔨</div>
          <h3>No Live Auctions</h3>
          <p>There are no active auctions at the moment</p>
          <button onClick={() => navigate("/create-auction")} className="create-auction-btn">
            Start an Auction
          </button>
        </div>
      ) : (
        <div className="auctions-grid">
          {auctions.map((auction) => {
            const isUserHighestBidder = isHighestBidder(auction);
            const timeLeft = formatTimeRemaining(auction.timeRemaining, auction.auctionEnd);
            const endingSoon = isEndingSoon(auction.auctionEnd);
            const critical = isCritical(auction.auctionEnd);
            
            return (
              <div className="auction-card" key={auction._id}>
                <div className="live-badge red-badge">
                  <FaFire className="fire-icon" />
                  <span>LIVE NOW</span>
                  <span className="bid-count">{auction.bidCount || 0} bids</span>
                </div>

                <div className="auction-image" onClick={() => handleImageClick(getFishImage(auction))}>
                  <img 
                    src={getFishImage(auction)} 
                    alt={auction.fishType}
                    onError={() => handleImageError(auction._id)}
                  />
                  <div className="image-overlay">
                    <span className="zoom-icon">🔍</span>
                  </div>
                </div>

                <div className="auction-details">
                  <div className="auction-header">
                    <h2>{auction.fishType}</h2>
                    {isSeller(auction) && (
                      <span className="seller-badge">Your Auction</span>
                    )}
                    {isUserHighestBidder && !isSeller(auction) && (
                      <span className="highest-bidder-badge">
                        <FaStar /> Highest Bidder
                      </span>
                    )}
                  </div>
                  
                  <div className={`timer-section ${endingSoon ? 'ending-soon' : ''} ${critical ? 'critical' : ''}`}>
                    <FaClock className="timer-icon" />
                    <span className={`timer-value ${critical ? 'blink' : ''}`}>
                      {timeLeft}
                    </span>
                    {endingSoon && (
                      <span className="urgent-badge">
                        <FaBolt /> {critical ? 'Ending Now' : 'Ending Soon'}
                      </span>
                    )}
                  </div>

                  <div className="bid-info">
                    <div className="current-bid">
                      <span className="bid-label">Current Bid</span>
                      <span className="bid-amount">₹{auction.currentBid?.toLocaleString()}</span>
                    </div>
                    <div className="bid-stats">
                      <span><FaChartLine /> {auction.bidCount} bids</span>
                    </div>
                  </div>

                  <div className="auction-meta">
                    <div className="meta-item">
                      <FaWeight className="meta-icon" />
                      <span>{auction.quantity} kg</span>
                    </div>
                    <div className="meta-item">
                      <FaMapMarkerAlt className="meta-icon" />
                      <span>{auction.location}</span>
                    </div>
                    <div className="meta-item">
                      <FaUser className="meta-icon" />
                      <span>{auction.sellerName}</span>
                    </div>
                  </div>

                  {isUserHighestBidder && !isSeller(auction) && (
                    <div className="highest-bidder-message">
                      <FaCheckCircle /> You have the highest bid!
                    </div>
                  )}

                  <div className="auction-actions">
                    <button 
                      className="view-details-btn"
                      onClick={() => handleViewDetails(auction)}
                    >
                      <FaInfoCircle /> Details
                    </button>
                    <button 
                      className="place-bid-btn"
                      onClick={() => handlePlaceBid(auction)}
                      disabled={!user || isSeller(auction)}
                    >
                      {isSeller(auction) ? "Your Auction" : "Place Bid"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAuction && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content details-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
              <FaTimes />
            </button>
            
            <h2>Auction Details</h2>
            
            <div className="details-container">
              <div className="details-image" onClick={() => handleImageClick(getFishImage(selectedAuction))}>
                <img 
                  src={getFishImage(selectedAuction)} 
                  alt={selectedAuction.fishType}
                />
              </div>

              <div className="details-header">
                <h3>{selectedAuction.fishType}</h3>
                <span className="live-badge-small red">LIVE</span>
              </div>

              <div className="details-grid">
                <div className="detail-section">
                  <h4>Auction Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Quantity:</span>
                    <span className="detail-value">{selectedAuction.quantity} kg</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Starting Price:</span>
                    <span className="detail-value">{formatCurrency(selectedAuction.startingPrice)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Current Bid:</span>
                    <span className="detail-value highlight">{formatCurrency(selectedAuction.currentBid)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Bids:</span>
                    <span className="detail-value">{selectedAuction.bidCount}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Time & Location</h4>
                  <div className="detail-item">
                    <span className="detail-label">Time Left:</span>
                    <span className="detail-value">
                      {formatTimeRemaining(selectedAuction.timeRemaining, selectedAuction.auctionEnd)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">End Time:</span>
                    <span className="detail-value">{new Date(selectedAuction.auctionEnd).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{selectedAuction.location}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Seller Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedAuction.sellerName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contact:</span>
                    <span className="detail-value">
                      <a href={`tel:${selectedAuction.sellerPhone}`}>
                        {selectedAuction.sellerPhone}
                      </a>
                    </span>
                  </div>
                </div>
              </div>

              {selectedAuction.description && (
                <div className="description-section">
                  <h4>Description</h4>
                  <p>{selectedAuction.description}</p>
                </div>
              )}

              {/* Bid History */}
              {selectedAuction.bids && selectedAuction.bids.length > 0 && (
                <div className="bid-history-section">
                  <h4><FaHistory /> Bid History</h4>
                  <div className="bid-history-list">
                    {selectedAuction.bids.map((bid, index) => (
                      <div key={index} className={`bid-history-item ${bid.bidderId === (user?._id || user?.id) ? 'current-user-bid' : ''}`}>
                        <span className="bidder-name">{bid.bidderName}</span>
                        <span className="bidder-amount">{formatCurrency(bid.amount)}</span>
                        <span className="bidder-time">{new Date(bid.timestamp).toLocaleString()}</span>
                        {bid.bidderId === (user?._id || user?.id) && (
                          <span className="your-bid-tag">Your Bid</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                {!isSeller(selectedAuction) && (
                  <button 
                    className="bid-now-btn"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handlePlaceBid(selectedAuction);
                    }}
                  >
                    Place Bid
                  </button>
                )}
                <button className="close-btn" onClick={() => setShowDetailsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && selectedAuction && (
        <div className="modal-overlay" onClick={() => setShowBidModal(false)}>
          <div className="modal-content bid-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBidModal(false)}>
              <FaTimes />
            </button>
            
            <h2>Place Your Bid</h2>
            
            <div className="bid-modal-content">
              <div className="bid-summary">
                <img 
                  src={getFishImage(selectedAuction)} 
                  alt={selectedAuction.fishType} 
                  className="bid-image"
                />
                <div className="bid-info">
                  <h3>{selectedAuction.fishType}</h3>
                  <p>Current Bid: <strong>₹{selectedAuction.currentBid?.toLocaleString()}</strong></p>
                  <p>Minimum Next Bid: <strong>₹{(selectedAuction.currentBid + 50).toLocaleString()}</strong></p>
                </div>
              </div>

              {/* Quick Bid Buttons */}
              <div className="quick-bid-section">
                <p className="quick-bid-label">Quick Add:</p>
                <div className="quick-bid-buttons">
                  {QUICK_BID_AMOUNTS.map(amount => (
                    <button
                      key={amount}
                      className="quick-bid-btn"
                      onClick={() => handleQuickBid(selectedAuction._id, amount)}
                      type="button"
                    >
                      +₹{amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bid-input-group">
                <label htmlFor="bidAmount">Your Bid Amount (₹)</label>
                <input
                  type="number"
                  id="bidAmount"
                  value={bidAmounts[selectedAuction._id] || ''}
                  onChange={(e) => handleBidChange(selectedAuction._id, e.target.value)}
                  placeholder={`Min: ₹${selectedAuction.currentBid + 50}`}
                  min={selectedAuction.currentBid + 50}
                  step="50"
                />
                {bidError && <p className="bid-error">{bidError}</p>}
              </div>

              <div className="bid-tips">
                <p><FaCheckCircle /> Minimum increment: ₹50</p>
                <p><FaCheckCircle /> Your bid will be recorded instantly</p>
                <p><FaCheckCircle /> Auction ends after 5 minutes of no bids</p>
                <p><FaCheckCircle /> Highest bidder wins automatically at end</p>
              </div>

              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowBidModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-bid-btn"
                  onClick={handleBidSubmit}
                  disabled={bidding[selectedAuction._id]}
                >
                  {bidding[selectedAuction._id] ? "Placing Bid..." : "Confirm Bid"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-content image-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowImageModal(false)}>
              <FaTimes />
            </button>
            <img src={selectedImage} alt="Auction" className="fullscreen-image" />
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveAuctions;