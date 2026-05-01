// components/WalletPayment.js
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import './WalletPayment.css';

const API = "http://localhost:5000/api";

const WalletPayment = ({ orderData, onSuccess, onError, onCancel, totalAmount }) => {
  const { walletBalance, deductMoney, refreshWalletData, currentUser } = useWallet();
  const [processing, setProcessing] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  const [isPaid, setIsPaid] = useState(false);
  
  // Use refs to prevent double execution
  const isProcessing = useRef(false);
  const paymentExecuted = useRef(false);
  const addMoneyExecuted = useRef(false);
  const requestId = useRef(Date.now());

  // Quick amount options
  const quickAmounts = [100, 500, 1000, 2000, 5000];

  // components/WalletPayment.js - Update handleWalletPayment function

const handleWalletPayment = async () => {
  // ✅ HARD STOP: already paid
  if (isPaid || orderData?.paymentStatus === "Paid") {
    console.log("🚫 Already paid - blocking payment");
    alert("This order is already paid!");
    return;
  }

  // ✅ Prevent double click
  if (isProcessing.current || paymentExecuted.current) {
    console.log("⚠️ Payment already in progress");
    return;
  }

  isProcessing.current = true;
  setProcessing(true);

  try {
    // ✅ Generate unique order ID
    const uniqueOrderId = `ORD_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // ✅ Prepare order details
    const orderDetails = {
      orderId: uniqueOrderId,
      auctionId: orderData.auctionId,
      fishType: orderData.fishType,
      quantity: orderData.quantity,
      sellerId: orderData.sellerId
    };

    console.log("💰 Deduct request:", {
      userId: currentUser._id || currentUser.id,
      amount: totalAmount,
      orderDetails
    });

    // ✅ Deduct money
    const deductResult = await deductMoney(
      currentUser._id || currentUser.id,
      totalAmount,
      orderDetails
    );

    console.log("💰 Deduct result:", deductResult);

    if (deductResult.success) {
      // ✅ LOCK PAYMENT
      paymentExecuted.current = true;

      // ✅ INSTANT UI UPDATE (IMPORTANT)
      setIsPaid(true);
      orderData.paymentStatus = "Paid";

      // ✅ CLOSE MODAL IMMEDIATELY (FIXES YOUR ISSUE)
      onCancel();

      // ✅ Prepare final order
      const finalOrderData = {
        ...orderData,
        paymentStatus: "Paid",
        paymentMethod: "wallet",
        walletTransactionId: deductResult.data.transactionId,
        grandTotal: totalAmount,
        orderId: uniqueOrderId,
        alreadyProcessed: true
      };

      console.log("📦 FINAL ORDER DATA:", finalOrderData);

      // ✅ Create order in background
      await onSuccess(finalOrderData);

    } else {
      console.error("❌ Deduction failed:", deductResult.error);
      onError(deductResult.error || "Payment failed");
      paymentExecuted.current = false;
    }

  } catch (error) {
    console.error("❌ Wallet payment error:", error);
    onError("Payment failed. Please try again.");
    paymentExecuted.current = false;

  } finally {
    setProcessing(false);
    isProcessing.current = false;
  }
};

  const handleAddMoney = async () => {
    // Prevent double execution
    if (isProcessing.current || addMoneyExecuted.current) return;

    if (!addAmount || addAmount < 10) {
      alert("Please enter amount minimum ₹10");
      return;
    }

    addMoneyExecuted.current = true;
    isProcessing.current = true;
    setProcessing(true);

    try {
      // Create payment intent
      const { data: paymentIntentData } = await axios.post(`${API}/payment/create-payment-intent`, {
        amount: parseFloat(addAmount),
        currency: 'inr',
        metadata: {
          type: 'wallet_topup',
          userId: currentUser._id || currentUser.id,
          requestId: requestId.current
        }
      });

      // Add money to wallet via API
      const result = await axios.post(`${API}/wallet/add-money`, {
        userId: currentUser._id || currentUser.id,
        amount: parseFloat(addAmount),
        paymentMethod: 'stripe_card',
        paymentIntentId: paymentIntentData.paymentIntentId,
        description: `Added ₹${addAmount} to wallet`,
        requestId: requestId.current
      });

      if (result.data.success) {
        await refreshWalletData();
        
        // Check if payment already executed
        if (!paymentExecuted.current) {
          setShowAddMoney(false);
          setAddAmount('');
          
          
        }
      } else {
        onError(result.data.message);
        addMoneyExecuted.current = false;
      }
    } catch (error) {
      console.error("Error adding money:", error);
      onError(error.response?.data?.message || "Failed to add money");
      addMoneyExecuted.current = false;
    } finally {
      setProcessing(false);
      isProcessing.current = false;
    }
  };

  // Check if user has sufficient balance
  const hasSufficientBalance = walletBalance >= totalAmount;

  return (
    <div className="wallet-payment-container">
      {/* Current Balance */}
      <div className="wallet-balance-card">
        <div className="balance-icon">💰</div>
        <div className="balance-info">
          <span className="balance-label">Your Wallet Balance</span>
          <span className="balance-amount">₹{walletBalance?.toLocaleString() || 0}</span>
        </div>
      </div>

      {/* Payment Amount */}
      <div className="payment-amount-card">
        <span className="amount-label">Amount to Pay:</span>
        <span className="amount-value">₹{totalAmount?.toLocaleString()}</span>
      </div>

      {/* Sufficient Balance - Direct Payment */}
      {hasSufficientBalance ? (
        <div className="direct-payment-section">
          <div className="payment-details">
            <div className="detail-row">
              <span>Wallet Balance:</span>
              <span className="sufficient">₹{walletBalance?.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span>Payment Amount:</span>
              <span>₹{totalAmount?.toLocaleString()}</span>
            </div>
            <div className="detail-row total-row">
              <span>Balance After Payment:</span>
              <span>₹{(walletBalance - totalAmount)?.toLocaleString()}</span>
            </div>
          </div>

          <button 
  className="pay-now-btn"
  onClick={handleWalletPayment}
  disabled={
    processing || 
    isProcessing.current || 
    paymentExecuted.current || 
    isPaid || 
    orderData?.paymentStatus === "Paid"
  }
>
  {isPaid || orderData?.paymentStatus === "Paid"
    ? "Already Paid ✅"
    : processing
      ? "Processing..."
      : `Pay ₹${totalAmount?.toLocaleString()} Now`
  }
</button>
        </div>
      ) : (
        /* Insufficient Balance - Show Add Money Option */
        <div className="insufficient-section">
          <div className="insufficient-warning">
            <span className="warning-icon">⚠️</span>
            <div className="warning-text">
              <p>Insufficient Balance!</p>
              <p className="small">Need ₹{(totalAmount - walletBalance).toLocaleString()} more</p>
            </div>
          </div>

          {!showAddMoney ? (
            <button 
              className="add-money-pay-btn"
              onClick={() => setShowAddMoney(true)}
              disabled={processing || isProcessing.current}
            >
              Add Money & Pay
            </button>
          ) : (
            <div className="add-money-section">
              <h4>Add Money to Wallet</h4>
              
              <div className="quick-amounts">
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    className={`quick-amount-btn ${parseFloat(addAmount) === amount ? 'selected' : ''}`}
                    onClick={() => setAddAmount(amount)}
                    disabled={processing || isProcessing.current}
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>

              <div className="amount-input-group">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  className="amount-input"
                  placeholder="Enter amount"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  min="10"
                  disabled={processing || isProcessing.current}
                />
              </div>

              <div className="add-money-actions">
                <button 
                  className="add-money-btn"
                  onClick={handleAddMoney}
                  disabled={processing || isProcessing.current || !addAmount || parseFloat(addAmount) < 10 || addMoneyExecuted.current}
                >
                  {processing ? "Processing..." : `Add ₹${addAmount} & Pay`}
                </button>
                <button 
                  className="cancel-add-btn"
                  onClick={() => {
                    setShowAddMoney(false);
                    setAddAmount('');
                    addMoneyExecuted.current = false;
                  }}
                  disabled={processing || isProcessing.current}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel Button */}
      <button 
        className="cancel-payment-btn"
        onClick={() => {
          addMoneyExecuted.current = false;
          paymentExecuted.current = false;
          isProcessing.current = false;
          onCancel();
        }}
        disabled={processing}
      >
        Cancel Payment
      </button>

      {/* Payment Info */}
      <div className="wallet-info-note">
        <p>🔒 Secure wallet payments</p>
        <p>✓ Instant payment ✓ No transaction fees</p>
      </div>
    </div>
  );
};

export default WalletPayment;