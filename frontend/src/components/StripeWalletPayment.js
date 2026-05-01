// components/StripeWalletPayment.js
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import './StripeWalletPayment.css';

const API = "http://localhost:5000/api";

const StripeWalletPayment = ({ amount, onSuccess, onError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { addMoney, refreshWalletData, currentUser } = useWallet();
  
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        },
        iconColor: '#1e40af'
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    },
    hidePostalCode: true
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setCardError("Stripe hasn't loaded yet. Please try again.");
      return;
    }

    if (!cardComplete) {
      setCardError("Please enter complete card details");
      return;
    }

    setProcessing(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      // 1. Create payment intent on backend
      const { data: paymentIntentData } = await axios.post(`${API}/payment/create-payment-intent`, {
        amount: amount,
        currency: 'inr',
        metadata: {
          type: 'wallet_topup',
          userId: currentUser._id || currentUser.id
        }
      });

      // 2. Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: currentUser?.fullName || currentUser?.name || 'Customer',
              email: currentUser?.email || '',
            },
          },
        }
      );

      if (error) {
        setCardError(error.message);
        onError?.(error.message);
      } else {
        if (paymentIntent.status === 'succeeded') {
          // 3. Add money to wallet
          const result = await addMoney(
            currentUser._id || currentUser.id,
            amount,
            'stripe_card',
            paymentIntent.id
          );

          if (result.success) {
            await refreshWalletData();
            onSuccess?.({
              amount,
              paymentIntentId: paymentIntent.id,
              newBalance: result.data.newBalance,
              transaction: result.data.transaction
            });
          } else {
            setCardError(result.error);
            onError?.(result.error);
          }
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      setCardError(error.response?.data?.message || "Payment failed. Please try again.");
      onError?.(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-wallet-form">
      <div className="amount-display">
        <span className="amount-label">Amount to Add:</span>
        <span className="amount-value">₹{amount.toLocaleString()}</span>
      </div>

      <div className="card-element-wrapper">
        <label className="card-label">
          <span className="label-icon">💳</span>
          Card Details
        </label>
        <div className="card-element-container">
          <CardElement 
            options={CARD_ELEMENT_OPTIONS} 
            onChange={(e) => {
              setCardComplete(e.complete);
              setCardError(e.error ? e.error.message : null);
            }}
          />
        </div>
      </div>

      {cardError && (
        <div className="stripe-error">
          <span className="error-icon">⚠️</span>
          {cardError}
        </div>
      )}

      <div className="card-info-note">
        <p>🔒 Your card information is encrypted and secure</p>
        <p>We accept: Visa, Mastercard, American Express, RuPay</p>
      </div>

      <div className="stripe-actions">
        <button 
          type="submit" 
          className="stripe-pay-btn"
          disabled={!stripe || processing || !cardComplete}
        >
          {processing ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            `Pay ₹${amount.toLocaleString()}`
          )}
        </button>
        
        <button 
          type="button" 
          className="stripe-cancel-btn"
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default StripeWalletPayment;