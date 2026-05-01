// backend/routes/auctionRoutes.js
const express = require("express");
const router = express.Router();
const Auction = require("../models/Auction");
const Order = require("../models/Order");
const Notification = require("../models/Notification");

// =========================
// CREATE AUCTION (User)
// =========================
router.post("/create", async (req, res) => {
  try {
    console.log("Creating auction:", req.body);
    
    const {
      fishType,
      quantity,
      startingPrice,
      location,
      phone,
      description,
      fishImage,
      sellerId,
      sellerName
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!fishType) missingFields.push("fishType");
    if (!quantity) missingFields.push("quantity");
    if (!startingPrice) missingFields.push("startingPrice");
    if (!location) missingFields.push("location");
    if (!phone) missingFields.push("phone");
    if (!sellerId) missingFields.push("sellerId");
    if (!sellerName) missingFields.push("sellerName");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`
      });
    }

    // Create auction without auctionEnd (will be set by admin when approving)
    const auction = new Auction({
      fishType,
      quantity: Number(quantity),
      startingPrice: Number(startingPrice),
      currentBid: Number(startingPrice),
      location,
      sellerId,
      sellerName,
      sellerPhone: phone,
      description: description || "",
      image: fishImage || "default-fish.jpg",
      status: "Pending", // Default to Pending
      bidCount: 0,
      bids: [],
      lastBidTime: new Date()
      // auctionEnd is NOT set by user
    });

    const savedAuction = await auction.save();
    console.log("✅ Auction created (pending):", savedAuction._id);

    res.status(201).json({
      success: true,
      message: "Auction created successfully. It will be reviewed by admin.",
      data: savedAuction
    });

  } catch (error) {
    console.error("Error creating auction:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

// =========================
// APPROVE AUCTION (Admin) - Sets auction end time
// =========================
router.put("/:id/approve", async (req, res) => {
  try {
    const { auctionEnd } = req.body;
    
    console.log(`📝 Approving auction: ${req.params.id}`);
    console.log(`⏰ Setting end time to: ${auctionEnd}`);

    if (!auctionEnd) {
      return res.status(400).json({
        success: false,
        message: "Auction end time is required"
      });
    }

    const endTime = new Date(auctionEnd);
    const now = new Date();

    if (endTime <= now) {
      return res.status(400).json({
        success: false,
        message: "Auction end time must be in the future"
      });
    }

    const auction = await Auction.findByIdAndUpdate(
      req.params.id,
      { 
        status: "Live",
        auctionEnd: endTime,
        lastBidTime: now
      },
      { new: true }
    );
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found"
      });
    }
    
    console.log(`✅ Auction approved: ${auction._id}`);
    console.log(`📅 Ends at: ${auction.auctionEnd}`);

    // Notify seller
    await Notification.create({
      userId: auction.sellerId,
      type: "auction_approved",
      title: "✅ Auction Approved!",
      message: `Your auction for ${auction.fishType} is now live! Ends on ${new Date(auctionEnd).toLocaleString()}`,
      relatedId: auction._id,
      relatedModel: "Auction"
    });

    res.json({
      success: true,
      message: `Auction approved and set to end at ${new Date(auctionEnd).toLocaleString()}`,
      data: auction
    });
  } catch (error) {
    console.error("Error approving auction:", error);
    res.status(500).json({
      success: false,
      message: "Error approving auction"
    });
  }
});

// =========================
// GET ALL AUCTIONS (Admin)
// =========================
router.get("/all", async (req, res) => {
  try {
    const auctions = await Auction.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: auctions.length,
      data: auctions
    });
  } catch (error) {
    console.error("Error fetching auctions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching auctions"
    });
  }
});

// =========================
// GET LIVE AUCTIONS (For Browse Page)
// =========================
router.get("/live", async (req, res) => {
  try {
    const now = new Date();
    const auctions = await Auction.find({
      status: "Live",
      auctionEnd: { $gt: now }
    }).sort({ auctionEnd: 1 });
    
    res.json({
      success: true,
      count: auctions.length,
      data: auctions
    });
  } catch (error) {
    console.error("Error fetching live auctions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching live auctions"
    });
  }
});

// =========================
// GET PENDING AUCTIONS (Admin)
// =========================
router.get("/pending", async (req, res) => {
  try {
    const auctions = await Auction.find({ status: "Pending" })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: auctions.length,
      data: auctions
    });
  } catch (error) {
    console.error("Error fetching pending auctions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending auctions"
    });
  }
});

// =========================
// GET AUCTIONS BY SELLER
// =========================
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const auctions = await Auction.find({ sellerId: req.params.sellerId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: auctions.length,
      data: auctions
    });
  } catch (error) {
    console.error("Error fetching seller auctions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching seller auctions"
    });
  }
});

// =========================
// GET AUCTIONS BY BIDDER
// =========================
router.get("/bidder/:bidderId", async (req, res) => {
  try {
    const auctions = await Auction.find({
      "bids.bidderId": req.params.bidderId
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: auctions.length,
      data: auctions
    });
  } catch (error) {
    console.error("Error fetching bidder auctions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bidder auctions"
    });
  }
});

// =========================
// GET SINGLE AUCTION
// =========================
router.get("/:id", async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found"
      });
    }
    
    res.json({
      success: true,
      data: auction
    });
  } catch (error) {
    console.error("Error fetching auction:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching auction"
    });
  }
});

// =========================
// PLACE BID
// =========================
router.post("/:id/bid", async (req, res) => {
  try {
    const { id } = req.params;
    const { bidderId, bidderName, amount } = req.body;
    
    console.log(`📝 Bid request received:`);
    console.log(`- Auction ID: ${id}`);
    console.log(`- Bidder: ${bidderName} (${bidderId})`);
    console.log(`- Amount: ₹${amount}`);

    // Validate input
    if (!bidderId || !bidderName || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: bidderId, bidderName, amount"
      });
    }

    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Bid amount must be greater than 0"
      });
    }

    // Find the auction
    const auction = await Auction.findById(id);
    
    if (!auction) {
      console.log(`❌ Auction not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Auction not found"
      });
    }
    
    console.log(`✅ Auction found: ${auction.fishType}`);
    console.log(`- Current status: ${auction.status}`);
    console.log(`- Current bid: ₹${auction.currentBid}`);

    // Check if auction is live
    if (auction.status !== "Live") {
      return res.status(400).json({
        success: false,
        message: `Auction is not live. Current status: ${auction.status}`
      });
    }
    
    // Check if auction has ended
    const now = new Date();
    if (new Date(auction.auctionEnd) < now) {
      return res.status(400).json({
        success: false,
        message: "Auction has already ended"
      });
    }
    
    // Check bid amount
    if (amount <= auction.currentBid) {
      return res.status(400).json({
        success: false,
        message: `Bid must be greater than current bid ₹${auction.currentBid}`
      });
    }

    // Minimum increment check (₹50)
    const minIncrement = 50;
    const minAllowedBid = auction.currentBid + minIncrement;
    
    if (amount < minAllowedBid) {
      return res.status(400).json({
        success: false,
        message: `Minimum bid increment is ₹${minIncrement}. Minimum allowed bid: ₹${minAllowedBid}`
      });
    }

    // Create bid object
    const newBid = {
      bidderId,
      bidderName,
      amount,
      timestamp: new Date()
    };

    // Initialize bids array if it doesn't exist
    if (!auction.bids) {
      auction.bids = [];
    }

    // Add bid to auction
    auction.bids.push(newBid);
    auction.currentBid = amount;
    auction.bidCount = (auction.bidCount || 0) + 1;
    auction.lastBidTime = new Date();

    // Save auction
    await auction.save();
    
    console.log(`✅ Bid placed successfully!`);
    console.log(`- New bid count: ${auction.bidCount}`);
    console.log(`- New current bid: ₹${auction.currentBid}`);

    // Send notification to previous highest bidder if they got outbid
    if (auction.bids.length > 1) {
      const previousBidder = auction.bids[auction.bids.length - 2];
      if (previousBidder.bidderId.toString() !== bidderId) {
        try {
          await Notification.create({
            userId: previousBidder.bidderId,
            type: "outbid",
            title: "You've been outbid!",
            message: `Someone placed a higher bid of ₹${amount} on ${auction.fishType}`,
            relatedId: auction._id,
            relatedModel: "Auction"
          });
          console.log(`📧 Notification sent to ${previousBidder.bidderName}`);
        } catch (notifError) {
          console.error("Error sending notification:", notifError);
        }
      }
    }

    res.json({
      success: true,
      message: "Bid placed successfully",
      data: {
        currentBid: auction.currentBid,
        bidCount: auction.bidCount,
        lastBidTime: auction.lastBidTime,
        yourBid: amount
      }
    });
    
  } catch (error) {
    console.error("❌ Error placing bid:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    
    res.status(500).json({
      success: false,
      message: "Server error while placing bid",
      error: error.message
    });
  }
});

// =========================
// COMPLETE AUCTION (Admin)
// =========================
router.post("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 Completing auction: ${id}`);

    // Find the auction
    const auction = await Auction.findById(id);
    
    if (!auction) {
      console.log(`❌ Auction not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Auction not found"
      });
    }

    console.log(`✅ Auction found: ${auction.fishType}`);
    console.log(`- Current status: ${auction.status}`);
    console.log(`- Total bids: ${auction.bidCount}`);

    // Check if auction is live
    if (auction.status !== "Live") {
      return res.status(400).json({
        success: false,
        message: `Auction is not live. Current status: ${auction.status}`
      });
    }

    // Check if there are any bids
    if (!auction.bids || auction.bids.length === 0) {
      // No bids - cancel the auction
      auction.status = "Cancelled";
      auction.autoCompleteAt = new Date();
      auction.autoCompleteReason = "no_bids";
      
      await auction.save();
      
      console.log(`✅ Auction cancelled - no bids placed`);
      
      return res.json({
        success: true,
        message: "Auction cancelled - no bids placed",
        data: auction
      });
    }

    // Get the highest bidder (last bid in array)
    const highestBid = auction.bids[auction.bids.length - 1];
    
    console.log(`🏆 Highest bidder: ${highestBid.bidderName}`);
    console.log(`💰 Winning bid: ₹${highestBid.amount}`);

    // Update auction status
    auction.status = "Completed";
    auction.autoCompleteAt = new Date();
    auction.autoCompleteReason = "admin_complete";
    auction.winner = {
      bidderId: highestBid.bidderId,
      bidderName: highestBid.bidderName,
      winningBid: highestBid.amount,
      wonAt: new Date()
    };
    
    await auction.save();

    // Create order for the winner
    const Order = require("../models/Order");
    
    // Check if order already exists for this auction
    const existingOrder = await Order.findOne({ auctionId: auction._id });
    
    if (existingOrder) {
      console.log(`✅ Order already exists for this auction`);
      return res.json({
        success: true,
        message: "Auction completed successfully (order already exists)",
        data: {
          auction,
          order: existingOrder
        }
      });
    }

    // Create new order
    const orderData = {
      customerName: highestBid.bidderName,
      customerPhone: "Pending",
      deliveryLocation: "Pending",
      fishId: auction._id.toString(),
      fishType: auction.fishType,
      sellerId: auction.sellerId.toString(),
      sellerName: auction.sellerName,
      sellerPhone: auction.sellerPhone,
      pricePerKg: auction.currentBid / auction.quantity,
      quantity: auction.quantity,
      totalAmount: auction.currentBid,
      paymentMethod: "cash",
      specialInstructions: `Auction won for ${auction.fishType}`,
      orderType: "auction",
      auctionId: auction._id,
      status: "Pending"
    };

    console.log("📦 Creating order:", orderData);

    const newOrder = new Order(orderData);
    await newOrder.save();

    console.log(`✅ Order created successfully: ${newOrder._id}`);

    // Notify winner
    await Notification.create({
      userId: highestBid.bidderId,
      type: "auction_won",
      title: "🎉 You won the auction!",
      message: `Congratulations! You won the auction for ${auction.fishType} with a bid of ₹${highestBid.amount}`,
      relatedId: auction._id,
      relatedModel: "Auction"
    });

    // Notify seller
    await Notification.create({
      userId: auction.sellerId,
      type: "auction_completed",
      title: "Auction Completed",
      message: `Your auction for ${auction.fishType} ended with winning bid of ₹${highestBid.amount}`,
      relatedId: auction._id,
      relatedModel: "Auction"
    });

    res.json({
      success: true,
      message: "Auction completed and order created",
      data: {
        auction,
        order: newOrder
      }
    });

  } catch (error) {
    console.error("❌ Error completing auction:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    
    res.status(500).json({
      success: false,
      message: "Error completing auction",
      error: error.message
    });
  }
});

// =========================
// CHECK AND COMPLETE EXPIRED AUCTIONS (Cron job)
// =========================
router.post("/check-expired", async (req, res) => {
  try {
    const now = new Date();
    const results = {
      timeEnded: [],
      inactivityEnded: [],
      noBidsCancelled: []
    };
    
    // 1. Check auctions that reached end time
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
        
        // Create order (delivery details to be filled by winner)
        const orderData = {
          customerName: highestBid.bidderName,
          customerPhone: "Pending",
          deliveryLocation: "Pending",
          fishId: auction._id,
          fishType: auction.fishType,
          sellerId: auction.sellerId,
          sellerName: auction.sellerName,
          sellerPhone: auction.sellerPhone,
          pricePerKg: auction.currentBid / auction.quantity,
          quantity: auction.quantity,
          totalAmount: auction.currentBid,
          paymentMethod: "cash",
          specialInstructions: `Auction won for ${auction.fishType} (auto-completed at end time)`,
          orderType: "auction",
          auctionId: auction._id,
          status: "Pending"
        };

        const Order = require("../models/Order");
        const newOrder = new Order(orderData);
        await newOrder.save();
        
        results.timeEnded.push(auction._id);
        
        // Notify winner
        await Notification.create({
          userId: highestBid.bidderId,
          type: "auction_won",
          title: "🎉 You won the auction!",
          message: `Congratulations! You won the auction for ${auction.fishType} with a bid of ₹${highestBid.amount}`,
          relatedId: auction._id,
          relatedModel: "Auction"
        });

        // Notify seller
        await Notification.create({
          userId: auction.sellerId,
          type: "auction_completed",
          title: "Auction Completed",
          message: `Your auction for ${auction.fishType} ended with winning bid of ₹${highestBid.amount}`,
          relatedId: auction._id,
          relatedModel: "Auction"
        });
      } else {
        auction.status = "Cancelled";
        auction.autoCompleteReason = "no_bids";
        await auction.save();
        results.noBidsCancelled.push(auction._id);
      }
    }

    // 2. Check inactivity timeout (5 minutes with no bids)
    const inactivityThreshold = new Date(now - 5 * 60 * 1000); // 5 minutes ago
    const inactiveAuctions = await Auction.find({
      status: "Live",
      lastBidTime: { $lt: inactivityThreshold },
      auctionEnd: { $gt: now } // Still not ended by time
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
        
        // Create order
        const orderData = {
          customerName: highestBid.bidderName,
          customerPhone: "Pending",
          deliveryLocation: "Pending",
          fishId: auction._id,
          fishType: auction.fishType,
          sellerId: auction.sellerId,
          sellerName: auction.sellerName,
          sellerPhone: auction.sellerPhone,
          pricePerKg: auction.currentBid / auction.quantity,
          quantity: auction.quantity,
          totalAmount: auction.currentBid,
          paymentMethod: "cash",
          specialInstructions: `Auction won for ${auction.fishType} (auto-completed due to 5min inactivity)`,
          orderType: "auction",
          auctionId: auction._id,
          status: "Pending"
        };

        const Order = require("../models/Order");
        const newOrder = new Order(orderData);
        await newOrder.save();
        
        results.inactivityEnded.push(auction._id);
        
        // Notify winner
        await Notification.create({
          userId: highestBid.bidderId,
          type: "auction_won",
          title: "🎉 You won the auction!",
          message: `Congratulations! You won the auction for ${auction.fishType} with a bid of ₹${highestBid.amount}`,
          relatedId: auction._id,
          relatedModel: "Auction"
        });

        // Notify seller
        await Notification.create({
          userId: auction.sellerId,
          type: "auction_completed",
          title: "Auction Completed",
          message: `Your auction for ${auction.fishType} ended with winning bid of ₹${highestBid.amount}`,
          relatedId: auction._id,
          relatedModel: "Auction"
        });
      }
    }

    res.json({
      success: true,
      message: "Auto-complete check completed",
      data: results
    });

  } catch (error) {
    console.error("Error checking expired auctions:", error);
    res.status(500).json({
      success: false,
      message: "Error checking expired auctions"
    });
  }
});

// =========================
// UPDATE AUCTION STATUS (Admin)
// =========================
router.put("/:id/status", async (req, res) => {
  try {
    const { status, auctionEnd } = req.body;
    
    const updateData = { status };
    
    // If setting to Live and auctionEnd is provided, update it
    if (status === "Live" && auctionEnd) {
      updateData.auctionEnd = new Date(auctionEnd);
      updateData.lastBidTime = new Date();
    }
    
    const auction = await Auction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found"
      });
    }
    
    res.json({
      success: true,
      message: `Auction ${status}`,
      data: auction
    });
  } catch (error) {
    console.error("Error updating auction:", error);
    res.status(500).json({
      success: false,
      message: "Error updating auction"
    });
  }
});

// =========================
// UPDATE DELIVERY DETAILS FOR WON AUCTION
// =========================
// =========================
// UPDATE DELIVERY DETAILS FOR WON AUCTION
// =========================
// =========================
// UPDATE DELIVERY DETAILS FOR WON AUCTION
// =========================
// backend/routes/auctionRoutes.js - Add or update this endpoint

// =========================
// UPDATE DELIVERY DETAILS FOR WON AUCTION
// =========================
// backend/routes/auctionRoutes.js - Updated delivery endpoint

// =========================
// UPDATE DELIVERY DETAILS FOR WON AUCTION
// =========================
// backend/routes/auctionRoutes.js - Updated delivery endpoint

// =========================
// UPDATE DELIVERY DETAILS FOR WON AUCTION
// =========================
router.put("/:id/delivery", async (req, res) => {
  try {
    const { customerName, customerPhone, deliveryLocation, paymentMethod, transportCharge, grandTotal, distance, customerEmail } = req.body;
    
    console.log("=".repeat(50));
    console.log("📝 UPDATING DELIVERY DETAILS");
    console.log("=".repeat(50));
    console.log("Auction ID:", req.params.id);
    console.log("Request body:", req.body);

    // Validate required fields
    const missingFields = [];
    if (!customerName) missingFields.push("customerName");
    if (!customerPhone) missingFields.push("customerPhone");
    if (!deliveryLocation) missingFields.push("deliveryLocation");
    if (!paymentMethod) missingFields.push("paymentMethod");
    
    if (missingFields.length > 0) {
      console.log("❌ Missing fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`
      });
    }

    // Validate payment method
    const validPaymentMethods = ['cash', 'online', 'wallet'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`
      });
    }

    // Find the auction
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      console.log("❌ Auction not found:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Auction not found"
      });
    }
    
    console.log("✅ Auction found:");
    console.log("- ID:", auction._id);
    console.log("- Fish Type:", auction.fishType);
    console.log("- Status:", auction.status);
    console.log("- Winner exists:", !!auction.winner);

    // Check if auction is completed
    if (auction.status !== "Completed") {
      console.log("❌ Auction is not completed. Current status:", auction.status);
      return res.status(400).json({
        success: false,
        message: `Auction is not completed. Current status: ${auction.status}`
      });
    }

    // Initialize winner object if it doesn't exist
    if (!auction.winner) {
      console.log("⚠️ Winner object missing, creating new winner object");
      auction.winner = {
        bidderId: user?._id || "unknown",
        bidderName: customerName,
        winningBid: auction.currentBid || 0,
        wonAt: new Date()
      };
    }

    // Create delivery details object
    const deliveryDetails = {
      customerName,
      customerPhone,
      deliveryLocation,
      paymentMethod,
      updatedAt: new Date()
    };

    console.log("📦 Saving delivery details:", deliveryDetails);

    // Update winner delivery details
    auction.winner.deliveryDetails = deliveryDetails;
    
    // Save the auction
    await auction.save();
    console.log("✅ Auction updated with delivery details");

    // Handle the associated order
    try {
      const Order = require("../models/Order");
      
      // Check if order already exists
      let order = await Order.findOne({ auctionId: auction._id });
      
      if (order) {
        console.log("📦 Found existing order:", order._id);
        
        // Update existing order
        order.customerName = customerName;
        order.customerPhone = customerPhone;
        order.customerEmail = customerEmail || order.customerEmail;
        order.deliveryLocation = deliveryLocation;
        order.paymentMethod = paymentMethod;
        order.transportCharge = transportCharge || order.transportCharge || 0;
        order.grandTotal = grandTotal || order.grandTotal || auction.winner.winningBid;
        order.distance = distance || order.distance || 0;
        order.deliveryCity = deliveryLocation;
        
        await order.save();
        console.log("✅ Order updated successfully");
      } else {
        console.log("📦 No existing order found, creating new order");
        
        // Create new order
        const newOrder = new Order({
          customerName,
          customerPhone,
          customerEmail: customerEmail || '',
          deliveryLocation,
          fishId: auction._id,
          fishType: auction.fishType,
          quantity: auction.quantity,
          pricePerKg: Math.round((auction.winner.winningBid || auction.currentBid) / auction.quantity),
          totalAmount: auction.winner.winningBid || auction.currentBid,
          transportCharge: transportCharge || 0,
          grandTotal: grandTotal || (auction.winner.winningBid || auction.currentBid) + (transportCharge || 0),
          distance: distance || 0,
          sellerId: auction.sellerId,
          sellerName: auction.sellerName,
          sellerPhone: auction.sellerPhone,
          sellerLocation: auction.location,
          deliveryCity: deliveryLocation,
          paymentMethod,
          paymentStatus: paymentMethod === "cash" ? "Pending" : "Paid",
          orderType: "auction",
          auctionId: auction._id,
          status: "Pending",
          orderDate: new Date()
        });
        
        await newOrder.save();
        console.log("✅ New order created:", newOrder._id);
      }
    } catch (orderError) {
      console.error("❌ Error handling order:", orderError);
      // Don't fail the request if order handling fails
    }
    
    res.json({
      success: true,
      message: "Delivery details updated successfully",
      data: {
        auction,
        deliveryDetails
      }
    });
    
  } catch (error) {
    console.error("❌ Error updating delivery details:");
    console.error("- Error name:", error.name);
    console.error("- Error message:", error.message);
    console.error("- Error stack:", error.stack);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      console.error("Validation errors:", validationErrors);
      
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error updating delivery details",
      error: error.message
    });
  }
});

// =========================
// DELETE AUCTION (Admin)
// =========================
router.delete("/:id", async (req, res) => {
  try {
    const auction = await Auction.findByIdAndDelete(req.params.id);
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found"
      });
    }
    
    res.json({
      success: true,
      message: "Auction deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting auction:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting auction"
    });
  }
});

module.exports = router;