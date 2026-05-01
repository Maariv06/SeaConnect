// backend/routes/walletRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// =====================================
// GET WALLET BALANCE
// =====================================
router.get("/balance/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      balance: user.walletBalance || 0
    });

  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wallet balance",
      error: error.message
    });
  }
});

// =====================================
// ADD MONEY TO WALLET
// =====================================
router.post("/add-money", async (req, res) => {
  try {
    const { userId, amount, paymentMethod, paymentIntentId, description } = req.body;

    console.log("Add money request:", { userId, amount, paymentMethod, paymentIntentId });

    if (!userId || !amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. Minimum amount is ₹10"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update wallet balance
    const oldBalance = user.walletBalance || 0;
    const newBalance = oldBalance + Number(amount);
    user.walletBalance = newBalance;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId,
      amount: Number(amount),
      type: 'credit',
      paymentMethod: paymentMethod || 'stripe_card',
      paymentIntentId,
      description: description || `Added ₹${amount} to wallet`,
      balance: newBalance,
      date: new Date()
    });
    
    await transaction.save();

    console.log(`💰 Added ₹${amount} to wallet for user ${userId}. New balance: ${newBalance}`);

    res.json({
      success: true,
      newBalance,
      transaction: {
        _id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        paymentMethod: transaction.paymentMethod,
        date: transaction.date,
        balance: transaction.balance
      }
    });

  } catch (error) {
    console.error("Error adding money to wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add money to wallet",
      error: error.message
    });
  }
});

// =====================================
// DEDUCT MONEY FROM WALLET
// =====================================
router.post("/deduct-money", async (req, res) => {
  try {
    const { userId, amount, orderDetails, description } = req.body;

    console.log("Deduct money request:", { userId, amount, orderDetails });

    if (!userId || !amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. Amount must be at least ₹1"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check sufficient balance
    const currentBalance = user.walletBalance || 0;
    if (currentBalance < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Current: ₹${currentBalance}, Required: ₹${amount}`
      });
    }

    // Deduct from wallet
    const oldBalance = currentBalance;
    const newBalance = oldBalance - Number(amount);
    user.walletBalance = newBalance;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId,
      amount: Number(amount),
      type: 'debit',
      paymentMethod: 'wallet',
      description: description || `Payment of ₹${amount}`,
      balance: newBalance,
      orderDetails: orderDetails || {},
      date: new Date()
    });
    
    await transaction.save();

    console.log(`💰 Deducted ₹${amount} from wallet for user ${userId}. New balance: ${newBalance}`);

    res.json({
      success: true,
      newBalance,
      transactionId: transaction._id,
      transaction: {
        _id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        date: transaction.date,
        balance: transaction.balance,
        orderDetails: transaction.orderDetails
      }
    });

  } catch (error) {
    console.error("Error deducting money from wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deduct money from wallet",
      error: error.message
    });
  }
});

// =====================================
// GET TRANSACTION HISTORY
// =====================================
router.get("/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      transactions: transactions.map(t => ({
        _id: t._id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        paymentMethod: t.paymentMethod,
        date: t.date,
        balance: t.balance,
        orderDetails: t.orderDetails
      }))
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message
    });
  }
});

module.exports = router;