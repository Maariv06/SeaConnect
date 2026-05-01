import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useState, useEffect } from "react";
import logo from "../assets/logo.jpeg";
import Login from "../pages/Login";
import Register from "../pages/Register";
import axios from "axios";

const API = "http://localhost:5000/api";

function Navbar({ isLoggedIn, user, onLogout }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [showSellDropdown, setShowSellDropdown] = useState(false);

  // Fetch unread notifications count
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchUnreadCount();
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, user]);

  const fetchUnreadCount = async () => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;
      
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/notifications/unread-count/${userId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      
      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
      // Fallback to localStorage
      const savedNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
      const unread = savedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    }
  };

  const handleProtectedNavigation = (path) => {
    if (!isLoggedIn) {
      setShowLoginMessage(true);
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <>
      <nav className="navbar">
        {/* LOGO */}
        <div className="logo-container">
          <Link to="/">
            <img src={logo} alt="SeaConnect Logo" className="logo-img" />
          </Link>
        </div>

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>

          {/* SELL FISH DROPDOWN */}
          <li className="dropdown">
            <span
              className="dropdown-title"
              onClick={() => {
                if (!isLoggedIn) {
                  setShowLoginMessage(true);
                } else {
                  setShowSellDropdown(!showSellDropdown);
                }
              }}
            >
              Sell Fish ▾
            </span>

            {isLoggedIn && showSellDropdown && (
              <ul className="dropdown-menu-click">
                <div className="dropdown-header">
                  <span>Sell Options</span>
                  <span
                    className="close-dropdown"
                    onClick={() => setShowSellDropdown(false)}
                  >
                    ✖
                  </span>
                </div>

                <li
                  onClick={() => {
                    setShowSellDropdown(false);
                    navigate("/sellfish");
                  }}
                >
                  Create Fish Listing
                </li>

                <li
                  onClick={() => {
                    setShowSellDropdown(false);
                    navigate("/create-auction");
                  }}
                >
                  Create Auction
                </li>
              </ul>
            )}
          </li>

          <li onClick={() => handleProtectedNavigation("/browse")}>
            <span className="nav-link-custom">Browse Fish</span>
          </li>

          <li onClick={() => handleProtectedNavigation("/auction")}>
            <span className="nav-link-custom">Auction</span>
          </li>

          {/* WALLET LINK */}
          {isLoggedIn && (
            <li onClick={() => navigate("/wallet")}>
              <span className="nav-link-custom wallet-link">
                <span className="wallet-icon">💰</span> Wallet
              </span>
            </li>
          )}

          {isLoggedIn ? (
            <>
              <li onClick={() => navigate("/my-activity")}>
                <span className="nav-link-custom">My Activity</span>
              </li>

              {/* NOTIFICATION ICON - Placed after My Activity */}
              <li className="notification-icon-container">
                <span 
                  className="notification-icon" 
                  onClick={() => navigate("/notifications")}
                  title="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </span>
              </li>

              <li>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <span
                  className="nav-btn"
                  onClick={() => {
                    setShowRegister(false);
                    setShowLogin(true);
                  }}
                >
                  Login
                </span>
              </li>

              <li>
                <span
                  className="nav-btn register-btn"
                  onClick={() => {
                    setShowLogin(false);
                    setShowRegister(true);
                  }}
                >
                  Register
                </span>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Login Required Popup */}
      {showLoginMessage && (
        <div className="login-required-overlay">
          <div className="login-required-box">
            <h3>Please Login First</h3>
            <p>You must login to access this feature.</p>

            <button
              className="login-now-btn"
              onClick={() => {
                setShowLoginMessage(false);
                setShowLogin(true);
              }}
            >
              Login Now
            </button>

            <button
              className="cancel-btn"
              onClick={() => setShowLoginMessage(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLogin && (
        <Login
          close={() => setShowLogin(false)}
          openRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
          onLoginSuccess={(userData) => {
            setShowLogin(false);
          }}
        />
      )}

      {/* REGISTER MODAL */}
      {showRegister && (
        <Register
          close={() => setShowRegister(false)}
          openLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </>
  );
}

export default Navbar;