// context/WalletContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = "http://localhost:5000/api";
const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Fetch wallet data when user changes
  useEffect(() => {
    if (currentUser?._id || currentUser?.id) {
      refreshWalletData();
    }
  }, [currentUser]);

  const fetchWalletBalance = useCallback(async () => {
    const userId = currentUser?._id || currentUser?.id;
    if (!userId) return;
    
    try {
      const response = await axios.get(`${API}/wallet/balance/${userId}`);
      if (response.data.success) {
        setWalletBalance(response.data.balance || 0);
        localStorage.setItem('walletBalance', response.data.balance || 0);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      setWalletBalance(0);
    }
  }, [currentUser]);

  const fetchTransactions = useCallback(async () => {
    const userId = currentUser?._id || currentUser?.id;
    if (!userId) return;
    
    try {
      const response = await axios.get(`${API}/wallet/transactions/${userId}`);
      if (response.data.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    }
  }, [currentUser]);

  const refreshWalletData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchWalletBalance(),
      fetchTransactions()
    ]);
    setLoading(false);
  }, [fetchWalletBalance, fetchTransactions]);

  const addMoney = async (userId, amount, paymentMethod, paymentIntentId) => {
    try {
      const response = await axios.post(`${API}/wallet/add-money`, {
        userId,
        amount: Number(amount),
        paymentMethod,
        paymentIntentId,
        description: `Added ₹${amount} to wallet`
      });

      if (response.data.success) {
        setWalletBalance(response.data.newBalance);
        localStorage.setItem('walletBalance', response.data.newBalance);
        
        // Add new transaction to list
        if (response.data.transaction) {
          setTransactions(prev => [response.data.transaction, ...prev]);
        }
        
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error("Error adding money:", error);
      return { 
        success: false, 
        error: error.response?.data?.message || "Failed to add money" 
      };
    }
  };

  const deductMoney = async (userId, amount, orderDetails = {}) => {
    try {
      const response = await axios.post(`${API}/wallet/deduct-money`, {
        userId,
        amount: Number(amount),
        orderDetails,
        description: `Payment of ₹${amount}`
      });

      if (response.data.success) {
        setWalletBalance(response.data.newBalance);
        localStorage.setItem('walletBalance', response.data.newBalance);
        
        // Add new transaction to list
        if (response.data.transaction) {
          setTransactions(prev => [response.data.transaction, ...prev]);
        }
        
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error("Error deducting money:", error);
      return { 
        success: false, 
        error: error.response?.data?.message || "Failed to deduct money" 
      };
    }
  };

  const value = {
    walletBalance,
    transactions,
    loading,
    currentUser,
    addMoney,
    deductMoney,
    refreshWalletData,
    fetchWalletBalance,
    fetchTransactions
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};