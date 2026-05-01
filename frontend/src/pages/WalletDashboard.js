// pages/WalletDashboard.js
import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../utils/stripeConfig';
import StripeWalletPayment from '../components/StripeWalletPayment';
import './WalletDashboard.css';

const WalletDashboard = () => {
  const { 
    walletBalance, 
    transactions, 
    loading, 
    currentUser,
    refreshWalletData 
  } = useWallet();
  
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [filter, setFilter] = useState('all');
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [stats, setStats] = useState({
    totalCredits: 0,
    totalDebits: 0,
    transactionCount: 0
  });

  // Quick amount options
  const quickAmounts = [100, 500, 1000, 2000, 5000];

  // Calculate stats whenever transactions change
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // Remove duplicates based on transaction ID
      const uniqueTransactions = transactions.filter((t, index, self) => 
        index === self.findIndex(t2 => t2._id === t._id)
      );
      
      const credits = uniqueTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const debits = uniqueTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      setStats({
        totalCredits: credits,
        totalDebits: debits,
        transactionCount: uniqueTransactions.length
      });
    } else {
      setStats({
        totalCredits: 0,
        totalDebits: 0,
        transactionCount: 0
      });
    }
  }, [transactions]);

  const handleAddMoneyClick = () => {
    setAddAmount('');
    setShowAddMoney(true);
  };

  const handlePaymentSuccess = async (data) => {
    setPaymentSuccess({
      message: `₹${data.amount.toLocaleString()} added successfully!`,
      amount: data.amount
    });
    setShowAddMoney(false);
    
    // Refresh wallet data to get updated balance and transactions
    await refreshWalletData();
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setPaymentSuccess(null);
    }, 3000);
  };

  const handlePaymentError = (error) => {
    alert(`Payment failed: ${error}`);
  };

  // Filter transactions and remove duplicates
  const filteredTransactions = () => {
    if (!transactions || transactions.length === 0) return [];
    
    // Remove duplicates based on _id
    const uniqueTransactions = transactions.filter((t, index, self) => 
      index === self.findIndex(t2 => t2._id === t._id)
    );
    
    if (filter === 'all') return uniqueTransactions;
    if (filter === 'credit') return uniqueTransactions.filter(t => t.type === 'credit');
    if (filter === 'debit') return uniqueTransactions.filter(t => t.type === 'debit');
    return uniqueTransactions;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getPaymentMethodIcon = (transaction) => {
    if (transaction.paymentMethod === 'stripe_card' || transaction.paymentMethod === 'online') {
      return <span className="payment-badge" title="Paid via Card">💳</span>;
    }
    if (transaction.paymentMethod === 'cash') {
      return <span className="payment-badge" title="Cash">💵</span>;
    }
    if (transaction.paymentMethod === 'wallet') {
      return <span className="payment-badge" title="Wallet Transfer">💰</span>;
    }
    return null;
  };

  const getTransactionDescription = (transaction) => {
    if (transaction.description) return transaction.description;
    
    if (transaction.type === 'credit') {
      if (transaction.paymentMethod === 'stripe_card') return 'Money Added via Card';
      if (transaction.paymentMethod === 'online') return 'Online Payment Added';
      return 'Money Added to Wallet';
    } else {
      if (transaction.auctionId) return `Payment for Auction - ${transaction.fishType || 'Fish'}`;
      if (transaction.orderId) return `Payment for Order - ${transaction.fishType || 'Fish'}`;
      return 'Payment Made';
    }
  };

  if (loading) {
    return (
      <div className="wallet-dashboard loading-state">
        <div className="loading-spinner">Loading wallet...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="wallet-dashboard">
        <div className="wallet-header">
          <h1>💰 My Wallet</h1>
        </div>
        <div className="login-message">
          <p>Please login to view your wallet</p>
        </div>
      </div>
    );
  }

  const displayTransactions = filteredTransactions();

  return (
    <div className="wallet-dashboard">
      <div className="wallet-header">
        <h1>💰 My Wallet</h1>
        <p className="wallet-subtitle">Manage your funds and view transaction history</p>
      </div>

      {/* Success Message */}
      {paymentSuccess && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {paymentSuccess.message}
        </div>
      )}

      {/* Balance Card */}
      <div className="balance-card">
        <div className="balance-main">
          <span className="balance-label">Available Balance</span>
          <span className="balance-amount">₹{walletBalance?.toLocaleString() || '0'}</span>
        </div>
        <button 
          className="add-money-btn"
          onClick={handleAddMoneyClick}
        >
          + Add Money
        </button>
      </div>

      {/* Stats Cards */}
      <div className="wallet-stats">
        <div className="stat-card">
          <span className="stat-label">Total Added</span>
          <span className="stat-value credit">+₹{stats.totalCredits.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Spent</span>
          <span className="stat-value debit">-₹{stats.totalDebits.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Transactions</span>
          <span className="stat-value">{stats.transactionCount}</span>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="modal-overlay" onClick={() => setShowAddMoney(false)}>
          <div className="modal-content add-money-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddMoney(false)}>×</button>
            
            <h2>Add Money to Wallet</h2>
            <p className="modal-subtitle">Secure payment via Stripe</p>

            <div className="quick-amounts">
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  className={`quick-amount ${addAmount == amount ? 'selected' : ''}`}
                  onClick={() => setAddAmount(amount)}
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
                placeholder="Enter custom amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                min="10"
                step="1"
              />
            </div>

            {addAmount && parseFloat(addAmount) >= 10 ? (
              <Elements stripe={stripePromise}>
                <StripeWalletPayment
                  amount={parseFloat(addAmount)}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={() => setShowAddMoney(false)}
                />
              </Elements>
            ) : (
              <div className="amount-hint">
                {!addAmount ? 'Enter amount to proceed' : 'Minimum amount is ₹10'}
              </div>
            )}

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowAddMoney(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="transactions-section">
        <div className="transactions-header">
          <h3>Transaction History</h3>
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({displayTransactions.length})
            </button>
            <button 
              className={`filter-tab ${filter === 'credit' ? 'active' : ''}`}
              onClick={() => setFilter('credit')}
            >
              Credits ({displayTransactions.filter(t => t.type === 'credit').length})
            </button>
            <button 
              className={`filter-tab ${filter === 'debit' ? 'active' : ''}`}
              onClick={() => setFilter('debit')}
            >
              Debits ({displayTransactions.filter(t => t.type === 'debit').length})
            </button>
          </div>
        </div>

        <div className="transactions-list">
          {!displayTransactions || displayTransactions.length === 0 ? (
            <div className="no-transactions">
              <span className="no-transactions-icon">📭</span>
              <p>No transactions found</p>
              <button className="add-first-money-btn" onClick={handleAddMoneyClick}>
                Add Money to Get Started
              </button>
            </div>
          ) : (
            displayTransactions.map((transaction) => (
              <div key={transaction._id} className="transaction-row">
                <div className="transaction-left">
                  <div className={`transaction-icon ${transaction.type}`}>
                    {transaction.type === 'credit' ? '➕' : '➖'}
                  </div>
                  <div className="transaction-details">
                    <span className="transaction-desc">
                      {getTransactionDescription(transaction)}
                    </span>
                    <span className="transaction-date">
                      {formatDate(transaction.date || transaction.createdAt || transaction.timestamp)}
                    </span>
                    {transaction.balance && (
                      <span className="transaction-balance">
                        Balance: ₹{transaction.balance.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="transaction-right">
                  <span className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'credit' ? '+' : '-'} ₹{(transaction.amount || 0).toLocaleString()}
                  </span>
                  {getPaymentMethodIcon(transaction)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;