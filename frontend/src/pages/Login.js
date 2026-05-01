// pages/Login.js
import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login({ close, openRegister, onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate form
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: formData.email.trim(),
          password: formData.password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Save user in localStorage
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("userRole", response.data.user.role);
        
        // If token is returned, save it
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
      }

      // Call onLoginSuccess callback
      if (onLoginSuccess) {
        onLoginSuccess(response.data.user);
      }

      close();
      alert(`Welcome back, ${response.data.user?.fullName || response.data.user?.name || 'User'}!`);

      // Handle admin redirect
      if (response.data.user?.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.reload();
      }

    } catch (error) {
      // Handle different error scenarios
      if (error.code === 'ERR_NETWORK') {
        setError("Cannot connect to server. Please check if backend is running.");
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || "Invalid email or password");
      } else if (error.response?.status === 401) {
        setError("Unauthorized. Please check your credentials.");
      } else if (error.response?.status === 404) {
        setError("Login service not found. Please check the API endpoint.");
      } else {
        setError(error.response?.data?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        
        <button className="login-close-btn" onClick={close}>✕</button>

        <h2>Login to SeaConnect</h2>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Don't have an account?{" "}
            <span 
              className="switch-link"
              onClick={() => {
                close();
                openRegister();
              }}
            >
              Register Now
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;