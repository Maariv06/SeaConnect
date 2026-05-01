// backend/models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, "Customer name is required"],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, "Customer phone is required"],
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  deliveryLocation: {
    type: String,
    required: [true, "Delivery location is required"],
    trim: true
  },
  fishId: {
    type: String,
    required: [true, "Fish ID is required"]
  },
  fishType: {
    type: String,
    required: [true, "Fish type is required"],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0.5, "Minimum quantity is 0.5 kg"]
  },
  pricePerKg: {
    type: Number,
    required: [true, "Price per kg is required"],
    min: [1, "Price must be at least ₹1"]
  },
  totalAmount: {
    type: Number,
    required: [true, "Total amount is required"],
    min: [1, "Total amount must be at least ₹1"]
  },
  sellerId: {
    type: String,
    required: [true, "Seller ID is required"]
  },
  sellerName: {
    type: String,
    required: [true, "Seller name is required"],
    trim: true
  },
  sellerPhone: {
    type: String,
    required: [true, "Seller phone is required"],
    trim: true
  },
  
  // Payment fields
  paymentMethod: { 
    type: String, 
    enum: ["cash", "online", "wallet"],
    default: "cash" 
  },
  paymentStatus: { 
    type: String, 
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending" 
  },
  
  // Payment gateway fields
  stripePaymentIntentId: {
    type: String,
    sparse: true
  },
  walletTransactionId: {
    type: String,
    sparse: true
  },
  
  specialInstructions: {
    type: String,
    default: ""
  },
  
  // Order status
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
    default: "Pending"
  },
  
  // Cancellation
  cancellationReason: String,
  cancelledAt: Date,
  
  // Order type
  orderType: {
    type: String,
    enum: ["regular", "auction"],
    default: "regular"
  },
  
  // Timestamps
  orderDate: {
    type: Date,
    default: Date.now
  },

  auctionId: {
    type: String,
    index: true,
    sparse: true
  },
  transportCharge: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    default: function() {
      return this.totalAmount || 0;
    }
  },
  distance: {
    type: Number,
    default: 0
  },
  sellerLocation: {
    type: String,
    default: ''
  },
  deliveryCity: {
    type: String,
    default: ''
  },
  
  // Make sure these are properly defined
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  deliveryLocation: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "online", "wallet"],
    default: "cash"
  }
}, { 
  timestamps: true 
});

// Add index for better query performance
orderSchema.index({ sellerId: 1, orderDate: -1 });
orderSchema.index({ customerPhone: 1, orderDate: -1 });
orderSchema.index({ stripePaymentIntentId: 1 });

module.exports = mongoose.model("Order", orderSchema);