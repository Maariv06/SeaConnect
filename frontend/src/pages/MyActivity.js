// pages/MyActivity.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./MyActivity.css";

// Import Stripe
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../utils/stripeConfig';

// Import Wallet
import { useWallet } from '../context/WalletContext';
import WalletPayment from '../components/WalletPayment';

// Import icons
import { 
  FaTruck, FaWallet, FaCreditCard, FaTimes, FaInfoCircle, 
  FaHistory, FaCheckCircle, FaStar, FaChartLine, FaFire,
  FaClock, FaMapMarkerAlt, FaWeight, FaGavel, FaUser,
  FaPhone, FaBolt, FaTrophy, FaArrowUp
} from 'react-icons/fa';

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

// Tamil Nadu cities for delivery dropdown
const TAMIL_NADU_CITIES = [
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
  "Tirunelveli", "Vellore", "Erode", "Thoothukudi", "Thanjavur",
  "Dindigul", "Kanyakumari", "Karur", "Cuddalore", "Kanchipuram",
  "Tiruppur", "Nagercoil", "Virudhunagar", "Sivakasi", "Hosur",
  "Ooty", "Kodaikanal", "Rameswaram", "Karaikudi", "Nagapattinam",
  "Ramanathapuram", "Theni", "Tenkasi", "Kovilpatti", "Tiruchendur"
].sort();

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

function MyActivity() {
  const navigate = useNavigate();
  const { walletBalance, deductMoney } = useWallet();
  
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [listings, setListings] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showAuctionDetails, setShowAuctionDetails] = useState(false);
  
  // Payment related states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [selectedWonAuction, setSelectedWonAuction] = useState(null);
  
  const [deliveryForm, setDeliveryForm] = useState({
    customerName: "",
    customerPhone: "",
    deliveryLocation: "",
    paymentMethod: "cash"
  });
  const [deliveryErrors, setDeliveryErrors] = useState({});
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [selectedListingDetails, setSelectedListingDetails] = useState(null);
  const [showListingDetailsModal, setShowListingDetailsModal] = useState(false);
  
  // Transport calculation states
  const [distance, setDistance] = useState(0);
  const [transportCharge, setTransportCharge] = useState(0);
  const [winningBidAmount, setWinningBidAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedWonAuction && deliveryForm.deliveryLocation) {
      calculateTransportAndFees();
    }
  }, [deliveryForm.deliveryLocation, selectedWonAuction]);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchUserOrders(),
      fetchUserListings(),
      fetchUserAuctions(),
      fetchWonAuctions()
    ]);
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      let allOrders = [];
      
      console.log("Fetching orders for user:", user);
      
      if (user.phone) {
        const buyerResponse = await axios.get(`${API}/orders/customer/${user.phone}`);
        if (buyerResponse.data.success) {
          allOrders = [...buyerResponse.data.data];
        }
      }
      
      if (user.role === "seller") {
        const sellerResponse = await axios.get(`${API}/orders/seller/${user._id || user.id}`);
        if (sellerResponse.data.success) {
          allOrders = [...allOrders, ...sellerResponse.data.data];
        }
      }
      
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex(o => o._id === order._id)
      );
      
      console.log("Fetched orders:", uniqueOrders);
      setOrders(uniqueOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserListings = async () => {
    try {
      const response = await axios.get(`${API}/fish/seller/${user._id || user.id}`);
      if (response.data.success) {
        setListings(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  const fetchUserAuctions = async () => {
    try {
      const response = await axios.get(`${API}/auction/seller/${user._id || user.id}`);
      if (response.data.success) {
        setAuctions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching auctions:", error);
    }
  };

  const fetchWonAuctions = async () => {
    try {
      const response = await axios.get(`${API}/auction/bidder/${user._id || user.id}`);
      if (response.data.success) {
        const won = response.data.data.filter(auction => 
          auction.winner && auction.winner.bidderId === (user._id || user.id)
        );
        console.log("Fetched won auctions:", won);
        setWonAuctions(won);
      }
    } catch (error) {
      console.error("Error fetching won auctions:", error);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleViewListingDetails = (listing) => {
    setSelectedListingDetails(listing);
    setShowListingDetailsModal(true);
  };

  const handleViewAuctionDetails = (auction) => {
    setSelectedAuction(auction);
    setShowAuctionDetails(true);
  };

  const calculateTransportAndFees = () => {
    if (!selectedWonAuction || !deliveryForm.deliveryLocation) return;
    
    const sellerLocation = selectedWonAuction.location || "Thoothukudi";
    const weight = selectedWonAuction.quantity;
    const winningBid = selectedWonAuction.winner?.winningBid || 0;
    
    setWinningBidAmount(winningBid);
    
    const calculatedDistance = calculateDistance(sellerLocation, deliveryForm.deliveryLocation);
    setDistance(calculatedDistance);
    
    const charge = calculateTransportCharge(calculatedDistance, weight);
    setTransportCharge(charge);
    
    setGrandTotal(winningBid + charge);
    
    console.log("💰 Payment Breakdown:", {
      winningBid,
      transportCharge: charge,
      grandTotal: winningBid + charge
    });
  };

  const handleProvideDeliveryDetails = (auction) => {
    console.log("Providing delivery details for auction:", auction);
    setSelectedWonAuction(auction);
    setDeliveryForm({
      customerName: user?.fullName || user?.name || "",
      customerPhone: user?.phone || "",
      deliveryLocation: "",
      paymentMethod: "cash"
    });
    setDistance(0);
    setTransportCharge(0);
    setWinningBidAmount(Math.round(auction.winner?.winningBid || 0));
    setGrandTotal(0);
    setDeliveryErrors({});
    setShowPaymentModal(true);
  };

  const handleDeliveryChange = (e) => {
    const { name, value } = e.target;
    setDeliveryForm({
      ...deliveryForm,
      [name]: value
    });
    if (deliveryErrors[name]) {
      setDeliveryErrors({
        ...deliveryErrors,
        [name]: ""
      });
    }
  };

  const validateDeliveryForm = () => {
    const errors = {};
    
    if (!deliveryForm.customerName.trim()) {
      errors.customerName = "Name is required";
    }
    
    if (!deliveryForm.customerPhone.trim()) {
      errors.customerPhone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(deliveryForm.customerPhone)) {
      errors.customerPhone = "Enter valid 10-digit number";
    }
    
    if (!deliveryForm.deliveryLocation.trim()) {
      errors.deliveryLocation = "Delivery location is required";
    }
    
    return errors;
  };

  const updateDeliveryDetails = async (orderData) => {
    try {
      setSubmittingDelivery(true);
      
      if (!selectedWonAuction) {
        throw new Error("No auction selected");
      }

      console.log("Processing auction:", selectedWonAuction._id);
      console.log("Order data:", orderData);

      const auctionUpdateData = {
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        deliveryLocation: orderData.deliveryLocation,
        paymentMethod: deliveryForm.paymentMethod,
        transportCharge: Math.round(transportCharge),
        grandTotal: Math.round(grandTotal),
        distance: distance,
        customerEmail: user?.email || ''
      };

      console.log("Sending to backend:", auctionUpdateData);

      const auctionResponse = await axios.put(`${API}/auction/${selectedWonAuction._id}/delivery`, auctionUpdateData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (auctionResponse.data.success) {
        if (deliveryForm.paymentMethod === "wallet") {
          const deductResult = await deductMoney(
            user._id || user.id,
            Math.round(grandTotal),
            {
              auctionId: selectedWonAuction._id,
              fishType: selectedWonAuction.fishType,
              quantity: selectedWonAuction.quantity,
              sellerId: selectedWonAuction.sellerId,
              transportCharge: Math.round(transportCharge)
            }
          );

          if (deductResult.success) {
            try {
              const orderResponse = await axios.get(`${API}/orders/auction/${selectedWonAuction._id}`);
              
              if (orderResponse.data.success) {
                const order = orderResponse.data.data;
                console.log("Found order:", order._id);
                
                await axios.put(`${API}/orders/${order._id}/payment`, {
                  paymentStatus: "Paid",
                  paymentMethod: "wallet",
                  walletTransactionId: deductResult.data.transactionId,
                  transportCharge: Math.round(transportCharge),
                  grandTotal: Math.round(grandTotal),
                  distance: distance
                });
                
                console.log("✅ Order payment updated successfully");
              } else {
                throw new Error("Order not found for this auction");
              }
            } catch (orderError) {
              console.error("Error finding order:", orderError);
              
              const newOrderData = {
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                customerEmail: user?.email || '',
                deliveryLocation: orderData.deliveryLocation,
                fishId: selectedWonAuction._id,
                fishType: selectedWonAuction.fishType,
                quantity: selectedWonAuction.quantity,
                pricePerKg: Math.round(winningBidAmount / selectedWonAuction.quantity),
                totalAmount: Math.round(winningBidAmount),
                transportCharge: Math.round(transportCharge),
                grandTotal: Math.round(grandTotal),
                distance: distance,
                sellerId: selectedWonAuction.sellerId,
                sellerName: selectedWonAuction.sellerName,
                sellerPhone: selectedWonAuction.sellerPhone,
                sellerLocation: selectedWonAuction.location,
                deliveryCity: deliveryForm.deliveryLocation,
                paymentMethod: "wallet",
                paymentStatus: "Paid",
                walletTransactionId: deductResult.data.transactionId,
                specialInstructions: `Auction won for ${selectedWonAuction.fishType}`,
                orderType: "auction",
                auctionId: selectedWonAuction._id,
                status: "Pending",
                orderDate: new Date().toISOString()
              };
              
              const createResponse = await axios.post(`${API}/orders/create`, newOrderData);
              console.log("✅ Created new order:", createResponse.data.data);
            }
            
            alert(`✅ Payment successful!\n\nTotal: ₹${Math.round(grandTotal).toLocaleString()}`);
          } else {
            throw new Error(deductResult.error || "Insufficient wallet balance");
          }
        } else if (deliveryForm.paymentMethod === "online") {
          setPendingOrderData({
            ...orderData,
            auctionId: selectedWonAuction._id
          });
          setShowPaymentModal(false);
          setShowStripeModal(true);
          setSubmittingDelivery(false);
          return;
        } else {
          alert(`✅ Delivery details saved!\n\nWinning Bid: ₹${Math.round(winningBidAmount).toLocaleString()}\nDelivery: ₹${Math.round(transportCharge).toLocaleString()}\nTotal: ₹${Math.round(grandTotal).toLocaleString()}\n\nYou'll pay on delivery.`);
        }

        setShowPaymentModal(false);
        setShowStripeModal(false);
        setShowWalletModal(false);
        
        await refreshAllData();
        
        setSelectedWonAuction(null);
        setPendingOrderData(null);
        
        setActiveTab("orders");
      } else {
        throw new Error(auctionResponse.data.message || "Failed to update delivery details");
      }
    } catch (error) {
      console.error("❌ Error updating delivery details:", error);
      
      let errorMessage = "Error processing your order. Please try again.";
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
        console.error("Server response:", error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleStripeSuccess = async (orderData) => {
    try {
      const auctionUpdateData = {
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        deliveryLocation: orderData.deliveryLocation,
        paymentMethod: "online"
      };

      await axios.put(`${API}/auction/${orderData.auctionId}/delivery`, auctionUpdateData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      alert(`✅ Payment successful!\n\nTotal: ₹${Math.round(grandTotal).toLocaleString()}`);
      
      setShowStripeModal(false);
      setShowPaymentModal(false);
      
      await refreshAllData();
      
      setSelectedWonAuction(null);
      setPendingOrderData(null);
      
      setActiveTab("orders");
    } catch (error) {
      console.error("Error updating order after Stripe success:", error);
      alert("Payment successful but there was an error updating your order. Please check your orders page.");
    }
  };

  const handleStripeError = (error) => {
    console.error("Stripe error:", error);
    alert("Payment failed. Please try again.");
    setSubmittingDelivery(false);
  };

  const handleWalletSuccess = async (orderData) => {
    try {
      await updateDeliveryDetails(orderData);
    } catch (error) {
      console.error("Wallet payment error:", error);
      alert(error.message || "Payment failed. Please try again.");
      setSubmittingDelivery(false);
    }
  };

  const handleWalletError = (error) => {
    console.error("Wallet error:", error);
    alert(error || "Payment failed. Please try again.");
    setSubmittingDelivery(false);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateDeliveryForm();
    if (Object.keys(errors).length > 0) {
      setDeliveryErrors(errors);
      return;
    }

    const orderData = {
      customerName: deliveryForm.customerName.trim(),
      customerPhone: deliveryForm.customerPhone.trim(),
      customerEmail: user?.email || '',
      deliveryLocation: deliveryForm.deliveryLocation.trim(),
      paymentMethod: deliveryForm.paymentMethod
    };

    if (deliveryForm.paymentMethod === "wallet") {
      if (walletBalance < grandTotal) {
        alert(`Insufficient wallet balance. Need ₹${Math.round(grandTotal - walletBalance).toLocaleString()} more.`);
        return;
      }
      await updateDeliveryDetails(orderData);
    } else if (deliveryForm.paymentMethod === "online") {
      setPendingOrderData(orderData);
      setShowPaymentModal(false);
      setShowStripeModal(true);
    } else {
      await updateDeliveryDetails(orderData);
    }
  };

  const handleCancelClick = (order) => {
    if (order.status !== "Pending") {
      alert("❌ Only pending orders can be cancelled");
      return;
    }
    setOrderToCancel(order);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation");
      return;
    }

    try {
      const response = await axios.put(`${API}/orders/${orderToCancel._id}/status`, {
        status: "Cancelled",
        cancellationReason: cancelReason
      });

      if (response.data.success) {
        alert("✅ Order cancelled successfully");
        setShowCancelModal(false);
        await refreshAllData();
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("❌ Failed to cancel order");
    }
  };

  const canCancelOrder = (status) => {
    return status === "Pending";
  };

  const getFishImage = (fishType) => {
    return fishImageMap[fishType] || defaultFishImg;
  };

  const getStatusBadge = (status) => {
    const badges = {
      "Pending": "status-pending",
      "Confirmed": "status-confirmed",
      "Processing": "status-processing",
      "Shipped": "status-shipped",
      "Delivered": "status-delivered",
      "Cancelled": "status-cancelled"
    };
    return badges[status] || "status-pending";
  };

  const getListingStatusBadge = (status) => {
    const badges = {
      "Pending": "status-pending",
      "Verified": "status-verified",
      "Rejected": "status-rejected",
      "Sold Out": "status-soldout"
    };
    return badges[status] || "status-pending";
  };

  const getAuctionStatusBadge = (status) => {
    const badges = {
      "Pending": "status-pending",
      "Live": "status-live",
      "Completed": "status-completed",
      "Cancelled": "status-cancelled"
    };
    return badges[status] || "status-pending";
  };

  const getOrderTypeBadge = (orderType) => {
    if (orderType === "auction") {
      return <span className="order-type-badge auction">🔨 Auction</span>;
    }
    return <span className="order-type-badge regular">🛒 Regular</span>;
  };

  const getPaymentBadge = (method, status) => {
    if (status === "Paid") return "payment-badge paid";
    return method === "online" ? "payment-badge online" : "payment-badge cash";
  };

  const hasDeliveryDetails = (auction) => {
    return auction.winner?.deliveryDetails?.customerName && 
           auction.winner?.deliveryDetails?.customerName !== "Pending";
  };

  if (!user) {
    return (
      <div className="my-activity-container">
        <h1>My Activity</h1>
        <p className="login-message">Please login to view your activity</p>
      </div>
    );
  }

  return (
    <div className="my-activity-container">
      <div className="welcome-header">
        <h1>My Activity</h1>
        <p className="welcome-message">Welcome back, <strong>{user.fullName || user.name}</strong>! 👋</p>
      </div>
      
      <div className="activity-tabs">
        <button 
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          My Orders ({orders.length})
        </button>
        <button 
          className={activeTab === "listings" ? "active" : ""}
          onClick={() => setActiveTab("listings")}
        >
          My Listings ({listings.length})
        </button>
        <button 
          className={activeTab === "auctions" ? "active" : ""}
          onClick={() => setActiveTab("auctions")}
        >
          My Auctions ({auctions.length})
        </button>
        <button 
          className={activeTab === "won-auctions" ? "active" : ""}
          onClick={() => setActiveTab("won-auctions")}
        >
          🏆 Won Auctions ({wonAuctions.length})
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="orders-section">
          <h2>Your Orders</h2>
          
          {loading ? (
            <div className="loading">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No orders yet</h3>
              <p>Start browsing fresh fish from local sellers</p>
              <button onClick={() => window.location.href = "/browse"}>
                Browse Fish
              </button>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map(order => (
                <div key={order._id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-image">
                      <img 
                        src={getFishImage(order.fishType)} 
                        alt={order.fishType}
                      />
                    </div>
                    
                    <div className="order-info">
                      <h3>{order.fishType}</h3>
                      <div className="order-type-badge-container">
                        {getOrderTypeBadge(order.orderType)}
                      </div>
                      <span className={`order-status ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="order-details-simplified">
                    <div className="price-quantity">
                      <div className="price-box">
                        <span className="label">Price</span>
                        <span className="value">₹{Math.round(order.pricePerKg)}/kg</span>
                      </div>
                      <div className="quantity-box">
                        <span className="label">Quantity</span>
                        <span className="value">{order.quantity} kg</span>
                      </div>
                      <div className="total-box">
                        <span className="label">Total</span>
                        <span className="value">₹{Math.round(order.totalAmount).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="order-actions">
                    <button 
                      className="view-details-btn"
                      onClick={() => handleViewDetails(order)}
                    >
                      👁️ View Details
                    </button>
                    
                    {canCancelOrder(order.status) && (
                      <button 
                        className="cancel-order-btn"
                        onClick={() => handleCancelClick(order)}
                      >
                        ✕ Cancel Order
                      </button>
                    )}
                    
                    {order.status === "Delivered" && (
                      <span className="delivered-badge">✅ Delivered</span>
                    )}
                    
                    {order.status === "Cancelled" && (
                      <span className="cancelled-badge">❌ Cancelled</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Listings Tab */}
      {activeTab === "listings" && (
        <div className="listings-section">
          <h2>Your Fish Listings</h2>
          
          {listings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🐟</div>
              <h3>No listings yet</h3>
              <p>Start selling your fresh catch</p>
              <button onClick={() => window.location.href = "/sellfish"}>
                Create Listing
              </button>
            </div>
          ) : (
            <div className="listings-grid">
              {listings.map(listing => (
                <div key={listing._id} className="listing-card">
                  <div className="listing-image">
                    <img 
                      src={getFishImage(listing.fishType)} 
                      alt={listing.fishType}
                    />
                  </div>
                  
                  <div className="listing-content">
                    <h3>{listing.fishType}</h3>
                    
                    <div className="listing-stats-simplified">
                      <div className="stat-row">
                        <span className="stat-label">Total Quantity:</span>
                        <span className="stat-value">{listing.quantity} kg</span>
                      </div>
                      <div className="stat-row highlight">
                        <span className="stat-label">Available:</span>
                        <span className="stat-value available">
                          {listing.availableQuantity || 0} kg
                        </span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Price:</span>
                        <span className="stat-value">₹{Math.round(listing.pricePerKg)}/kg</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Sold:</span>
                        <span className="stat-value sold">
                          {Math.round(listing.quantity - (listing.availableQuantity || 0))} kg
                        </span>
                      </div>
                      <div className="stat-row total">
                        <span className="stat-label">Total Value:</span>
                        <span className="stat-value">₹{Math.round(listing.totalPrice).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="listing-meta">
                      <span className={`status-badge ${getListingStatusBadge(listing.status)}`}>
                        {listing.status || "Pending"}
                      </span>
                      <span className="listing-date">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <button 
                      className="view-details-btn listing-view-btn"
                      onClick={() => handleViewListingDetails(listing)}
                    >
                      👁️ View Orders & Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auctions Tab (as Seller) */}
      {activeTab === "auctions" && (
        <div className="auctions-section">
          <h2>Your Auctions</h2>
          
          {auctions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔨</div>
              <h3>No auctions yet</h3>
              <p>Start creating auctions for your fresh catch</p>
              <button onClick={() => window.location.href = "/create-auction"}>
                Create Auction
              </button>
            </div>
          ) : (
            <div className="auctions-grid">
              {auctions.map(auction => (
                <div key={auction._id} className="auction-card">
                  <div className="auction-header">
                    <h3>{auction.fishType}</h3>
                    <span className={`status-badge ${getAuctionStatusBadge(auction.status)}`}>
                      {auction.status}
                    </span>
                  </div>
                  
                  <div className="auction-details">
                    <p><strong>Quantity:</strong> {auction.quantity} kg</p>
                    <p><strong>Starting Price:</strong> ₹{Math.round(auction.startingPrice).toLocaleString()}</p>
                    <p><strong>Current Bid:</strong> <span className="highlight">₹{Math.round(auction.currentBid).toLocaleString()}</span></p>
                    <p><strong>Total Bids:</strong> {auction.bidCount}</p>
                    <p><strong>Ends:</strong> {new Date(auction.auctionEnd).toLocaleString()}</p>
                    
                    {auction.timeRemaining && (
                      <p className={`time-remaining ${auction.timeRemaining.includes('h') && parseInt(auction.timeRemaining) < 1 ? 'urgent' : ''}`}>
                        <strong>Time Left:</strong> {auction.timeRemaining}
                      </p>
                    )}
                  </div>

                  {auction.bids && auction.bids.length > 0 && (
                    <div className="bid-history">
                      <h4>Bid History ({auction.bidCount} bids)</h4>
                      <div className="bid-list">
                        {auction.bids.slice().reverse().map((bid, index) => (
                          <div key={index} className="bid-item">
                            <span className="bidder">{bid.bidderName}</span>
                            <span className="amount">₹{Math.round(bid.amount).toLocaleString()}</span>
                            <span className="time">{new Date(bid.timestamp).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {auction.winner && (
                    <div className="winner-info">
                      <h4>🏆 Winner</h4>
                      <p><strong>{auction.winner.bidderName}</strong> won with bid of ₹{Math.round(auction.winner.winningBid).toLocaleString()}</p>
                      {auction.winner.deliveryDetails && (
                        <div className="delivery-info">
                          <p><strong>Delivery:</strong> {auction.winner.deliveryDetails.deliveryLocation}</p>
                          <p><strong>Phone:</strong> {auction.winner.deliveryDetails.customerPhone}</p>
                          <p><strong>Payment:</strong> {auction.winner.deliveryDetails.paymentMethod}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    className="view-details-btn"
                    onClick={() => handleViewAuctionDetails(auction)}
                  >
                    👁️ View Full Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Won Auctions Tab (as Bidder) - FIXED ALIGNMENT */}
      {activeTab === "won-auctions" && (
        <div className="won-auctions-section">
          <h2>Auctions You've Won 🏆</h2>
          
          {wonAuctions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <h3>No won auctions yet</h3>
              <p>Keep bidding on auctions to win!</p>
            </div>
          ) : (
            <div className="won-auctions-grid">
              {wonAuctions.map(auction => {
                const orderCompleted = hasDeliveryDetails(auction);
                
                return (
                  <div key={auction._id} className="won-auction-card">
                    <div className="won-auction-header">
                      <div className="winner-badge">🏆 WINNER</div>
                      <img 
                        src={getFishImage(auction.fishType)} 
                        alt={auction.fishType}
                        className="won-auction-image"
                      />
                    </div>
                    
                    <div className="won-auction-content">
                      <h3>{auction.fishType}</h3>
                      
                      <div className="won-details">
                        <div className="detail-row">
                          <span className="detail-label">Quantity:</span>
                          <span className="detail-value">{auction.quantity} kg</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Your Winning Bid:</span>
                          <span className="detail-value winning-bid">₹{Math.round(auction.winner?.winningBid || 0).toLocaleString()}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Seller:</span>
                          <span className="detail-value">{auction.sellerName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Seller Phone:</span>
                          <span className="detail-value">{auction.sellerPhone}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Seller Location:</span>
                          <span className="detail-value location">📍 {auction.location}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Won On:</span>
                          <span className="detail-value">{new Date(auction.winner?.wonAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {!orderCompleted ? (
                        <button 
                          className="provide-delivery-btn"
                          onClick={() => handleProvideDeliveryDetails(auction)}
                        >
                          💳 Provide Delivery Details & Pay
                        </button>
                      ) : (
                        <div className="order-placed-badge">
                          ✅ Order Completed - Check Orders Tab
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderDetails(false)}>
          <div className="modal-content order-details-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowOrderDetails(false)}>×</button>
            
            <h2>Order Details</h2>
            
            <div className="order-details-content">
              <div className="details-header">
                <div className="details-image">
                  <img 
                    src={getFishImage(selectedOrder.fishType)} 
                    alt={selectedOrder.fishType}
                  />
                </div>
                <div className="details-title">
                  <h3>{selectedOrder.fishType}</h3>
                  <div className="order-type-badge-container">
                    {getOrderTypeBadge(selectedOrder.orderType)}
                  </div>
                  <span className={`order-status ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>
              
              <div className="details-summary">
                <div className="summary-item">
                  <span className="label">Price per kg</span>
                  <span className="value">₹{Math.round(selectedOrder.pricePerKg)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Quantity</span>
                  <span className="value">{selectedOrder.quantity} kg</span>
                </div>
                <div className="summary-item total">
                  <span className="label">Total Amount</span>
                  <span className="value">₹{Math.round(selectedOrder.totalAmount).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="details-grid">
                <div className="details-group">
                  <h4>Order Information</h4>
                  <p><strong>Order ID:</strong> #{selectedOrder._id.slice(-6)}</p>
                  <p><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleString()}</p>
                  <p><strong>Payment Method:</strong> {
                    selectedOrder.paymentMethod === "cash" ? "Cash on Delivery" : "Online Payment"
                  }</p>
                  <p><strong>Payment Status:</strong> 
                    <span className={getPaymentBadge(selectedOrder.paymentMethod, selectedOrder.paymentStatus)}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </p>
                </div>
                
                <div className="details-group">
                  <h4>Delivery Information</h4>
                  <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                  <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                  <p><strong>Location:</strong> {selectedOrder.deliveryLocation}</p>
                </div>
                
                <div className="details-group">
                  <h4>Seller Information</h4>
                  <p><strong>Name:</strong> {selectedOrder.sellerName}</p>
                  <p><strong>Phone:</strong> {selectedOrder.sellerPhone}</p>
                </div>
              </div>
              
              {selectedOrder.specialInstructions && (
                <div className="special-instructions">
                  <h4>Special Instructions</h4>
                  <p>{selectedOrder.specialInstructions}</p>
                </div>
              )}
              
              {selectedOrder.cancellationReason && (
                <div className="cancellation-reason">
                  <h4>Cancellation Reason</h4>
                  <p>{selectedOrder.cancellationReason}</p>
                </div>
              )}

              {selectedOrder.orderType === "auction" && selectedOrder.auctionId && (
                <div className="auction-info">
                  <h4>Auction Information</h4>
                  <p><strong>Auction ID:</strong> #{selectedOrder.auctionId.toString().slice(-6)}</p>
                </div>
              )}
              
              <button className="close-btn" onClick={() => setShowOrderDetails(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listing Details Modal */}
      {showListingDetailsModal && selectedListingDetails && (
        <div className="modal-overlay" onClick={() => setShowListingDetailsModal(false)}>
          <div className="modal-content listing-details-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowListingDetailsModal(false)}>×</button>
            
            <h2>Listing Details & Orders</h2>
            
            <div className="listing-details-content">
              <div className="details-header">
                <div className="details-image">
                  <img 
                    src={getFishImage(selectedListingDetails.fishType)} 
                    alt={selectedListingDetails.fishType}
                  />
                </div>
                <div className="details-title">
                  <h3>{selectedListingDetails.fishType}</h3>
                  <span className={`status-badge ${getListingStatusBadge(selectedListingDetails.status)}`}>
                    {selectedListingDetails.status}
                  </span>
                </div>
              </div>

              <div className="details-summary">
                <div className="summary-item">
                  <span className="label">Total Quantity</span>
                  <span className="value">{selectedListingDetails.quantity} kg</span>
                </div>
                <div className="summary-item">
                  <span className="label">Available</span>
                  <span className="value highlight">{selectedListingDetails.availableQuantity} kg</span>
                </div>
                <div className="summary-item">
                  <span className="label">Sold</span>
                  <span className="value">{Math.round(selectedListingDetails.quantity - (selectedListingDetails.availableQuantity || 0))} kg</span>
                </div>
              </div>

              <div className="details-grid">
                <div className="details-group">
                  <h4>Listing Information</h4>
                  <p><strong>Price:</strong> ₹{Math.round(selectedListingDetails.pricePerKg)}/kg</p>
                  <p><strong>Total Value:</strong> ₹{Math.round(selectedListingDetails.totalPrice).toLocaleString()}</p>
                  <p><strong>Location:</strong> {selectedListingDetails.pickupLocation || "Not specified"}</p>
                  <p><strong>Catch Date:</strong> {new Date(selectedListingDetails.catchDate).toLocaleDateString()}</p>
                  <p><strong>Listed On:</strong> {new Date(selectedListingDetails.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="details-group">
                  <h4>Your Information</h4>
                  <p><strong>Phone:</strong> {selectedListingDetails.phone}</p>
                  {selectedListingDetails.description && (
                    <p><strong>Description:</strong> {selectedListingDetails.description}</p>
                  )}
                </div>
              </div>

              {selectedListingDetails.orders && selectedListingDetails.orders.length > 0 ? (
                <div className="orders-history">
                  <h4>Orders History ({selectedListingDetails.orders.length} orders)</h4>
                  <div className="orders-list">
                    <table>
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Quantity</th>
                          <th>Order Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedListingDetails.orders.map((order, index) => (
                          <tr key={index}>
                            <td>{order.customerName}</td>
                            <td>{order.quantity} kg</td>
                            <td>{new Date(order.orderedAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="no-orders">
                  <p>No orders yet for this listing</p>
                </div>
              )}

              <button className="close-btn" onClick={() => setShowListingDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auction Details Modal */}
      {showAuctionDetails && selectedAuction && (
        <div className="modal-overlay" onClick={() => setShowAuctionDetails(false)}>
          <div className="modal-content auction-details-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuctionDetails(false)}>×</button>
            
            <h2>Auction Details</h2>
            
            <div className="auction-details-content">
              <div className="details-header">
                <div className="details-image">
                  <img 
                    src={getFishImage(selectedAuction.fishType)} 
                    alt={selectedAuction.fishType}
                  />
                </div>
                <div className="details-title">
                  <h3>{selectedAuction.fishType}</h3>
                  <span className={`status-badge ${getAuctionStatusBadge(selectedAuction.status)}`}>
                    {selectedAuction.status}
                  </span>
                </div>
              </div>

              <div className="details-summary">
                <div className="summary-item">
                  <span className="label">Current Bid</span>
                  <span className="value highlight">₹{Math.round(selectedAuction.currentBid).toLocaleString()}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Total Bids</span>
                  <span className="value">{selectedAuction.bidCount}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Quantity</span>
                  <span className="value">{selectedAuction.quantity} kg</span>
                </div>
              </div>
              
              <div className="details-grid">
                <div className="details-group">
                  <h4>Auction Information</h4>
                  <p><strong>Starting Price:</strong> ₹{Math.round(selectedAuction.startingPrice).toLocaleString()}</p>
                  <p><strong>Location:</strong> {selectedAuction.location}</p>
                  <p><strong>Created:</strong> {new Date(selectedAuction.createdAt).toLocaleString()}</p>
                  <p><strong>Ends:</strong> {new Date(selectedAuction.auctionEnd).toLocaleString()}</p>
                  {selectedAuction.timeRemaining && (
                    <p><strong>Time Left:</strong> {selectedAuction.timeRemaining}</p>
                  )}
                </div>
                
                <div className="details-group">
                  <h4>Seller Information</h4>
                  <p><strong>Name:</strong> {selectedAuction.sellerName}</p>
                  <p><strong>Phone:</strong> {selectedAuction.sellerPhone}</p>
                </div>
              </div>
              
              {selectedAuction.description && (
                <div className="description-section">
                  <h4>Description</h4>
                  <p>{selectedAuction.description}</p>
                </div>
              )}

              {selectedAuction.bids && selectedAuction.bids.length > 0 && (
                <div className="bid-history-full">
                  <h4>Complete Bid History</h4>
                  <div className="bid-list-full">
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
                            <td className="amount">₹{Math.round(bid.amount).toLocaleString()}</td>
                            <td className="time">{new Date(bid.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedAuction.winner && (
                <div className="winner-section">
                  <h4>🏆 Winner</h4>
                  <p><strong>{selectedAuction.winner.bidderName}</strong> won with bid of ₹{Math.round(selectedAuction.winner.winningBid).toLocaleString()}</p>
                  {selectedAuction.winner.deliveryDetails && (
                    <div className="delivery-details">
                      <h5>Delivery Details</h5>
                      <p><strong>Name:</strong> {selectedAuction.winner.deliveryDetails.customerName}</p>
                      <p><strong>Phone:</strong> {selectedAuction.winner.deliveryDetails.customerPhone}</p>
                      <p><strong>Location:</strong> {selectedAuction.winner.deliveryDetails.deliveryLocation}</p>
                      <p><strong>Payment:</strong> {selectedAuction.winner.deliveryDetails.paymentMethod}</p>
                    </div>
                  )}
                </div>
              )}
              
              <button className="close-btn" onClick={() => setShowAuctionDetails(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal for Won Auctions - FIXED ALIGNMENT */}
      {showPaymentModal && selectedWonAuction && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content payment-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            
            <h2>Complete Your Purchase</h2>
            
            <div className="payment-summary">
              <img 
                src={getFishImage(selectedWonAuction.fishType)} 
                alt={selectedWonAuction.fishType}
                className="payment-image"
              />
              <div className="payment-info">
                <div className="detail-row">
                  <span className="detail-label">Quantity:</span>
                  <span className="detail-value">{selectedWonAuction.quantity} kg</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Winning Bid:</span>
                  <span className="detail-value winning-bid">₹{Math.round(selectedWonAuction.winner?.winningBid || 0).toLocaleString()}</span>
                </div>
                <div className="seller-location">
                  <FaMapMarkerAlt /> {selectedWonAuction.location}
                </div>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="payment-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="customerName"
                  placeholder="Enter your full name"
                  value={deliveryForm.customerName}
                  onChange={handleDeliveryChange}
                  className={deliveryErrors.customerName ? "error" : ""}
                  disabled={submittingDelivery}
                />
                {deliveryErrors.customerName && <span className="error-message">{deliveryErrors.customerName}</span>}
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="customerPhone"
                  placeholder="10-digit mobile number"
                  value={deliveryForm.customerPhone}
                  onChange={handleDeliveryChange}
                  maxLength="10"
                  className={deliveryErrors.customerPhone ? "error" : ""}
                  disabled={submittingDelivery}
                />
                {deliveryErrors.customerPhone && <span className="error-message">{deliveryErrors.customerPhone}</span>}
              </div>

              <div className="form-group">
                <label>Delivery City *</label>
                <select
                  name="deliveryLocation"
                  value={deliveryForm.deliveryLocation}
                  onChange={handleDeliveryChange}
                  className={deliveryErrors.deliveryLocation ? "error" : ""}
                  disabled={submittingDelivery}
                  required
                >
                  <option value="">Select Delivery City</option>
                  {TAMIL_NADU_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {deliveryErrors.deliveryLocation && <span className="error-message">{deliveryErrors.deliveryLocation}</span>}
              </div>

              {deliveryForm.deliveryLocation && (
                <div className="price-breakdown">
                  <h4>💰 Price Breakdown</h4>
                  <div className="price-row">
                    <span>Winning Bid:</span>
                    <span>₹{Math.round(winningBidAmount).toLocaleString()}</span>
                  </div>
                  <div className="price-row">
                    <span>Delivery Charge ({distance} km):</span>
                    <span>₹{Math.round(transportCharge).toLocaleString()}</span>
                  </div>
                  <div className="price-row total">
                    <span>Total Amount:</span>
                    <span>₹{Math.round(grandTotal).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="payment-options">
                <h4>Payment Method</h4>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={deliveryForm.paymentMethod === "cash"}
                    onChange={handleDeliveryChange}
                    disabled={submittingDelivery}
                  />
                  <span><FaTruck /> Cash on Delivery</span>
                </label>
                
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wallet"
                    checked={deliveryForm.paymentMethod === "wallet"}
                    onChange={handleDeliveryChange}
                    disabled={submittingDelivery}
                  />
                  <span><FaWallet /> Pay from Wallet</span>
                  {walletBalance > 0 && (
                    <span className="wallet-balance-hint">
                      (Balance: ₹{Math.round(walletBalance).toLocaleString()})
                    </span>
                  )}
                </label>
                
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={deliveryForm.paymentMethod === "online"}
                    onChange={handleDeliveryChange}
                    disabled={submittingDelivery}
                  />
                  <span><FaCreditCard /> Pay Online (Card)</span>
                </label>
              </div>

              {deliveryForm.paymentMethod === "wallet" && walletBalance < grandTotal && (
                <div className="wallet-warning">
                  ⚠️ Insufficient wallet balance. Need ₹{Math.round(grandTotal - walletBalance).toLocaleString()} more.
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={submittingDelivery}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="confirm-payment-btn"
                  disabled={submittingDelivery || (deliveryForm.paymentMethod === "wallet" && walletBalance < grandTotal)}
                >
                  {submittingDelivery ? "Processing..." : 
                    deliveryForm.paymentMethod === "wallet" ? `Pay ₹${Math.round(grandTotal).toLocaleString()} from Wallet` :
                    deliveryForm.paymentMethod === "online" ? `Pay ₹${Math.round(grandTotal).toLocaleString()} Online` : `Confirm Order ₹${Math.round(grandTotal).toLocaleString()}`}
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
                src={getFishImage(selectedWonAuction?.fishType)} 
                alt={selectedWonAuction?.fishType}
                className="payment-image"
              />
              <div className="payment-details">
                <h3>{selectedWonAuction?.fishType}</h3>
                <p>Quantity: {selectedWonAuction?.quantity} kg</p>
                <p>Winning Bid: ₹{Math.round(winningBidAmount).toLocaleString()}</p>
                <p>Delivery: ₹{Math.round(transportCharge).toLocaleString()}</p>
                <p className="total">Total: <strong>₹{Math.round(grandTotal).toLocaleString()}</strong></p>
              </div>
            </div>

            <Elements stripe={stripePromise}>
              <StripePaymentForm
                orderData={{
                  ...pendingOrderData,
                  fishType: selectedWonAuction?.fishType,
                  quantity: selectedWonAuction?.quantity,
                  totalAmount: Math.round(winningBidAmount),
                  transportCharge: Math.round(transportCharge),
                  grandTotal: Math.round(grandTotal),
                  auctionId: selectedWonAuction?._id
                }}
                onSuccess={handleStripeSuccess}
                onError={handleStripeError}
                onCancel={() => setShowStripeModal(false)}
                totalAmount={Math.round(grandTotal)}
              />
            </Elements>

            <button 
              className="back-btn"
              onClick={() => {
                setShowStripeModal(false);
                setShowPaymentModal(true);
              }}
            >
              ← Back to Payment Options
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
                src={getFishImage(selectedWonAuction?.fishType)} 
                alt={selectedWonAuction?.fishType}
                className="payment-image"
              />
              <div className="payment-details">
                <h3>{selectedWonAuction?.fishType}</h3>
                <p>Quantity: {selectedWonAuction?.quantity} kg</p>
                <p>Winning Bid: ₹{Math.round(winningBidAmount).toLocaleString()}</p>
                <p>Delivery: ₹{Math.round(transportCharge).toLocaleString()}</p>
                <p className="total">Total: <strong>₹{Math.round(grandTotal).toLocaleString()}</strong></p>
                <p className="wallet-balance">Your Wallet Balance: ₹{Math.round(walletBalance).toLocaleString()}</p>
              </div>
            </div>

            <WalletPayment
              orderData={{
                ...pendingOrderData,
                fishType: selectedWonAuction?.fishType,
                quantity: selectedWonAuction?.quantity,
                totalAmount: Math.round(winningBidAmount),
                transportCharge: Math.round(transportCharge),
                grandTotal: Math.round(grandTotal),
                auctionId: selectedWonAuction?._id
              }}
              onSuccess={handleWalletSuccess}
              onError={handleWalletError}
              onCancel={() => setShowWalletModal(false)}
              totalAmount={Math.round(grandTotal)}
            />

            <button 
              className="back-btn"
              onClick={() => {
                setShowWalletModal(false);
                setShowPaymentModal(true);
              }}
            >
              ← Back to Payment Options
            </button>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && orderToCancel && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content cancel-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCancelModal(false)}>×</button>
            
            <h2>Cancel Order</h2>
            
            <div className="cancel-content">
              <p className="warning-text">⚠️ You are about to cancel this order. This action cannot be undone.</p>
              <p className="order-summary">
                <strong>{orderToCancel.fishType}</strong> - {orderToCancel.quantity}kg - ₹{Math.round(orderToCancel.totalAmount).toLocaleString()}
              </p>
              
              <div className="form-group">
                <label>Reason for Cancellation *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling this order"
                  rows="3"
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  className="cancel-btn" 
                  onClick={() => setShowCancelModal(false)}
                >
                  No, Keep Order
                </button>
                <button 
                  className="confirm-cancel-btn" 
                  onClick={handleCancelOrder}
                  disabled={!cancelReason.trim()}
                >
                  Yes, Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyActivity;