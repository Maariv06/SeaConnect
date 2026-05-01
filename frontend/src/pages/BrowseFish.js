// pages/BrowseFish.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./BrowseFish.css";

// Import Stripe
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../utils/stripeConfig';

// Import Wallet
import { useWallet } from '../context/WalletContext';
import WalletPayment from '../components/WalletPayment';

// Import fish images directly
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

// Map fish types to their imported images
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

// Major Tamil Nadu cities for delivery dropdown
const TAMIL_NADU_CITIES = [
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
  "Tirunelveli", "Vellore", "Erode", "Thoothukudi", "Thanjavur",
  "Dindigul", "Kanyakumari", "Karur", "Cuddalore", "Kanchipuram",
  "Tiruppur", "Nagercoil", "Virudhunagar", "Sivakasi", "Hosur",
  "Ooty", "Kodaikanal", "Rameswaram", "Karaikudi", "Nagapattinam",
  "Ramanathapuram", "Theni", "Tenkasi", "Kovilpatti", "Tiruchendur"
].sort();

// Platform fee percentage (8%)
const PLATFORM_FEE_PERCENTAGE = 8;

// Distance calculator based on seller and buyer locations
const calculateDistance = (sellerLocation, deliveryLocation) => {
  console.log("📍 Calculating distance from:", sellerLocation, "to:", deliveryLocation);
  
  if (!sellerLocation || !deliveryLocation) {
    console.warn("⚠️ Missing location data", { sellerLocation, deliveryLocation });
    return 100;
  }
  
  const from = sellerLocation.toString().trim().toLowerCase();
  const to = deliveryLocation.toString().trim().toLowerCase();
  
  if (from === to) {
    return 10;
  }
  
  const distanceMatrix = {
    "chennai": {
      "coimbatore": 500, "madurai": 460, "tirunelveli": 600, "thoothukudi": 600,
      "salem": 340, "vellore": 140, "erode": 400, "thanjavur": 330,
      "kanyakumari": 700, "tiruchirappalli": 330, "default": 300
    },
    "coimbatore": {
      "chennai": 500, "madurai": 200, "tirunelveli": 300, "thoothukudi": 350,
      "salem": 160, "erode": 100, "default": 250
    },
    "madurai": {
      "chennai": 460, "coimbatore": 200, "tirunelveli": 150, "thoothukudi": 160,
      "kanyakumari": 240, "ramanathapuram": 120, "default": 200
    },
    "tirunelveli": {
      "chennai": 600, "coimbatore": 300, "madurai": 150, "thoothukudi": 55,
      "kanyakumari": 90, "tenkasi": 70, "default": 150
    },
    "thoothukudi": {
      "chennai": 600, "coimbatore": 350, "madurai": 160, "tirunelveli": 55,
      "tiruchendur": 50, "kovilpatti": 60, "default": 150
    },
    "salem": {
      "chennai": 340, "coimbatore": 160, "erode": 120, "default": 200
    },
    "kanyakumari": {
      "tirunelveli": 90, "thoothukudi": 140, "madurai": 240, "nagercoil": 20,
      "default": 200
    }
  };
  
  try {
    if (distanceMatrix[from] && distanceMatrix[from][to]) {
      return distanceMatrix[from][to];
    }
    if (distanceMatrix[to] && distanceMatrix[to][from]) {
      return distanceMatrix[to][from];
    }
  } catch (error) {
    console.log("⚠️ Distance matrix lookup failed", error);
  }
  
  return Math.abs(from.length - to.length) * 15 + 80;
};

// Calculate transport charge based on rules
const calculateTransportCharge = (distance, weight) => {
  if (distance <= 20 && weight <= 15) {
    return 50;
  }

  let transportCost = (distance * 0.011 * weight);
  
  let handlingFee = 0;
  if (distance <= 100) {
    handlingFee = 50;
  } else if (distance <= 400) {
    handlingFee = 100;
  } else {
    handlingFee = 200;
  }
  
  return Math.round(transportCost + handlingFee);
};

// Calculate platform fee (8% of fish price)
const calculatePlatformFee = (fishPrice) => {
  return Math.round(fishPrice * (PLATFORM_FEE_PERCENTAGE / 100));
};

// Calculate seller amount (92% of fish price)
const calculateSellerAmount = (fishPrice) => {
  return fishPrice - calculatePlatformFee(fishPrice);
};

// Stripe payment form component
const StripePaymentForm = ({ orderData, onSuccess, onError, onCancel, totalAmount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setCardError(null);

    if (!stripe || !elements) {
      setCardError("Stripe hasn't loaded yet. Please try again.");
      setProcessing(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      const { data: paymentIntentData } = await axios.post(`${API}/payment/create-payment-intent`, {
        amount: totalAmount,
        currency: 'inr',
        orderData: orderData
      });

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: orderData.customerName,
              email: orderData.customerEmail || '',
              phone: orderData.customerPhone,
            },
          },
        }
      );

      if (error) {
        setCardError(error.message);
        onError(error.message);
      } else {
        if (paymentIntent.status === 'succeeded') {
          orderData.paymentStatus = "Paid";
          orderData.stripePaymentIntentId = paymentIntent.id;
          await onSuccess(orderData);
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      setCardError(error.response?.data?.message || "Payment failed. Please try again.");
      onError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      {cardError && <div className="payment-error">{cardError}</div>}
      <button 
        type="submit" 
        disabled={!stripe || processing}
        className="stripe-pay-btn"
      >
        {processing ? "Processing..." : `Pay ₹${totalAmount.toLocaleString()}`}
      </button>
    </form>
  );
};

function BrowseFish() {
  const navigate = useNavigate();
  const { walletBalance, deductMoney, refreshWalletData } = useWallet();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    fishType: "",
    maxPrice: "",
    location: ""
  });
  const [selectedListing, setSelectedListing] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    customerPhone: "",
    deliveryLocation: "",
    quantity: "",
    paymentMethod: "cash",
    specialInstructions: ""
  });
  const [orderErrors, setOrderErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  
  // Transport calculation states
  const [distance, setDistance] = useState(0);
  const [transportCharge, setTransportCharge] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [sellerAmount, setSellerAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [fishTotal, setFishTotal] = useState(0);

  // Get current user
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      console.log("Current user loaded:", user);
    } else {
      console.log("No user logged in");
      setCurrentUser(null);
    }
  }, []);

  // Fetch listings
  useEffect(() => {
    fetchVerifiedListings();
  }, [currentUser]);

  // Calculate charges when quantity or delivery location changes
  useEffect(() => {
    if (selectedListing && orderForm.quantity && orderForm.deliveryLocation) {
      calculateAllCharges();
    }
  }, [orderForm.quantity, orderForm.deliveryLocation, selectedListing]);

  const fetchVerifiedListings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/fish/verified`);
      
      let listingsData = [];
      
      if (response.data && response.data.data) {
        listingsData = response.data.data;
      } else if (response.data && response.data.fish) {
        listingsData = response.data.fish;
      } else if (Array.isArray(response.data)) {
        listingsData = response.data;
      } else if (response.data && Array.isArray(response.data.listings)) {
        listingsData = response.data.listings;
      }
      
      // Filter by status and availability
      let filteredListings = listingsData.filter(listing => {
        const status = listing.status || '';
        const availableQty = listing.availableQuantity || 0;
        return status === "Verified" && availableQty > 0;
      });
      
      // Remove current user's own listings
      if (currentUser && filteredListings.length > 0) {
        const userId = currentUser._id || currentUser.id;
        filteredListings = filteredListings.filter(listing => {
          const listingSellerId = listing.sellerId ? listing.sellerId.toString() : '';
          return listingSellerId !== userId;
        });
      }
      
      setListings(filteredListings);
      
    } catch (error) {
      console.error("❌ Error fetching listings:", error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value
    });
  };

  const handlePlaceOrder = (listing) => {
    setSelectedListing(listing);
    setOrderForm({
      customerName: currentUser?.fullName || currentUser?.name || "",
      customerPhone: currentUser?.phone || "",
      deliveryLocation: "",
      quantity: "",
      paymentMethod: "cash",
      specialInstructions: ""
    });
    setDistance(0);
    setTransportCharge(0);
    setPlatformFee(0);
    setSellerAmount(0);
    setFishTotal(0);
    setGrandTotal(0);
    setOrderErrors({});
    setShowOrderModal(true);
  };

  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    setOrderForm({
      ...orderForm,
      [name]: value
    });
    if (orderErrors[name]) {
      setOrderErrors({
        ...orderErrors,
        [name]: ""
      });
    }
  };

  const calculateAllCharges = () => {
    if (!selectedListing || !orderForm.quantity || !orderForm.deliveryLocation) {
      return;
    }
    
    const sellerLocation = selectedListing.location || selectedListing.pickupLocation || "Thoothukudi";
    const fishTotalCalc = Number(orderForm.quantity) * Number(selectedListing.pricePerKg);
    setFishTotal(fishTotalCalc);
    
    const calculatedDistance = calculateDistance(sellerLocation, orderForm.deliveryLocation);
    setDistance(calculatedDistance);
    
    const weight = Number(orderForm.quantity);
    const charge = calculateTransportCharge(calculatedDistance, weight);
    setTransportCharge(charge);
    
    const fee = calculatePlatformFee(fishTotalCalc);
    setPlatformFee(fee);
    
    const sellerAmt = calculateSellerAmount(fishTotalCalc);
    setSellerAmount(sellerAmt);
    
    setGrandTotal(fishTotalCalc + charge);
    
    console.log("💰 FINAL PRICE:", {
      fishTotal: fishTotalCalc,
      transportCharge: charge,
      grandTotal: fishTotalCalc + charge
    });
  };

  const validateOrderForm = () => {
    const errors = {};
    
    if (!orderForm.customerName.trim()) {
      errors.customerName = "Name is required";
    }
    
    if (!orderForm.customerPhone.trim()) {
      errors.customerPhone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(orderForm.customerPhone)) {
      errors.customerPhone = "Enter valid 10-digit number";
    }
    
    if (!orderForm.deliveryLocation.trim()) {
      errors.deliveryLocation = "Delivery location is required";
    }
    
    if (!orderForm.quantity) {
      errors.quantity = "Quantity is required";
    } else if (orderForm.quantity < 1) {
      errors.quantity = "Minimum quantity is 1 kg";
    } else if (orderForm.quantity > selectedListing.availableQuantity) {
      errors.quantity = `Only ${selectedListing.availableQuantity} kg available`;
    }
    
    return errors;
  };

  const createOrder = async (orderData) => {
    try {
      setSubmitting(true);
      
      // Make sure selectedListing exists
      if (!selectedListing) {
        throw new Error("No listing selected");
      }

      const finalOrderData = {
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail || currentUser?.email || '',
        deliveryLocation: orderData.deliveryLocation,
        fishId: selectedListing._id,
        fishType: selectedListing.fishType,
        sellerId: selectedListing.sellerId,
        sellerName: selectedListing.sellerName,
        sellerPhone: selectedListing.phone,
        pricePerKg: Number(selectedListing.pricePerKg),
        quantity: Number(orderData.quantity),
        totalAmount: fishTotal,
        transportCharge: transportCharge,
        platformFee: platformFee,
        sellerAmount: sellerAmount,
        grandTotal: grandTotal,
        distance: distance,
        sellerLocation: selectedListing?.location || selectedListing?.pickupLocation || "Thoothukudi",
        deliveryCity: orderForm.deliveryLocation,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus || (orderData.paymentMethod === "cash" ? "Pending" : "Paid"),
        specialInstructions: orderData.specialInstructions || "",
        orderType: "regular",
        status: "Pending",
        orderDate: new Date().toISOString()
      };

      // Add payment fields if present
      if (orderData.stripePaymentIntentId) {
        finalOrderData.stripePaymentIntentId = orderData.stripePaymentIntentId;
      }
      
      if (orderData.walletTransactionId) {
        finalOrderData.walletTransactionId = orderData.walletTransactionId;
      }

      console.log("Creating order with data:", finalOrderData);

      const response = await axios.post(`${API}/orders/create`, finalOrderData, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.data.success) {
        let message = orderData.paymentMethod === "cash"
          ? `✅ Order placed!\nFish: ₹${Math.round(fishTotal).toLocaleString()}\nDelivery: ₹${Math.round(transportCharge).toLocaleString()}\nTotal: ₹${Math.round(grandTotal).toLocaleString()}`
          : `✅ Payment successful!\nTotal: ₹${Math.round(grandTotal).toLocaleString()}`;

        alert(message);

        // CLOSE ALL MODALS
        setShowOrderModal(false);
        setShowStripeModal(false);
        setShowWalletModal(false);

        // Refresh wallet balance and listings
        await refreshWalletData();
        await fetchVerifiedListings();

        // Navigate
        if (window.confirm("View your orders?")) {
          navigate("/my-activity");
        }
      }
    } catch (error) {
      console.error("❌ Error creating order:", error);
      alert(error.response?.data?.message || "Error placing order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStripeSuccess = async (orderData) => {
    await createOrder(orderData);
  };

  const handleStripeError = (error) => {
    console.error("Stripe error:", error);
    alert("Payment failed. Please try again.");
    setSubmitting(false);
  };

  // FIXED: handleWalletSuccess - NO duplicate deduction, just create order
  const handleWalletSuccess = async (orderData) => {
    try {
      console.log("Wallet payment success, creating order with data:", orderData);
      
      // IMPORTANT: The WalletPayment component already called deductMoney
      // and passed the walletTransactionId in orderData
      // So we just need to create the order with the transaction ID
      
      await createOrder(orderData);
      
    } catch (error) {
      console.error("Wallet success error:", error);
      alert("Order creation failed: " + error.message);
      setSubmitting(false);
    }
  };

  const handleWalletError = (error) => {
    console.error("Wallet error:", error);
    alert(error || "Payment failed. Please try again.");
    setSubmitting(false);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateOrderForm();
    if (Object.keys(errors).length > 0) {
      setOrderErrors(errors);
      return;
    }

    setSubmitting(true);

    // Save current values for order creation
    const currentFishTotal = fishTotal;
    const currentTransportCharge = transportCharge;
    const currentGrandTotal = grandTotal;
    const currentDistance = distance;
    const currentPlatformFee = platformFee;
    const currentSellerAmount = sellerAmount;
    const currentOrderForm = { ...orderForm };
    const currentSelectedListing = selectedListing;

    const orderData = {
      customerName: currentOrderForm.customerName.trim(),
      customerPhone: currentOrderForm.customerPhone.trim(),
      customerEmail: currentUser?.email || '',
      deliveryLocation: currentOrderForm.deliveryLocation.trim(),
      fishId: currentSelectedListing._id,
      fishType: currentSelectedListing.fishType,
      sellerId: currentSelectedListing.sellerId,
      sellerName: currentSelectedListing.sellerName,
      sellerPhone: currentSelectedListing.phone,
      pricePerKg: Number(currentSelectedListing.pricePerKg),
      quantity: Number(currentOrderForm.quantity),
      totalAmount: currentFishTotal,
      transportCharge: currentTransportCharge,
      platformFee: currentPlatformFee,
      sellerAmount: currentSellerAmount,
      grandTotal: currentGrandTotal,
      distance: currentDistance,
      sellerLocation: currentSelectedListing?.location || currentSelectedListing?.pickupLocation,
      deliveryCity: currentOrderForm.deliveryLocation,
      paymentMethod: currentOrderForm.paymentMethod,
      specialInstructions: currentOrderForm.specialInstructions.trim() || "",
      orderType: "regular"
    };

    if (currentOrderForm.paymentMethod === "wallet") {
      if (walletBalance < currentGrandTotal) {
        alert(`Need ₹${Math.round(currentGrandTotal - walletBalance).toLocaleString()} more in wallet`);
        setSubmitting(false);
        return;
      }
      setPendingOrderData(orderData);
      setShowOrderModal(false);
      setShowWalletModal(true);
      setSubmitting(false);
    } else if (currentOrderForm.paymentMethod === "online") {
      setPendingOrderData(orderData);
      setShowOrderModal(false);
      setShowStripeModal(true);
      setSubmitting(false);
    } else {
      await createOrder(orderData);
    }
  };

  const calculateFishTotal = () => {
    if (selectedListing && orderForm.quantity) {
      return orderForm.quantity * selectedListing.pricePerKg;
    }
    return 0;
  };

  const calculateTotalValue = (listing) => {
    return listing.pricePerKg * listing.availableQuantity;
  };

  const getFishImage = (fishType) => {
    return fishImageMap[fishType] || defaultFishImg;
  };

  const filteredListings = listings.filter(listing => {
    const matchesFishType = filter.fishType === "" || 
      listing.fishType?.toLowerCase() === filter.fishType.toLowerCase();
    
    const matchesPrice = filter.maxPrice === "" || 
      listing.pricePerKg <= parseFloat(filter.maxPrice);

    const matchesLocation = filter.location === "" || 
      listing.location?.toLowerCase().includes(filter.location.toLowerCase()) ||
      listing.pickupLocation?.toLowerCase().includes(filter.location.toLowerCase());

    return matchesFishType && matchesPrice && matchesLocation;
  });

  const uniqueFishTypes = [...new Set(listings.map(l => l.fishType).filter(Boolean))];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading fresh catches...</p>
      </div>
    );
  }

  return (
    <div className="browse-container">
      <div className="browse-header">
        <h1>🐟 SeaConnect Fish Market</h1>
        {currentUser && (
          <p className="welcome-message">
            Welcome, {currentUser.fullName || currentUser.name}! 
            {walletBalance > 0 && (
              <span className="wallet-balance-header">
                💰 Wallet: ₹{Math.round(walletBalance).toLocaleString()}
              </span>
            )}
          </p>
        )}
      </div>
      
      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-group">
          <select name="fishType" onChange={handleFilterChange} value={filter.fishType}>
            <option value="">All Fish Types</option>
            {uniqueFishTypes.map((type, index) => (
              <option key={index} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <input 
            type="number" 
            name="maxPrice" 
            placeholder="Max price per kg"
            value={filter.maxPrice}
            onChange={handleFilterChange}
            min="0"
          />
        </div>

        <div className="filter-group">
          <input 
            type="text" 
            name="location" 
            placeholder="Filter by location"
            value={filter.location}
            onChange={handleFilterChange}
          />
        </div>

        <button className="clear-filter-btn" onClick={() => setFilter({ fishType: "", maxPrice: "", location: "" })}>
          Clear Filters
        </button>
      </div>

      <div className="results-count">
        Found <strong>{filteredListings.length}</strong> listings
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🐟</div>
          <h3>No listings found</h3>
          <p>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="listings-grid">
          {filteredListings.map(listing => (
            <div key={listing._id} className="listing-card">
              <div className="listing-image">
                <img 
                  src={getFishImage(listing.fishType)} 
                  alt={listing.fishType}
                  className="fish-img"
                  onError={(e) => e.target.src = defaultFishImg}
                />
              </div>

              <h3 className="fish-title">{listing.fishType}</h3>

              <div className="details-list">
                <div className="detail-item">
                  <span className="detail-label">Available:</span>
                  <span className="detail-value highlight">{listing.availableQuantity} kg</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Price:</span>
                  <span className="detail-value price">₹{Math.round(listing.pricePerKg)}/kg</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Total Value:</span>
                  <span className="detail-value total">₹{Math.round(calculateTotalValue(listing)).toLocaleString()}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Seller:</span>
                  <span className="detail-value">{listing.sellerName}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">From:</span>
                  <span className="detail-value location">
                    📍 {listing.location || listing.pickupLocation || "Thoothukudi"}
                  </span>
                </div>
              </div>

              <button 
                className="order-btn"
                onClick={() => handlePlaceOrder(listing)}
                disabled={listing.availableQuantity === 0}
              >
                {listing.availableQuantity > 0 ? "📦 Place Order" : "Sold Out"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && selectedListing && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content order-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowOrderModal(false)}>×</button>
            
            <h2>Place Your Order</h2>
            
            <div className="location-verify" style={{
              background: '#e3f2fd',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid #90caf9'
            }}>
              <p style={{margin: '5px 0', color: '#1976d2', fontWeight: 'bold'}}>
                📍 Seller Location: {selectedListing.location || selectedListing.pickupLocation || "Thoothukudi"}
              </p>
            </div>

            <div className="order-summary">
              <div className="summary-image">
                <img 
                  src={getFishImage(selectedListing.fishType)} 
                  alt={selectedListing.fishType}
                  onError={(e) => e.target.src = defaultFishImg}
                />
              </div>
              <div className="summary-details">
                <h3>{selectedListing.fishType}</h3>
                <p>Seller: {selectedListing.sellerName}</p>
                <p>From: 📍 {selectedListing.location || selectedListing.pickupLocation || "Thoothukudi"}</p>
                <p>Price: ₹{Math.round(selectedListing.pricePerKg)}/kg</p>
                <p className="available-info">Available: <strong>{selectedListing.availableQuantity} kg</strong></p>
              </div>
            </div>

            <form onSubmit={handleOrderSubmit} className="order-form">
              <input
                type="text"
                name="customerName"
                placeholder="Your Name *"
                value={orderForm.customerName}
                onChange={handleOrderChange}
                className={orderErrors.customerName ? "error" : ""}
                disabled={submitting}
              />
              {orderErrors.customerName && <span className="error-message">{orderErrors.customerName}</span>}

              <input
                type="tel"
                name="customerPhone"
                placeholder="Phone Number *"
                value={orderForm.customerPhone}
                onChange={handleOrderChange}
                maxLength="10"
                className={orderErrors.customerPhone ? "error" : ""}
                disabled={submitting}
              />
              {orderErrors.customerPhone && <span className="error-message">{orderErrors.customerPhone}</span>}

              <div className="form-group">
                <select
                  name="deliveryLocation"
                  value={orderForm.deliveryLocation}
                  onChange={handleOrderChange}
                  className={orderErrors.deliveryLocation ? "error" : ""}
                  disabled={submitting}
                  required
                >
                  <option value="">Select Delivery City *</option>
                  {TAMIL_NADU_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {orderErrors.deliveryLocation && <span className="error-message">{orderErrors.deliveryLocation}</span>}
              </div>

              <input
                type="number"
                name="quantity"
                placeholder={`Quantity (KG) * (Max: ${selectedListing.availableQuantity} kg)`}
                min="1"
                max={selectedListing.availableQuantity}
                step="0.5"
                value={orderForm.quantity}
                onChange={handleOrderChange}
                className={orderErrors.quantity ? "error" : ""}
                disabled={submitting}
              />
              {orderErrors.quantity && <span className="error-message">{orderErrors.quantity}</span>}

              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={orderForm.paymentMethod === "cash"}
                    onChange={handleOrderChange}
                    disabled={submitting}
                  />
                  <span>💵 Cash on Delivery</span>
                </label>
                
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wallet"
                    checked={orderForm.paymentMethod === "wallet"}
                    onChange={handleOrderChange}
                    disabled={submitting}
                  />
                  <span>💰 Pay from Wallet</span>
                  {walletBalance > 0 && (
                    <span className="wallet-balance-hint">
                      (₹{Math.round(walletBalance).toLocaleString()})
                    </span>
                  )}
                </label>
                
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={orderForm.paymentMethod === "online"}
                    onChange={handleOrderChange}
                    disabled={submitting}
                  />
                  <span>💳 Pay Online</span>
                </label>
              </div>

              {orderForm.paymentMethod === "wallet" && walletBalance < grandTotal && (
                <div className="wallet-warning">
                  ⚠️ Need ₹{Math.round(grandTotal - walletBalance).toLocaleString()} more in wallet
                </div>
              )}

              <textarea
                name="specialInstructions"
                placeholder="Special Instructions (Optional)"
                value={orderForm.specialInstructions}
                onChange={handleOrderChange}
                rows="2"
                disabled={submitting}
              />

              {/* Price Breakdown */}
              {orderForm.quantity > 0 && orderForm.deliveryLocation && (
                <div className="price-breakdown">
                  <h4>💰 Price Details</h4>
                  <div className="price-row">
                    <span>Fish Price ({orderForm.quantity} kg):</span>
                    <span>₹{Math.round(fishTotal).toLocaleString()}</span>
                  </div>
                  <div className="price-row">
                    <span>Delivery ({distance} km):</span>
                    <span>₹{Math.round(transportCharge).toLocaleString()}</span>
                  </div>
                  <div className="price-row total">
                    <span>Total Amount:</span>
                    <span>₹{Math.round(grandTotal).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowOrderModal(false)} disabled={submitting}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-order-btn" 
                  disabled={submitting || (orderForm.paymentMethod === "wallet" && walletBalance < grandTotal) || !orderForm.deliveryLocation}
                >
                  {submitting ? "Processing..." : 
                    orderForm.paymentMethod === "wallet" ? `Pay ₹${Math.round(grandTotal).toLocaleString()}` :
                    orderForm.paymentMethod === "online" ? `Pay ₹${Math.round(grandTotal).toLocaleString()}` : `Confirm ₹${Math.round(grandTotal).toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stripe Payment Modal */}
      {showStripeModal && pendingOrderData && (
        <div className="modal-overlay" onClick={() => setShowStripeModal(false)}>
          <div className="modal-content stripe-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowStripeModal(false)}>×</button>
            
            <h2>Complete Payment</h2>
            
            <div className="payment-summary">
              <img 
                src={getFishImage(pendingOrderData.fishType)} 
                alt={pendingOrderData.fishType}
                className="payment-image"
                onError={(e) => e.target.src = defaultFishImg}
              />
              <div className="payment-details">
                <h3>{pendingOrderData.fishType}</h3>
                <p>From: 📍 {pendingOrderData.sellerLocation}</p>
                <p>To: 📍 {pendingOrderData.deliveryCity}</p>
                <p>Distance: {pendingOrderData.distance} km</p>
                <p>Total: <strong>₹{Math.round(pendingOrderData.grandTotal).toLocaleString()}</strong></p>
              </div>
            </div>

            <Elements stripe={stripePromise}>
              <StripePaymentForm
                orderData={pendingOrderData}
                onSuccess={handleStripeSuccess}
                onError={handleStripeError}
                onCancel={() => setShowStripeModal(false)}
                totalAmount={pendingOrderData.grandTotal}
              />
            </Elements>

            <button 
              className="back-btn"
              onClick={() => {
                setShowStripeModal(false);
                setShowOrderModal(true);
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Wallet Payment Modal */}
      {showWalletModal && pendingOrderData && (
        <div className="modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="modal-content wallet-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowWalletModal(false)}>×</button>
            
            <h2>Pay with Wallet</h2>
            
            <div className="payment-summary">
              <img 
                src={getFishImage(pendingOrderData.fishType)} 
                alt={pendingOrderData.fishType}
                className="payment-image"
                onError={(e) => e.target.src = defaultFishImg}
              />
              <div className="payment-details">
                <h3>{pendingOrderData.fishType}</h3>
                <p>From: 📍 {pendingOrderData.sellerLocation}</p>
                <p>To: 📍 {pendingOrderData.deliveryCity}</p>
                <p>Distance: {pendingOrderData.distance} km</p>
                <p>Total: <strong>₹{Math.round(pendingOrderData.grandTotal).toLocaleString()}</strong></p>
              </div>
            </div>

            <WalletPayment
              orderData={pendingOrderData}
              onSuccess={handleWalletSuccess}
              onError={handleWalletError}
              onCancel={() => setShowWalletModal(false)}
              totalAmount={pendingOrderData.grandTotal}
            />

            <button 
              className="back-btn"
              onClick={() => {
                setShowWalletModal(false);
                setShowOrderModal(true);
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrowseFish;