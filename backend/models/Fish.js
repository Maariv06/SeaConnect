// backend/models/Fish.js
const mongoose = require("mongoose");

const fishSchema = new mongoose.Schema(
{
  fishType: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  availableQuantity: {
    type: Number,
    required: true
  },

  pricePerKg: {
    type: Number,
    required: true
  },

  totalPrice: {
    type: Number
  },

  catchDate: {
    type: Date
  },

  phone: {
    type: String,
    required: true
  },

  // Location field - this is CRITICAL for distance calculation
  location: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  image: {
    type: String,
    default: "default-fish.jpg"
  },

  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  sellerName: {
    type: String,
    required: true
  },

  sellerEmail: {
    type: String
  },

  status: {
    type: String,
    enum: ["Pending", "Verified", "Rejected", "Sold Out"],
    default: "Pending"
  },

  rejectionReason: {
    type: String
  },

  orders: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },
    quantity: Number,
    customerName: String,
    orderedAt: Date
  }]

},
{ 
  timestamps: true 
});

module.exports = mongoose.model("Fish", fishSchema);