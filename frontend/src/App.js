import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SellFish from "./pages/SellFish";
import BrowseFish from "./pages/BrowseFish";
import CreateAuction from "./pages/CreateAuction";
import LiveAuctions from "./pages/LiveAuctions";
import MyActivity from "./pages/MyActivity";
import Navbar from "./components/Navbar";
import AdminPanel from "./pages/AdminPanel";
import WalletDashboard from "./pages/WalletDashboard";
// In your App.js or routing file, add:
import Notifications from "./pages/Notifications";



// Import Wallet Provider
import { WalletProvider } from "./context/WalletContext";

import { SocketProvider } from './context/SocketContext';

function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsLoggedIn(true);
      }
    } catch (error) {
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.clear();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <WalletProvider>
      <SocketProvider>
      <Router>
        
        {/* Show Navbar only for non-admin */}
        {user?.role !== "admin" && (
          <Navbar isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />
        )}

        <Routes>

          {/* Admin Routes */}
          {user?.role === "admin" && (
            <>
              <Route path="/" element={<AdminPanel />} />
              <Route path="/admin/add-fish" element={<SellFish />} />
              <Route path="/admin/add-auction" element={<CreateAuction />} />
            </>
          )}

          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLoginSuccess={handleLogin} />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
          <Route path="/browse" element={isLoggedIn ? <BrowseFish /> : <Navigate to="/" />} />
          <Route path="/auction" element={isLoggedIn ? <LiveAuctions /> : <Navigate to="/" />} />
          <Route path="/my-activity" element={isLoggedIn ? <MyActivity /> : <Navigate to="/" />} />
          <Route path="/wallet" element={isLoggedIn ? <WalletDashboard /> : <Navigate to="/" />} />
          <Route path="/sellfish" element={isLoggedIn ? <SellFish /> : <Navigate to="/" />} />
          <Route path="/create-auction" element={isLoggedIn ? <CreateAuction /> : <Navigate to="/" />} />
          // Add to your routes:
          <Route path="/notifications" element={isLoggedIn ? <Notifications /> : <Navigate to="/" />} />

          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </Router>
      </SocketProvider>
    </WalletProvider>
  );
}

export default App;