// backend/routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Fish = require("../models/Fish");
const Notification = require("../models/Notification");
const User = require("../models/User"); // Added for wallet operations
const Transaction = require("../models/Transaction"); // Added for wallet transactions
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY );

// =====================================
// CREDIT SELLER WALLET (Internal function)
// =====================================
const creditSellerWallet = async (sellerId, amount, description, orderId, fishType) => {
  try {
    console.log(`💰 Crediting seller wallet: ${sellerId} with amount: ₹${amount}`);

    // Find seller
    const seller = await User.findById(sellerId);
    if (!seller) {
      console.error("❌ Seller not found:", sellerId);
      return { success: false, error: "Seller not found" };
    }

    // Initialize wallet balance if not exists
    if (!seller.walletBalance) {
      seller.walletBalance = 0;
    }

    // Update seller's wallet balance
    const oldBalance = seller.walletBalance;
    seller.walletBalance = oldBalance + amount;
    await seller.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: sellerId,
      amount: amount,
      type: 'credit',
      paymentMethod: 'wallet',
      description: description || `Earnings from sale`,
      balance: seller.walletBalance,
      orderDetails: {
        orderId: orderId,
        fishType: fishType
      },
      date: new Date()
    });
    
    await transaction.save();

    // Create notification for seller
    await Notification.create({
      userId: sellerId,
      type: "payment_received",
      title: "💰 Payment Received!",
      message: `You have received ₹${Math.round(amount).toLocaleString()} for your sale.`,
      relatedId: orderId,
      relatedModel: "Order",
      data: { amount, fishType, orderId }
    });

    console.log(`✅ Seller wallet credited successfully. New balance: ${seller.walletBalance}`);
    
    return { 
      success: true, 
      newBalance: seller.walletBalance,
      transaction: transaction 
    };

  } catch (error) {
    console.error("❌ Error crediting seller wallet:", error);
    return { success: false, error: error.message };
  }
};

// =====================================
// CREATE NEW ORDER (Regular, Auction, Online, Wallet)
// =====================================
router.post("/create", async (req, res) => {
  try {
    console.log("=".repeat(50));
    console.log("📦 ORDER CREATION REQUEST RECEIVED");
    console.log("=".repeat(50));
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryLocation,
      fishId,
      fishType,
      quantity,
      pricePerKg,
      totalAmount,
      transportCharge,
      platformFee,
      sellerAmount,
      grandTotal,
      distance,
      sellerId,
      sellerName,
      sellerPhone,
      sellerLocation,
      deliveryCity,
      paymentMethod,
      paymentStatus,
      stripePaymentIntentId,
      walletTransactionId,
      specialInstructions,
      orderType,
      auctionId
    } = req.body;

    // Log all received fields
    console.log("\n📋 Received fields:");
    console.log("- customerName:", customerName);
    console.log("- customerPhone:", customerPhone);
    console.log("- customerEmail:", customerEmail);
    console.log("- deliveryLocation:", deliveryLocation);
    console.log("- fishId:", fishId);
    console.log("- fishType:", fishType);
    console.log("- quantity:", quantity);
    console.log("- pricePerKg:", pricePerKg);
    console.log("- totalAmount:", totalAmount);
    console.log("- transportCharge:", transportCharge);
    console.log("- platformFee:", platformFee);
    console.log("- sellerAmount:", sellerAmount);
    console.log("- grandTotal:", grandTotal);
    console.log("- distance:", distance);
    console.log("- sellerId:", sellerId);
    console.log("- sellerName:", sellerName);
    console.log("- sellerPhone:", sellerPhone);
    console.log("- sellerLocation:", sellerLocation);
    console.log("- deliveryCity:", deliveryCity);
    console.log("- paymentMethod:", paymentMethod);
    console.log("- paymentStatus:", paymentStatus);
    console.log("- orderType:", orderType);
    console.log("- auctionId:", auctionId);

    // Validate required fields
    const missingFields = [];
    if (!customerName) missingFields.push("customerName");
    if (!customerPhone) missingFields.push("customerPhone");
    if (!deliveryLocation) missingFields.push("deliveryLocation");
    if (!fishId) missingFields.push("fishId");
    if (!fishType) missingFields.push("fishType");
    if (!quantity) missingFields.push("quantity");
    if (!pricePerKg) missingFields.push("pricePerKg");
    if (!totalAmount) missingFields.push("totalAmount");
    if (!sellerId) missingFields.push("sellerId");
    if (!sellerName) missingFields.push("sellerName");
    if (!sellerPhone) missingFields.push("sellerPhone");

    if (missingFields.length > 0) {
      console.error("❌ Missing fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`
      });
    }

    console.log("\n✅ All required fields present");

    // Validate numeric values
    const quantityNum = Number(quantity);
    const priceNum = Number(pricePerKg);
    const totalNum = Number(totalAmount);
    const transportNum = Number(transportCharge) || 0;
    const platformNum = Number(platformFee) || 0;
    const sellerNum = Number(sellerAmount) || 0;
    const grandNum = Number(grandTotal) || (totalNum + transportNum);
    const distanceNum = Number(distance) || 0;

    console.log("\n🔢 Converted numbers:");
    console.log("- quantityNum:", quantityNum);
    console.log("- priceNum:", priceNum);
    console.log("- totalNum:", totalNum);
    console.log("- transportNum:", transportNum);
    console.log("- platformNum:", platformNum);
    console.log("- sellerNum:", sellerNum);
    console.log("- grandNum:", grandNum);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number"
      });
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number"
      });
    }

    if (isNaN(totalNum) || totalNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total amount must be a positive number"
      });
    }

    console.log("\n✅ Number validation passed");

    // Check fish availability for regular orders (not auction)
    if (orderType !== "auction") {
      console.log("\n🔍 Looking for fish with ID:", fishId);
      
      let fish;
      try {
        fish = await Fish.findById(fishId);
        console.log("Fish found:", fish ? "YES" : "NO");
        if (fish) {
          console.log("- Fish type:", fish.fishType);
          console.log("- Available quantity:", fish.availableQuantity);
          console.log("- Fish status:", fish.status);
        }
      } catch (fishError) {
        console.error("❌ Error finding fish:", fishError);
        return res.status(500).json({
          success: false,
          message: "Error finding fish",
          error: fishError.message
        });
      }

      if (!fish) {
        return res.status(404).json({
          success: false,
          message: "Fish listing not found"
        });
      }

      if (fish.availableQuantity < quantityNum) {
        return res.status(400).json({
          success: false,
          message: `Only ${fish.availableQuantity} kg available`
        });
      }

      console.log("\n✅ Fish availability check passed");
    }

    // Create order object with all fields
    console.log("\n📝 Creating order object...");
    
    const orderData = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail || '',
      deliveryLocation: deliveryLocation.trim(),
      fishId,
      fishType: fishType.trim(),
      quantity: quantityNum,
      pricePerKg: priceNum,
      totalAmount: totalNum,
      transportCharge: transportNum,
      platformFee: platformNum,
      sellerAmount: sellerNum,
      grandTotal: grandNum,
      distance: distanceNum,
      sellerId,
      sellerName: sellerName.trim(),
      sellerPhone: sellerPhone.trim(),
      sellerLocation: sellerLocation || '',
      deliveryCity: deliveryCity || '',
      paymentMethod: paymentMethod || "cash",
      paymentStatus: paymentStatus || (paymentMethod === "online" || paymentMethod === "wallet" ? "Paid" : "Pending"),
      specialInstructions: specialInstructions || "",
      orderType: orderType || "regular",
      auctionId: auctionId || null,
      status: "Pending",
      orderDate: new Date()
    };

    // Add payment fields if present
    if (stripePaymentIntentId) {
      orderData.stripePaymentIntentId = stripePaymentIntentId;
      console.log("- Added stripePaymentIntentId:", stripePaymentIntentId);
    }
    
    if (walletTransactionId) {
      orderData.walletTransactionId = walletTransactionId;
      console.log("- Added walletTransactionId:", walletTransactionId);
    }

    console.log("Order data to save:", JSON.stringify(orderData, null, 2));

    console.log("\n💾 Saving order to database...");
    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();
    
    console.log("✅ Order saved successfully!");
    console.log("- Order ID:", savedOrder._id);

    // Update fish available quantity for regular orders
    if (orderType !== "auction") {
      console.log("\n🔄 Updating fish quantity...");
      try {
        const fish = await Fish.findById(fishId);
        if (fish) {
          fish.availableQuantity -= quantityNum;
          
          if (fish.availableQuantity === 0) {
            fish.status = "Sold Out";
            console.log("📦 Fish is now SOLD OUT");
          }
          
          // Add order to history
          if (!fish.orders) fish.orders = [];
          fish.orders.push({
            orderId: savedOrder._id,
            quantity: quantityNum,
            customerName: customerName,
            orderedAt: new Date()
          });
          
          await fish.save();
          console.log("✅ Fish updated successfully");
          console.log("- New available quantity:", fish.availableQuantity);
        }
      } catch (fishError) {
        console.error("⚠️ Error updating fish quantity:", fishError);
        // Don't fail the order if fish update fails
      }
    }

    // ========== CREDIT SELLER WALLET IF PAYMENT IS PAID ==========
    if (paymentStatus === 'Paid' || paymentMethod === 'online' || paymentMethod === 'wallet') {
      console.log("\n💰 Processing seller wallet credit...");
      
      // Calculate seller amount (92% after platform fee if not provided)
      const amountToCredit = sellerNum > 0 ? sellerNum : Math.round(totalNum * 0.92);
      
      const creditResult = await creditSellerWallet(
        sellerId,
        amountToCredit,
        `Earnings from sale of ${quantityNum}kg ${fishType}`,
        savedOrder._id,
        fishType
      );
      
      if (creditResult.success) {
        console.log(`✅ Seller credited: ₹${amountToCredit}`);
      } else {
        console.error("❌ Failed to credit seller:", creditResult.error);
      }
    }

    // Create notification for seller
    try {
      if (Notification) {
        await Notification.create({
          userId: sellerId,
          type: "order_placed",
          title: "📦 New Order Received",
          message: `You have a new order for ${quantity}kg of ${fishType}`,
          relatedId: savedOrder._id,
          relatedModel: "Order"
        });
        console.log("✅ Notification sent to seller");
      }
    } catch (notifError) {
      console.error("⚠️ Error creating notification:", notifError);
    }

    console.log("\n=".repeat(50));
    console.log("✅ ORDER CREATION COMPLETE");
    console.log("=".repeat(50));

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: savedOrder
    });

  } catch (error) {
    console.error("\n❌❌❌ ERROR CREATING ORDER ❌❌❌");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    if (error.name === 'ValidationError') {
      console.error("Validation errors:", error.errors);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }
    
    if (error.name === 'CastError') {
      console.error("Cast error:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error while creating order",
      error: error.message
    });
  }
});

// =====================================
// TEST ENDPOINT
// =====================================
router.get("/test-model", async (req, res) => {
  try {
    console.log("Testing Order model...");
    
    console.log("Order model:", typeof Order);
    console.log("Order model prototype:", Order.prototype);
    
    const schemaPaths = Order.schema.paths;
    console.log("\nSchema fields:");
    Object.keys(schemaPaths).forEach(key => {
      console.log(`- ${key}: ${schemaPaths[key].instance}, required: ${schemaPaths[key].isRequired}`);
    });
    
    res.json({
      success: true,
      message: "Order model is working",
      schemaFields: Object.keys(schemaPaths)
    });
    
  } catch (error) {
    console.error("Error testing model:", error);
    res.status(500).json({
      success: false,
      message: "Error testing model",
      error: error.message
    });
  }
});

// =====================================
// CREATE PAYMENT INTENT (Stripe)
// =====================================
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = 'inr', orderData } = req.body;

    console.log("💰 Creating payment intent for amount:", amount);

    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        fishType: orderData?.fishType || 'Fish',
        customerName: orderData?.customerName || 'Customer',
        customerPhone: orderData?.customerPhone || '',
        quantity: orderData?.quantity?.toString() || '0',
        orderType: orderData?.orderType || 'regular'
      },
    });

    console.log("✅ Payment intent created:", paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error("❌ Error creating payment intent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
      error: error.message,
    });
  }
});

// =====================================
// VERIFY AND CONFIRM PAYMENT
// =====================================
router.post("/verify-payment", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID is required"
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      res.json({
        success: true,
        message: "Payment verified successfully",
        paymentIntent
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Payment not successful. Status: ${paymentIntent.status}`,
        paymentIntent
      });
    }

  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message
    });
  }
});

// =====================================
// GET ALL ORDERS (Admin)
// =====================================
router.get("/all", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders"
    });
  }
});

// =====================================
// GET ORDERS BY SELLER
// =====================================
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const orders = await Order.find({ sellerId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders"
    });
  }
});

// =====================================
// GET ORDERS BY CUSTOMER PHONE
// =====================================
router.get("/customer/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    
    const orders = await Order.find({ customerPhone: phone })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders"
    });
  }
});

// =====================================
// GET ORDER BY ID
// =====================================
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order"
    });
  }
});

// =====================================
// UPDATE ORDER STATUS
// =====================================
router.put("/:id/status", async (req, res) => {
  try {
    const { status, paymentStatus, cancellationReason } = req.body;
    
    const validStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }
    
    const updateData = { status };
    
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    
    if (cancellationReason) {
      updateData.cancellationReason = cancellationReason;
      updateData.cancelledAt = new Date();
    }
    
    if (status === "Delivered") {
      updateData.deliveredAt = new Date();
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // If order is cancelled and it's a regular order, restore fish quantity
    if (status === "Cancelled" && order.orderType !== "auction") {
      try {
        const fish = await Fish.findById(order.fishId);
        if (fish) {
          fish.availableQuantity += order.quantity;
          
          if (fish.status === "Sold Out" && fish.availableQuantity > 0) {
            fish.status = "Verified";
          }
          
          await fish.save();
          console.log("✅ Fish quantity restored for cancelled order");
        }
      } catch (fishError) {
        console.error("⚠️ Error restoring fish quantity:", fishError);
      }
    }
    
    // If order is delivered, update payment status if needed
    if (status === "Delivered" && order.paymentMethod === "cash") {
      order.paymentStatus = "Paid";
      await order.save();
      
      // ========== CREDIT SELLER WALLET WHEN ORDER IS DELIVERED (CASH PAYMENT) ==========
      console.log("\n💰 Processing seller wallet credit for delivered order...");
      
      const creditResult = await creditSellerWallet(
        order.sellerId,
        order.sellerAmount || Math.round(order.totalAmount * 0.92),
        `Earnings from sale of ${order.quantity}kg ${order.fishType} (Delivered)`,
        order._id,
        order.fishType
      );
      
      if (creditResult.success) {
        console.log(`✅ Seller credited: ₹${order.sellerAmount || Math.round(order.totalAmount * 0.92)}`);
      } else {
        console.error("❌ Failed to credit seller:", creditResult.error);
      }
    }
    
    res.json({
      success: true,
      message: "Order updated successfully",
      data: order
    });
  } catch (error) {
    console.error("❌ Error updating order:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order"
    });
  }
});

// =====================================
// GET ORDER STATISTICS (Admin)
// =====================================
router.get("/stats/overview", async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "Pending" });
    const processingOrders = await Order.countDocuments({ status: "Processing" });
    const shippedOrders = await Order.countDocuments({ status: "Shipped" });
    const deliveredOrders = await Order.countDocuments({ status: "Delivered" });
    const cancelledOrders = await Order.countDocuments({ status: "Cancelled" });
    
    const deliveredOrdersData = await Order.find({ status: "Delivered" });
    const totalRevenue = deliveredOrdersData.reduce((sum, order) => sum + order.grandTotal, 0);
    
    const cashOrders = await Order.countDocuments({ paymentMethod: "cash" });
    const onlineOrders = await Order.countDocuments({ paymentMethod: "online" });
    const walletOrders = await Order.countDocuments({ paymentMethod: "wallet" });
    
    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        cashOrders,
        onlineOrders,
        walletOrders
      }
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order statistics"
    });
  }
});

// =====================================
// STRIPE WEBHOOK (For payment events)
// =====================================
router.post("/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`✅ PaymentIntent ${paymentIntent.id} succeeded`);
      
      try {
        const order = await Order.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          { paymentStatus: "Paid" },
          { new: true }
        );
        
        console.log(`✅ Order updated for payment ${paymentIntent.id}`);
        
        // ========== CREDIT SELLER WALLET WHEN PAYMENT SUCCEEDS ==========
        if (order) {
          console.log("\n💰 Processing seller wallet credit from webhook...");
          
          const creditResult = await creditSellerWallet(
            order.sellerId,
            order.sellerAmount || Math.round(order.totalAmount * 0.92),
            `Earnings from sale of ${order.quantity}kg ${order.fishType}`,
            order._id,
            order.fishType
          );
          
          if (creditResult.success) {
            console.log(`✅ Seller credited: ₹${order.sellerAmount || Math.round(order.totalAmount * 0.92)}`);
          } else {
            console.error("❌ Failed to credit seller:", creditResult.error);
          }
        }
      } catch (err) {
        console.error("Error updating order:", err);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log(`❌ Payment failed:`, failedPayment.id);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// =====================================
// DELETE ORDER (Admin)
// =====================================
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    // Restore fish quantity if order is deleted (regular orders only)
    if (order.orderType !== "auction") {
      const fish = await Fish.findById(order.fishId);
      if (fish) {
        fish.availableQuantity += order.quantity;
        await fish.save();
      }
    }
    
    res.json({
      success: true,
      message: "Order deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting order"
    });
  }
});

// =====================================
// GET ORDER BY AUCTION ID
// =====================================
router.get("/auction/:auctionId", async (req, res) => {
  try {
    const { auctionId } = req.params;
    console.log(`🔍 Finding order for auction: ${auctionId}`);

    const order = await Order.findOne({ auctionId: auctionId });
    
    if (!order) {
      console.log(`❌ No order found for auction: ${auctionId}`);
      return res.status(404).json({
        success: false,
        message: "Order not found for this auction"
      });
    }

    console.log(`✅ Found order: ${order._id} for auction: ${auctionId}`);
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error("❌ Error finding order by auction:", error);
    res.status(500).json({
      success: false,
      message: "Error finding order",
      error: error.message
    });
  }
});

// =====================================
// UPDATE ORDER DELIVERY DETAILS
// =====================================
router.put("/:orderId/delivery", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      customerName, 
      customerPhone, 
      deliveryLocation, 
      paymentMethod,
      transportCharge,
      grandTotal,
      distance 
    } = req.body;

    console.log(`📝 Updating delivery details for order: ${orderId}`);
    console.log("Update data:", req.body);

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update order fields
    if (customerName) order.customerName = customerName;
    if (customerPhone) order.customerPhone = customerPhone;
    if (deliveryLocation) order.deliveryLocation = deliveryLocation;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (transportCharge) order.transportCharge = transportCharge;
    if (grandTotal) order.grandTotal = grandTotal;
    if (distance) order.distance = distance;

    await order.save();

    console.log(`✅ Order ${orderId} delivery details updated successfully`);

    res.json({
      success: true,
      message: "Delivery details updated successfully",
      data: order
    });
  } catch (error) {
    console.error("❌ Error updating order delivery:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order",
      error: error.message
    });
  }
});

// =====================================
// UPDATE ORDER PAYMENT STATUS
// =====================================
router.put("/:orderId/payment", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      paymentStatus, 
      paymentMethod,
      walletTransactionId,
      transportCharge,
      grandTotal,
      distance 
    } = req.body;

    console.log(`💰 Updating payment for order: ${orderId}`);
    console.log("Payment data:", req.body);

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update payment fields
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (walletTransactionId) order.walletTransactionId = walletTransactionId;
    if (transportCharge) order.transportCharge = transportCharge;
    if (grandTotal) order.grandTotal = grandTotal;
    if (distance) order.distance = distance;

    await order.save();

    console.log(`✅ Payment updated for order ${orderId}`);

    // ========== CREDIT SELLER WALLET WHEN PAYMENT IS UPDATED TO PAID ==========
    if (paymentStatus === 'Paid') {
      console.log("\n💰 Processing seller wallet credit from payment update...");
      
      const creditResult = await creditSellerWallet(
        order.sellerId,
        order.sellerAmount || Math.round(order.totalAmount * 0.92),
        `Earnings from sale of ${order.quantity}kg ${order.fishType}`,
        order._id,
        order.fishType
      );
      
      if (creditResult.success) {
        console.log(`✅ Seller credited: ₹${order.sellerAmount || Math.round(order.totalAmount * 0.92)}`);
      } else {
        console.error("❌ Failed to credit seller:", creditResult.error);
      }
    }

    res.json({
      success: true,
      message: "Payment status updated successfully",
      data: order
    });
  } catch (error) {
    console.error("❌ Error updating payment:", error);
    res.status(500).json({
      success: false,
      message: "Error updating payment",
      error: error.message
    });
  }
});

// Add this after your existing routes, or enhance the existing payment endpoint
// Enhanced UPDATE ORDER PAYMENT STATUS endpoint (already exists in your code, just make sure it's updated)

// =====================================
// UPDATE ORDER PAYMENT STATUS (Enhanced for COD)
// =====================================
router.put("/:orderId/payment", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      paymentStatus, 
      paymentMethod,
      walletTransactionId,
      transportCharge,
      grandTotal,
      distance,
      manualUpdate // Flag to indicate if this is a manual admin update
    } = req.body;

    console.log(`💰 Updating payment for order: ${orderId}`);
    console.log("Payment data:", req.body);

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if payment is already paid
    if (order.paymentStatus === "Paid" && paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already marked as paid"
      });
    }

    // Store previous payment status for logging
    const previousPaymentStatus = order.paymentStatus;

    // Update payment fields
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (walletTransactionId) order.walletTransactionId = walletTransactionId;
    if (transportCharge) order.transportCharge = transportCharge;
    if (grandTotal) order.grandTotal = grandTotal;
    if (distance) order.distance = distance;

    // Add metadata for manual updates
    if (manualUpdate && paymentStatus === "Paid") {
      order.adminMarkedPaid = true;
      order.adminMarkedPaidAt = new Date();
      order.adminMarkedPaidBy = req.user?.id || "Admin"; // If you have user context
    }

    await order.save();

    console.log(`✅ Payment updated for order ${orderId} from ${previousPaymentStatus} to ${paymentStatus}`);

    // ========== CREDIT SELLER WALLET WHEN PAYMENT IS UPDATED TO PAID ==========
    if (paymentStatus === 'Paid' && previousPaymentStatus !== 'Paid') {
      console.log("\n💰 Processing seller wallet credit from payment update...");
      
      const amountToCredit = order.sellerAmount || Math.round(order.totalAmount * 0.92);
      
      const creditResult = await creditSellerWallet(
        order.sellerId,
        amountToCredit,
        `Earnings from sale of ${order.quantity}kg ${order.fishType} (${manualUpdate ? 'Admin marked as paid' : 'Payment updated'})`,
        order._id,
        order.fishType
      );
      
      if (creditResult.success) {
        console.log(`✅ Seller credited: ₹${amountToCredit}`);
      } else {
        console.error("❌ Failed to credit seller:", creditResult.error);
      }
    }

    res.json({
      success: true,
      message: `Payment ${paymentStatus === "Paid" ? "marked as paid" : "updated"} successfully`,
      data: order
    });
  } catch (error) {
    console.error("❌ Error updating payment:", error);
    res.status(500).json({
      success: false,
      message: "Error updating payment",
      error: error.message
    });
  }
});

// =====================================
// DEDICATED ENDPOINT TO CREDIT SELLER WALLET
// =====================================
router.post("/credit-seller", async (req, res) => {
  try {
    const { userId, amount, description, orderId, fishType } = req.body;

    console.log(`💰 Dedicated seller credit request:`, { userId, amount, description, orderId });

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, amount"
      });
    }

    const result = await creditSellerWallet(
      userId,
      amount,
      description || `Earnings from sale`,
      orderId,
      fishType
    );

    if (result.success) {
      res.json({
        success: true,
        message: "Seller wallet credited successfully",
        data: {
          newBalance: result.newBalance,
          transaction: result.transaction
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || "Failed to credit seller wallet"
      });
    }

  } catch (error) {
    console.error("❌ Error in credit-seller endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

module.exports = router;