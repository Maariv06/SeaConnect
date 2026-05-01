// backend/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const Stripe = require('stripe');
require('dotenv').config();

// Initialize Stripe with your secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY );

// =====================================
// CREATE PAYMENT INTENT
// =====================================
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = 'inr', orderData, paymentType = 'order' } = req.body;

    console.log("💰 Creating payment intent:", {
      amount,
      currency,
      paymentType,
      timestamp: new Date().toISOString()
    });

    // Validate amount
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Minimum amount is ₹1"
      });
    }

    // Prepare metadata based on payment type
    let metadata = {};
    
    if (paymentType === 'wallet_topup') {
      metadata = {
        paymentType: 'wallet_topup',
        userId: orderData?.userId || req.body.userId,
        userEmail: orderData?.userEmail || req.body.userEmail,
        purpose: 'Wallet Top Up'
      };
    } else {
      // Regular order payment
      metadata = {
        paymentType: 'order',
        fishType: orderData?.fishType || 'N/A',
        customerName: orderData?.customerName || 'N/A',
        customerPhone: orderData?.customerPhone || 'N/A',
        quantity: orderData?.quantity?.toString() || '0',
        sellerId: orderData?.sellerId || 'N/A',
        fishId: orderData?.fishId || 'N/A'
      };
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit (paise)
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: metadata,
      description: paymentType === 'wallet_topup' 
        ? `Wallet Top Up - ₹${amount}`
        : `Fish Order - ${orderData?.fishType || 'Fish'} - ₹${amount}`,
    });

    console.log("✅ Payment intent created:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: paymentIntent.status,
      paymentType
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    });

  } catch (error) {
    console.error("❌ Error creating payment intent:", {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        message: "Your card was declined. Please try another card.",
        error: error.message
      });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        message: "Invalid payment request. Please check your details.",
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
      error: error.message,
    });
  }
});

// =====================================
// CONFIRM PAYMENT (Optional - for additional verification)
// =====================================
router.post("/confirm-payment", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID is required"
      });
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log("💰 Payment intent retrieved:", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100
    });

    res.json({
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      paymentMethod: paymentIntent.payment_method_types[0],
      metadata: paymentIntent.metadata
    });

  } catch (error) {
    console.error("❌ Error confirming payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message
    });
  }
});

// =====================================
// WEBHOOK - Handle Stripe events
// =====================================
router.post("/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature (add your webhook secret in .env)
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // For testing without webhook secret
      event = JSON.parse(req.body);
      console.log("⚠️  Webhook signature verification skipped (no webhook secret)");
    }
  } catch (err) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Webhook received: ${event.type}`);

  // Handle different event types
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`✅ PaymentIntent ${paymentIntent.id} succeeded`);
        
        // Check if it's a wallet topup or order payment
        if (paymentIntent.metadata.paymentType === 'wallet_topup') {
          console.log(`💰 Wallet topup successful for user: ${paymentIntent.metadata.userId}`);
          // You can update wallet balance here or handle in a separate service
        } else {
          console.log(`📦 Order payment successful for: ${paymentIntent.metadata.customerName}`);
          // You can update order status here
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`❌ Payment failed:`, {
          id: failedPayment.id,
          last_payment_error: failedPayment.last_payment_error
        });
        break;

      case 'payment_intent.processing':
        console.log(`⏳ Payment is processing:`, event.data.object.id);
        break;

      case 'payment_intent.canceled':
        console.log(`🚫 Payment canceled:`, event.data.object.id);
        break;

      case 'charge.succeeded':
        const charge = event.data.object;
        console.log(`✅ Charge succeeded:`, charge.id);
        break;

      case 'charge.failed':
        const failedCharge = event.data.object;
        console.log(`❌ Charge failed:`, failedCharge.id);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
    
  } catch (error) {
    console.error(`❌ Error processing webhook:`, error);
    res.status(500).json({ 
      received: false, 
      error: error.message 
    });
  }
});

// =====================================
// GET PAYMENT METHODS (Optional)
// =====================================
router.get("/payment-methods", async (req, res) => {
  try {
    // Return supported payment methods
    res.json({
      success: true,
      methods: [
        { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
        { id: 'upi', name: 'UPI', icon: '📱' },
        { id: 'netbanking', name: 'Net Banking', icon: '🏦' }
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment methods",
      error: error.message
    });
  }
});

// =====================================
// REFUND PAYMENT (For admin use)
// =====================================
router.post("/refund", async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID is required"
      });
    }

    // Create a refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
      reason: reason || 'requested_by_customer',
      metadata: {
        refundedBy: req.body.adminId || 'system',
        reason: reason || 'customer_request'
      }
    });

    console.log(`✅ Refund created:`, refund.id);

    res.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    });

  } catch (error) {
    console.error("❌ Error creating refund:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process refund",
      error: error.message
    });
  }
});

module.exports = router;