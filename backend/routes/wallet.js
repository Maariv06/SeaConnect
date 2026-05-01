// server/routes/wallet.js (backend)
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Add money to wallet
router.post('/add-money', async (req, res) => {
  try {
    const { userId, amount, paymentMethod, paymentIntentId, description } = req.body;
    
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update user's wallet balance in database
      const user = await User.findById(userId);
      user.walletBalance += amount;
      
      // Create transaction record
      const transaction = {
        userId,
        amount,
        type: 'credit',
        paymentMethod: 'stripe_card',
        description,
        stripePaymentIntentId: paymentIntentId,
        date: new Date()
      };
      
      await Transaction.create(transaction);
      await user.save();
      
      res.json({
        success: true,
        newBalance: user.walletBalance,
        transaction
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }
  } catch (error) {
    console.error('Error adding money:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get wallet balance
router.get('/balance/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    res.json({
      success: true,
      balance: user.walletBalance || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get transaction history
router.get('/transactions/:userId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId })
      .sort({ date: -1 });
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Deduct money from wallet
router.post('/deduct-money', async (req, res) => {
  try {
    const { userId, amount, orderDetails, description } = req.body;
    
    const user = await User.findById(userId);
    
    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }
    
    user.walletBalance -= amount;
    
    const transaction = {
      userId,
      amount,
      type: 'debit',
      description,
      orderDetails,
      date: new Date()
    };
    
    await Transaction.create(transaction);
    await user.save();
    
    res.json({
      success: true,
      newBalance: user.walletBalance,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;