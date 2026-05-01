// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require('http');
const { Server } = require('socket.io');
const path = require("path");

dotenv.config();






// ... rest of your server code



const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Make io available to routes
app.set('io', io);
// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Import models
const Auction = require("./models/Auction");
const Notification = require("./models/Notification");

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  // Join auction room
  socket.on('join-auction', (auctionId) => {
    socket.join(`auction-${auctionId}`);
    console.log(`Client ${socket.id} joined auction room: ${auctionId}`);
  });

  // Leave auction room
  socket.on('leave-auction', (auctionId) => {
    socket.leave(`auction-${auctionId}`);
    console.log(`Client ${socket.id} left auction room: ${auctionId}`);
  });

  // Handle new bid
  socket.on('place-bid', async (data) => {
    try {
      const { auctionId, bidderId, bidderName, amount } = data;
      
      console.log(`💰 New bid received via socket:`, data);

      // Find auction
      const auction = await Auction.findById(auctionId);
      
      if (!auction) {
        socket.emit('bid-error', { message: 'Auction not found' });
        return;
      }

      // Check if auction is live
      if (auction.status !== "Live") {
        socket.emit('bid-error', { message: 'Auction is not live' });
        return;
      }

      // Check if auction has ended
      const now = new Date();
      if (new Date(auction.auctionEnd) < now) {
        socket.emit('bid-error', { message: 'Auction has ended' });
        return;
      }

      // Validate bid amount
      if (amount <= auction.currentBid) {
        socket.emit('bid-error', { 
          message: `Bid must be greater than current bid ₹${auction.currentBid}` 
        });
        return;
      }

      const minIncrement = 50;
      const minAllowedBid = auction.currentBid + minIncrement;
      
      if (amount < minAllowedBid) {
        socket.emit('bid-error', { 
          message: `Minimum bid increment is ₹${minIncrement}. Minimum allowed: ₹${minAllowedBid}` 
        });
        return;
      }

      // Create bid object
      const newBid = {
        bidderId,
        bidderName,
        amount,
        timestamp: new Date()
      };

      // Update auction
      auction.bids.push(newBid);
      auction.currentBid = amount;
      auction.bidCount += 1;
      auction.lastBidTime = new Date();

      await auction.save();

      // Prepare bid data for broadcast
      const bidData = {
        auctionId,
        bid: newBid,
        currentBid: amount,
        bidCount: auction.bidCount,
        lastBidTime: auction.lastBidTime
      };

      // Broadcast to all clients in the auction room
      io.to(`auction-${auctionId}`).emit('new-bid', bidData);

      // Send notification to previous highest bidder
      if (auction.bids.length > 1) {
        const previousBidder = auction.bids[auction.bids.length - 2];
        if (previousBidder.bidderId.toString() !== bidderId) {
          try {
            const notification = new Notification({
              userId: previousBidder.bidderId,
              type: "outbid",
              title: "You've been outbid!",
              message: `Someone placed a higher bid of ₹${amount} on ${auction.fishType}`,
              data: { auctionId, newBid: amount, fishType: auction.fishType },
              actionUrl: `/auction/${auctionId}`,
              priority: 'high'
            });
            await notification.save();
            
            // Emit notification to the outbid user
            io.emit(`notification-${previousBidder.bidderId}`, notification);
          } catch (error) {
            console.error("Error sending outbid notification:", error);
          }
        }
      }

      console.log(`✅ Bid placed successfully via socket`);

    } catch (error) {
      console.error('Error processing bid:', error);
      socket.emit('bid-error', { message: 'Server error processing bid' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Import routes
const authRoutes = require("./routes/authRoutes");
const fishRoutes = require("./routes/fishRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const walletRoutes = require("./routes/walletRoutes");
// In your main server file (app.js or server.js)
const notificationRoutes = require("./routes/notificationRoutes");


// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/fish", fishRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/auction", auctionRoutes);
app.use("/api/wallet", walletRoutes);
// Add this with your other routes
app.use("/api/notifications", notificationRoutes);


// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/seaconnect')
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("=".repeat(40));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket enabled`);
  console.log("=".repeat(40));
});

// Auto-complete expired auctions every minute
setInterval(async () => {
  try {
    const now = new Date();
    
    // Check auctions that reached end time
    const timeExpiredAuctions = await Auction.find({
      status: "Live",
      auctionEnd: { $lt: now }
    });

    for (const auction of timeExpiredAuctions) {
      if (auction.bids.length > 0) {
        const highestBid = auction.bids[auction.bids.length - 1];
        
        auction.status = "Completed";
        auction.autoCompleteAt = now;
        auction.autoCompleteReason = "time_end";
        auction.winner = {
          bidderId: highestBid.bidderId,
          bidderName: highestBid.bidderName,
          winningBid: highestBid.amount,
          wonAt: now
        };
        
        await auction.save();
        
        // Notify via socket
        io.to(`auction-${auction._id}`).emit('auction-ended', {
          auctionId: auction._id,
          winner: highestBid,
          message: `Auction ended! Winner: ${highestBid.bidderName} with ₹${highestBid.amount}`
        });

        // Create notifications
        const winnerNotif = new Notification({
          userId: highestBid.bidderId,
          type: "auction_won",
          title: "🎉 You won the auction!",
          message: `Congratulations! You won the auction for ${auction.fishType} with a bid of ₹${highestBid.amount}`,
          data: { auctionId: auction._id, winningBid: highestBid.amount },
          actionUrl: `/my-activity`,
          priority: 'high'
        });
        await winnerNotif.save();

        const sellerNotif = new Notification({
          userId: auction.sellerId,
          type: "auction_completed",
          title: "Auction Completed",
          message: `Your auction for ${auction.fishType} ended with winning bid of ₹${highestBid.amount}`,
          data: { auctionId: auction._id, winningBid: highestBid.amount },
          actionUrl: `/my-activity`,
          priority: 'medium'
        });
        await sellerNotif.save();

      } else {
        auction.status = "Cancelled";
        auction.autoCompleteReason = "no_bids";
        await auction.save();
        
        io.to(`auction-${auction._id}`).emit('auction-ended', {
          auctionId: auction._id,
          message: 'Auction ended with no bids'
        });
      }
    }

    // Check inactivity timeout (5 minutes)
    const inactivityThreshold = new Date(now - 5 * 60 * 1000);
    const inactiveAuctions = await Auction.find({
      status: "Live",
      lastBidTime: { $lt: inactivityThreshold },
      auctionEnd: { $gt: now }
    });

    for (const auction of inactiveAuctions) {
      if (auction.bids.length > 0) {
        const highestBid = auction.bids[auction.bids.length - 1];
        
        auction.status = "Completed";
        auction.autoCompleteAt = now;
        auction.autoCompleteReason = "inactivity";
        auction.winner = {
          bidderId: highestBid.bidderId,
          bidderName: highestBid.bidderName,
          winningBid: highestBid.amount,
          wonAt: now
        };
        
        await auction.save();
        
        io.to(`auction-${auction._id}`).emit('auction-ended', {
          auctionId: auction._id,
          winner: highestBid,
          message: `Auction ended due to inactivity! Winner: ${highestBid.bidderName}`
        });
      }
    }

  } catch (error) {
    console.error("Error in auction auto-complete:", error);
  }
}, 60000); // Check every minute

module.exports = { app, server, io };