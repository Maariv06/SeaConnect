// backend/models/Auction.js
const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema({
  fishType: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.5
  },
  startingPrice: {
    type: Number,
    required: true,
    min: 1
  },
  currentBid: {
    type: Number,
    default: 0
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
  sellerPhone: {
    type: String,
    required: true
  },
  
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
  
  // Make auctionEnd not required by removing `required: true`
  // Only live auctions need this field
  auctionEnd: {
    type: Date
    // required: true  // Remove this line
  },
  
  status: {
    type: String,
    enum: ["Pending", "Live", "Completed", "Cancelled"],
    default: "Pending"
  },
  
  // Track last bid time for inactivity timeout
  lastBidTime: {
    type: Date,
    default: Date.now
  },
  
  // Auto-complete settings
  autoCompleteAt: {
    type: Date
  },
  autoCompleteReason: {
    type: String,
    enum: ["time_end", "inactivity", "admin_complete"]
  },
  
  bids: [{
    bidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    bidderName: String,
    amount: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  bidCount: {
    type: Number,
    default: 0
  },
  
 winner: {
    bidderId: String,
    bidderName: String,
    winningBid: Number,
    wonAt: Date,
    deliveryDetails: {
      customerName: String,
      customerPhone: String,
      deliveryLocation: String,
      paymentMethod: {
        type: String,
        enum: ['cash', 'online', 'wallet'], // Add 'wallet' here
        default: 'cash'
      },
      updatedAt: Date
    }
  }
  
}, { timestamps: true });

// Virtual for time remaining - only works when auctionEnd exists
auctionSchema.virtual('timeRemaining').get(function() {
  if (!this.auctionEnd) return "Not set";
  
  const now = new Date();
  const end = new Date(this.auctionEnd);
  const diff = end - now;
  
  if (diff <= 0) return "Ended";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (hours === 0 && minutes === 0) {
    return `${seconds}s`;
  }
  if (hours === 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${hours}h ${minutes}m`;
});

// Virtual for inactivity time
auctionSchema.virtual('inactivityTime').get(function() {
  const now = new Date();
  const lastBid = this.lastBidTime || this.createdAt;
  const diff = now - new Date(lastBid);
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
});

module.exports = mongoose.model("Auction", auctionSchema);