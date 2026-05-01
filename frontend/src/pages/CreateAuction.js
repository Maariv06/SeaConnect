// pages/CreateAuction.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CreateAuction.css";
import oceanBg from "../assets/ocean.png";

// Import fish images directly
import seerFishImg from "../assets/fish/seer-fish.jpg";
import tunaImg from "../assets/fish/tuna.jpg";
import sardineImg from "../assets/fish/sardine.jpg";
import mackerelImg from "../assets/fish/mackerel.jpg";
import anchovyImg from "../assets/fish/anchovy.jpg";
import pomfretImg from "../assets/fish/pomfret.jpg";
import barracudaImg from "../assets/fish/barracuda.jpg";
import snapperImg from "../assets/fish/snapper.jpg";
import grouperImg from "../assets/fish/grouper.jpg";
import silverBellyImg from "../assets/fish/silver-belly.jpg";
import threadfinImg from "../assets/fish/threadfin.jpg";
import prawnsImg from "../assets/fish/prawns.jpg";
import tigerPrawnsImg from "../assets/fish/tiger-prawns.jpg";
import shrimpImg from "../assets/fish/shrimp.jpg";
import crabImg from "../assets/fish/crab.jpg";
import squidImg from "../assets/fish/squid.jpg";
import defaultFishImg from "../assets/fish/default-fish.jpg";

const API = "http://localhost:5000/api";

// Tamil Nadu cities for location dropdown
const TAMIL_NADU_CITIES = [
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
  "Tirunelveli", "Vellore", "Erode", "Thoothukudi", "Thanjavur",
  "Dindigul", "Kanyakumari", "Karur", "Cuddalore", "Kanchipuram",
  "Tiruppur", "Nagercoil", "Virudhunagar", "Sivakasi", "Hosur",
  "Ooty", "Kodaikanal", "Rameswaram", "Karaikudi", "Nagapattinam",
  "Ramanathapuram", "Theni", "Tenkasi", "Kovilpatti", "Tiruchendur"
].sort();

// Fish image mapping for preview (actual images)
const fishImages = {
  "Seer Fish": seerFishImg,
  "Tuna": tunaImg,
  "Sardine": sardineImg,
  "Mackerel": mackerelImg,
  "Anchovy": anchovyImg,
  "Pomfret": pomfretImg,
  "Barracuda": barracudaImg,
  "Snapper": snapperImg,
  "Grouper": grouperImg,
  "Silver Belly": silverBellyImg,
  "Threadfin": threadfinImg,
  "Prawns": prawnsImg,
  "Tiger Prawns": tigerPrawnsImg,
  "Shrimp": shrimpImg,
  "Crab": crabImg,
  "Squid": squidImg
};

// Fish image filenames for database storage
const fishImageFilenames = {
  "Seer Fish": "seer-fish.jpg",
  "Tuna": "tuna.jpg",
  "Sardine": "sardine.jpg",
  "Mackerel": "mackerel.jpg",
  "Anchovy": "anchovy.jpg",
  "Pomfret": "pomfret.jpg",
  "Barracuda": "barracuda.jpg",
  "Snapper": "snapper.jpg",
  "Grouper": "grouper.jpg",
  "Silver Belly": "silver-belly.jpg",
  "Threadfin": "threadfin.jpg",
  "Prawns": "prawns.jpg",
  "Tiger Prawns": "tiger-prawns.jpg",
  "Shrimp": "shrimp.jpg",
  "Crab": "crab.jpg",
  "Squid": "squid.jpg"
};

// Fish categories for better organization
const fishCategories = {
  "Premium Fish": ["Seer Fish", "Tuna", "Pomfret", "Snapper", "Grouper"],
  "Local Fish": ["Sardine", "Mackerel", "Anchovy", "Barracuda", "Silver Belly", "Threadfin"],
  "Shellfish": ["Prawns", "Tiger Prawns", "Shrimp", "Crab"],
  "Other": ["Squid"]
};

function CreateAuction({ setActiveTab }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [hover, setHover] = useState(false);

  const [formData, setFormData] = useState({
    fishType: "",
    customFishName: "",
    quantity: "",
    startingPrice: "",
    location: "",
    phone: "",
    description: ""
  });

  const [errors, setErrors] = useState({});

  // Load logged user
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Pre-fill phone from user data
      setFormData(prev => ({
        ...prev,
        phone: parsedUser.phone || ""
      }));
    } else {
      setMessage({
        type: "error",
        text: "Please login to create an auction"
      });
      setTimeout(() => navigate("/"), 2000);
    }
  }, [navigate]);

  // Update image preview when fish type changes
  useEffect(() => {
    if (formData.fishType && formData.fishType !== "Other") {
      const image = fishImages[formData.fishType];
      if (image) {
        setImagePreview(image);
      }
    } else {
      setImagePreview(null);
    }
  }, [formData.fishType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
    
    // Clear message when user types
    if (message.text) setMessage({ type: "", text: "" });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fishType) {
      newErrors.fishType = "Please select a fish type";
    }

    if (formData.fishType === "Other" && !formData.customFishName) {
      newErrors.customFishName = "Please enter the fish name";
    }

    if (!formData.quantity) {
      newErrors.quantity = "Quantity is required";
    } else if (formData.quantity < 0.5) {
      newErrors.quantity = "Minimum quantity is 0.5 kg";
    } else if (formData.quantity > 1000) {
      newErrors.quantity = "Maximum quantity is 1000 kg";
    }

    if (!formData.startingPrice) {
      newErrors.startingPrice = "Starting price is required";
    } else if (formData.startingPrice < 1) {
      newErrors.startingPrice = "Starting price must be at least ₹1";
    }

    if (!formData.location) {
      newErrors.location = "Please select a location";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage({ type: "error", text: "Please login first" });
      return;
    }

    // Validate form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setMessage({ type: "error", text: "Please fill all required fields correctly" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    // Get the image filename for the selected fish type
    let fishImageFilename = "default-fish.jpg";
    if (formData.fishType !== "Other" && fishImageFilenames[formData.fishType]) {
      fishImageFilename = fishImageFilenames[formData.fishType];
    }

    const finalFishType = formData.fishType === "Other" 
      ? formData.customFishName 
      : formData.fishType;

    const auctionData = {
      fishType: finalFishType,
      quantity: Number(formData.quantity),
      startingPrice: Number(formData.startingPrice),
      location: formData.location,
      phone: formData.phone,
      description: formData.description || "",
      fishImage: fishImageFilename,
      sellerId: user._id || user.id,
      sellerName: user.fullName || user.name || "Unknown"
    };

    try {
      const response = await axios.post(`${API}/auction/create`, auctionData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "✅ Auction created successfully! It will be reviewed by admin."
        });
        
        // Reset form
        setFormData({
          fishType: "",
          customFishName: "",
          quantity: "",
          startingPrice: "",
          location: "",
          phone: user?.phone || "",
          description: ""
        });
        setImagePreview(null);
        setErrors({});

        // Ask if user wants to view auctions
        setTimeout(() => {
          if (window.confirm("Auction created! Do you want to view live auctions?")) {
            navigate("/auction");
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating auction:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "❌ Failed to create auction"
      });
    } finally {
      setLoading(false);
    }
  };

  // Render fish options grouped by category
  const renderFishOptions = () => {
    return Object.entries(fishCategories).map(([category, fishes]) => (
      <optgroup key={category} label={category}>
        {fishes.map(fish => (
          <option key={fish} value={fish}>{fish}</option>
        ))}
      </optgroup>
    ));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the form?")) {
      setFormData({
        fishType: "",
        customFishName: "",
        quantity: "",
        startingPrice: "",
        location: "",
        phone: user?.phone || "",
        description: ""
      });
      setImagePreview(null);
      setErrors({});
      setMessage({ type: "", text: "" });
    }
  };

  return (
    <div
      className="sell-container"
      style={{
          background: `url(${oceanBg}) center/cover no-repeat`,
          minHeight: setActiveTab ? "calc(100vh - 60px)" : "100vh",
          margin: setActiveTab ? "-30px" : "0",   // 🔥 cancels AdminPanel padding
          width: setActiveTab ? "calc(100% + 60px)" : "100%"
        }}
    >
      <div className="overlay"></div>

      <div className="sell-card">

  {/* ✅ CLOSE BUTTON */}
  <button
  onClick={() => setActiveTab("auctions")}
  onMouseEnter={() => setHover(true)}
  onMouseLeave={() => setHover(false)}
  style={{
    position: "absolute",
    top: "15px",
    right: "15px",
    zIndex: 999,

    width: "35px",
    height: "35px",
    borderRadius: "50%",
    border: "none",

    background: hover ? "#ff4d4f" : "rgba(249, 247, 247, 0.94)",
    color: "#fff",

    cursor: "pointer",
    fontSize: "18px",

    transform: hover ? "scale(1.1)" : "scale(1)",
    transition: "all 0.2s ease"
  }}
>
  ❌
</button>

  <h2>🐟 Create Auction</h2>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Fish Image Preview */}
        {imagePreview && (
          <div className="fish-preview">
            <img src={imagePreview} alt={formData.fishType} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="sell-form">
          {/* Fish Type Selection */}
          <div className="form-field">
            <label>Fish Type *</label>
            <select
              name="fishType"
              value={formData.fishType}
              onChange={handleChange}
              required
              className={errors.fishType ? "error" : ""}
            >
              <option value="">Select Fish Type</option>
              {renderFishOptions()}
              <option value="Other">Other (Custom Fish)</option>
            </select>
            {errors.fishType && <span className="error-message">{errors.fishType}</span>}
            {formData.fishType && formData.fishType !== "Other" && (
              <p className="image-note success">✓ Image will be auto-assigned</p>
            )}
          </div>

          {/* Custom Fish Name */}
          {formData.fishType === "Other" && (
            <div className="form-field">
              <label>Enter Fish Name *</label>
              <input
                type="text"
                name="customFishName"
                value={formData.customFishName}
                onChange={handleChange}
                placeholder="Enter fish name"
                required
                className={errors.customFishName ? "error" : ""}
              />
              {errors.customFishName && <span className="error-message">{errors.customFishName}</span>}
              <p className="image-note info">ℹ️ Default image will be used</p>
            </div>
          )}

          {/* Quantity and Starting Price in grid */}
          <div className="grid-2">
            <div className="form-field">
              <label>Quantity (kg) *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0.5"
                step="0.5"
                placeholder="e.g., 10.5"
                required
                disabled={loading}
                className={errors.quantity ? "error" : ""}
              />
              {errors.quantity && <span className="error-message">{errors.quantity}</span>}
            </div>

            <div className="form-field">
              <label>Starting Price (₹) *</label>
              <input
                type="number"
                name="startingPrice"
                value={formData.startingPrice}
                onChange={handleChange}
                min="1"
                placeholder="e.g., 1000"
                required
                disabled={loading}
                className={errors.startingPrice ? "error" : ""}
              />
              {errors.startingPrice && <span className="error-message">{errors.startingPrice}</span>}
            </div>
          </div>

          {/* Location Dropdown - UPDATED */}
          <div className="form-field">
            <label>Location *</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className={errors.location ? "error" : ""}
              disabled={loading}
            >
              <option value="">Select your city/town</option>
              {TAMIL_NADU_CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {errors.location && <span className="error-message">{errors.location}</span>}
            
          </div>

          {/* Phone Number */}
          <div className="form-field">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10 digit mobile number"
              pattern="[0-9]{10}"
              maxLength="10"
              required
              disabled={loading}
              className={errors.phone ? "error" : ""}
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          {/* Description */}
          <div className="form-field">
            <label>Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the fish quality, size, catch date, etc."
              rows="3"
              disabled={loading}
            />
          </div>

          

          {/* Form Actions with Reset and Submit buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="reset-btn"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Auction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAuction;