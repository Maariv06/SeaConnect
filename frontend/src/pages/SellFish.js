// pages/SellFish.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import oceanBg from "../assets/ocean.png";
import "./SellFish.css";

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

// Tamil Nadu cities for location dropdown
const TAMIL_NADU_CITIES = [
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Tiruchirappalli",
  "Salem",
  "Tirunelveli",
  "Vellore",
  "Erode",
  "Thoothukudi",
  "Thanjavur",
  "Dindigul",
  "Kanyakumari",
  "Karur",
  "Cuddalore",
  "Kanchipuram",
  "Tiruppur",
  "Nagercoil",
  "Virudhunagar",
  "Sivakasi",
  "Hosur",
  "Ooty",
  "Kodaikanal",
  "Rameswaram",
  "Karaikudi",
  "Nagapattinam",
  "Ramanathapuram",
  "Theni",
  "Tenkasi",
  "Kovilpatti",
  "Tiruchendur"
].sort();

function SellFish({ setActiveTab }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  const [formData, setFormData] = useState({
    fishType: "",
    customFishName: "",
    quantity: "",
    pricePerKg: "",
    totalPrice: "",
    catchDate: "",
    phone: "",
    location: "", // Changed from pickupRequired/pickupLocation to location
    description: ""
  });

  const [errors, setErrors] = useState({});

  // Load logged user
  useEffect(() => {
  const userData = localStorage.getItem("user");
  if (userData) {
    setUser(JSON.parse(userData));
  } else {
    alert("Please login to sell fish");

    // ✅ Only navigate if NOT admin panel
    if (!setActiveTab) {
      navigate("/");
    }
  }
}, [navigate, setActiveTab]);

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

  // Auto calculate total price
  useEffect(() => {
    if (formData.quantity && formData.pricePerKg) {
      const total = Number(formData.quantity) * Number(formData.pricePerKg);
      setFormData((prev) => ({
        ...prev,
        totalPrice: total.toFixed(2)
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        totalPrice: ""
      }));
    }
  }, [formData.quantity, formData.pricePerKg]);

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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fishType) {
      newErrors.fishType = "Please select a fish type";
    }

    if (!formData.quantity) {
      newErrors.quantity = "Quantity is required";
    } else if (formData.quantity < 0.5) {
      newErrors.quantity = "Minimum quantity is 0.5 kg";
    } else if (formData.quantity > 1000) {
      newErrors.quantity = "Maximum quantity is 1000 kg";
    }

    if (!formData.pricePerKg) {
      newErrors.pricePerKg = "Price is required";
    } else if (formData.pricePerKg < 10) {
      newErrors.pricePerKg = "Minimum price is ₹10";
    }

    if (!formData.catchDate) {
      newErrors.catchDate = "Catch date is required";
    } else {
      const selectedDate = new Date(formData.catchDate);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.catchDate = "Catch date cannot be in the future";
      }
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (!formData.location) {
      newErrors.location = "Location is required";
    }

    if (formData.fishType === "Other" && !formData.customFishName) {
      newErrors.customFishName = "Please enter the fish name";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      alert("Please fill all required fields correctly");
      return;
    }

    if (!user) {
      alert("Please login first");
      return;
    }

    setLoading(true);

    // Get the image filename for the selected fish type
    let fishImageFilename = "default-fish.jpg";
    if (formData.fishType !== "Other" && fishImageFilenames[formData.fishType]) {
      fishImageFilename = fishImageFilenames[formData.fishType];
    }

    const finalFishType =
      formData.fishType === "Other"
        ? formData.customFishName
        : formData.fishType;

    const listingData = {
      fishType: finalFishType,
      quantity: Number(formData.quantity),
      availableQuantity: Number(formData.quantity),
      pricePerKg: Number(formData.pricePerKg),
      totalPrice: Number(formData.totalPrice),
      catchDate: formData.catchDate,
      phone: formData.phone,
      location: formData.location, // Location field
      description: formData.description || "",
      fishImage: fishImageFilename,
      sellerId: user._id || user.id,
      sellerName: user.fullName || user.name || "Unknown",
      sellerEmail: user.email || "",
      status: "Pending" // Will be verified by admin
    };

    console.log("Submitting listing:", listingData);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/fish/create",
        listingData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.data.success) {
        alert("✅ Fish listing submitted successfully! It will be reviewed by admin.");

        // Reset form
        setFormData({
          fishType: "",
          customFishName: "",
          quantity: "",
          pricePerKg: "",
          totalPrice: "",
          catchDate: "",
          phone: "",
          location: "",
          description: ""
        });
        setImagePreview(null);
        setErrors({});

        // Ask if user wants to view their listings
        if (setActiveTab) {
  // Admin flow
  setActiveTab("fish");
} else {
  // Normal user flow
  if (window.confirm("Listing submitted! Do you want to view your listings?")) {
    navigate("/my-activity");
  }
}
      }
    } catch (error) {
      console.error("Error submitting listing:", error);
      
      if (error.response) {
        alert(`❌ Error: ${error.response.data.message || "Failed to submit listing"}`);
      } else if (error.request) {
        alert("❌ Cannot connect to server. Please check your connection.");
      } else {
        alert("❌ Error submitting listing. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the form?")) {
      setFormData({
        fishType: "",
        customFishName: "",
        quantity: "",
        pricePerKg: "",
        totalPrice: "",
        catchDate: "",
        phone: "",
        location: "",
        description: ""
      });
      setImagePreview(null);
      setErrors({});
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

      {/* ✅ BACK BUTTON HERE */}
      {setActiveTab && (
        

<button
  onClick={() => setActiveTab("fish")}
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
      )}

      <h2>🐟 Sell Your Fish Catch</h2>

        {/* Fish Image Preview */}
        {imagePreview && (
          <div className="fish-preview">
            <img src={imagePreview} alt={formData.fishType} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="sell-form">
          {/* Fish Type */}
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

          {/* Quantity + Price */}
          <div className="grid-2">
            <div className="form-field">
              <label>Total Quantity (KG) *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                min="0.5"
                step="0.5"
                onChange={handleChange}
                required
                placeholder="e.g., 10.5"
                className={errors.quantity ? "error" : ""}
              />
              {errors.quantity && <span className="error-message">{errors.quantity}</span>}
            </div>

            <div className="form-field">
              <label>Price Per KG (₹) *</label>
              <input
                type="number"
                name="pricePerKg"
                value={formData.pricePerKg}
                min="1"
                step="1"
                onChange={handleChange}
                required
                placeholder="e.g., 450"
                className={errors.pricePerKg ? "error" : ""}
              />
              {errors.pricePerKg && <span className="error-message">{errors.pricePerKg}</span>}
            </div>
          </div>

          {/* Total */}
          <div className="form-field">
            <label>Total Price</label>
            <input
              type="number"
              value={formData.totalPrice}
              readOnly
              className="total-field"
              placeholder="Auto-calculated"
            />
          </div>

          {/* Catch Date */}
          <div className="form-field">
            <label>Catch Date *</label>
            <input
              type="date"
              name="catchDate"
              value={formData.catchDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={handleChange}
              required
              className={errors.catchDate ? "error" : ""}
            />
            {errors.catchDate && <span className="error-message">{errors.catchDate}</span>}
          </div>

          {/* Phone */}
          <div className="form-field">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              placeholder="10 digit mobile number"
              pattern="[0-9]{10}"
              maxLength="10"
              onChange={handleChange}
              required
              className={errors.phone ? "error" : ""}
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          {/* Location Dropdown - NEW */}
          <div className="form-field">
            <label>Your Location *</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className={errors.location ? "error" : ""}
            >
              <option value="">Select your city/town</option>
              {TAMIL_NADU_CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {errors.location && <span className="error-message">{errors.location}</span>}
            
          </div>

          {/* Description */}
          <div className="form-field">
            <label>Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Additional details about your fish catch..."
              rows="3"
            />
          </div>

          {/* Form Actions */}
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
              {loading ? "Submitting..." : "Submit Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SellFish;