// components/admin/AdminFishListings.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminFishListings.css";
import { useNavigate } from "react-router-dom";

// Import all fish images directly
import seerFishImg from "../../assets/fish/seer-fish.jpg";
import tunaImg from "../../assets/fish/tuna.jpg";
import sardineImg from "../../assets/fish/sardine.jpg";
import mackerelImg from "../../assets/fish/mackerel.jpg";
import anchovyImg from "../../assets/fish/anchovy.jpg";
import pomfretImg from "../../assets/fish/pomfret.jpg";
import barracudaImg from "../../assets/fish/barracuda.jpg";
import snapperImg from "../../assets/fish/snapper.jpg";
import grouperImg from "../../assets/fish/grouper.jpg";
import silverBellyImg from "../../assets/fish/silver-belly.jpg";
import threadfinImg from "../../assets/fish/threadfin.jpg";
import prawnsImg from "../../assets/fish/prawns.jpg";
import tigerPrawnsImg from "../../assets/fish/tiger-prawns.jpg";
import shrimpImg from "../../assets/fish/shrimp.jpg";
import crabImg from "../../assets/fish/crab.jpg";
import squidImg from "../../assets/fish/squid.jpg";
import defaultFishImg from "../../assets/fish/default-fish.jpg";

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

// Map fish types to their imported images
const fishImageMap = {
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

const AdminFishListings = ({ setActiveTab }) => {
  const [fishPosts, setFishPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingFish, setEditingFish] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fishType: "",
    quantity: "",
    pricePerKg: "",
    totalPrice: "",
    description: "",
    phone: "",
    catchDate: "",
    location: "", // Changed from pickupLocation
    image: null,
    existingImage: ""
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [imageErrors, setImageErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchFishPosts();
  }, []);

  // FETCH ALL FISH
  const fetchFishPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/fish/all`);
      
      // Handle different response structures
      const posts = res.data.fish || res.data.data || [];
      setFishPosts(posts);
      
      console.log("📊 Fetched fish posts:", posts.length);
      posts.forEach((fish, i) => {
        console.log(`   ${i+1}. ${fish.fishType} - Location: ${fish.location || 'MISSING'}`);
      });
      
    } catch (err) {
      console.error("Error fetching fish posts:", err);
      setFishPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // VERIFY FISH
  const verifyFish = async (id) => {
    try {
      await axios.put(`${API}/fish/verify/${id}`);
      alert("✅ Fish verified successfully!");
      fetchFishPosts();
    } catch (err) {
      console.error("Error verifying fish:", err);
      alert("❌ Error verifying fish");
    }
  };

  // REJECT FISH
  const rejectFish = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      await axios.put(`${API}/fish/reject/${id}`, { reason });
      alert("❌ Fish rejected!");
      fetchFishPosts();
    } catch (err) {
      console.error("Error rejecting fish:", err);
      alert("❌ Error rejecting fish");
    }
  };

  // DELETE FISH
  const deleteFish = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    try {
      await axios.delete(`${API}/fish/${id}`);
      alert("✅ Listing deleted successfully!");
      fetchFishPosts();
    } catch (err) {
      console.error("Error deleting fish:", err);
      alert("❌ Error deleting fish");
    }
  };

  // OPEN EDIT MODAL
  const openEditModal = (fish) => {
    setEditingFish(fish);
    setEditFormData({
      fishType: fish.fishType || "",
      quantity: fish.quantity || "",
      pricePerKg: fish.pricePerKg || "",
      totalPrice: fish.totalPrice || (fish.quantity * fish.pricePerKg) || "",
      description: fish.description || "",
      phone: fish.phone || "",
      catchDate: fish.catchDate ? fish.catchDate.split('T')[0] : "",
      location: fish.location || fish.pickupLocation || "Thoothukudi", // Use location, fallback to pickupLocation
      image: null,
      existingImage: fish.image || ""
    });
    
    // Set image preview using the fish image map
    const imageToShow = fishImageMap[fish.fishType] || defaultFishImg;
    setImagePreview(imageToShow);
    
    setUploadError("");
    setShowEditModal(true);
  };

  // HANDLE EDIT FORM CHANGE
  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    setUploadError("");
    
    if (name === "image") {
      if (files && files[0]) {
        const file = files[0];
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setUploadError("File size must be less than 5MB");
          return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setUploadError("Please upload an image file");
          return;
        }
        
        setEditFormData({ ...editFormData, image: file });
        setImagePreview(URL.createObjectURL(file));
      }
    } else {
      setEditFormData({ ...editFormData, [name]: value });
      
      // Auto-calculate total price
      if (name === "quantity" || name === "pricePerKg") {
        const quantity = name === "quantity" ? value : editFormData.quantity;
        const price = name === "pricePerKg" ? value : editFormData.pricePerKg;
        if (quantity && price) {
          setEditFormData(prev => ({
            ...prev,
            totalPrice: Number(quantity) * Number(price)
          }));
        }
      }
    }
  };

  // UPDATE FISH
  const updateFish = async (e) => {
    e.preventDefault();
    setUploadProgress(0);
    
    try {
      // Validate location
      if (!editFormData.location) {
        alert("Location is required");
        return;
      }

      const formData = new FormData();
      
      // Append all fields
      formData.append('fishType', editFormData.fishType);
      formData.append('quantity', editFormData.quantity);
      formData.append('pricePerKg', editFormData.pricePerKg);
      formData.append('description', editFormData.description || '');
      formData.append('phone', editFormData.phone);
      formData.append('catchDate', editFormData.catchDate);
      formData.append('location', editFormData.location); // Send location
      
      // Append image if new one is selected
      if (editFormData.image) {
        formData.append('image', editFormData.image);
      }

      const response = await axios.put(
        `${API}/fish/update/${editingFish._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percent);
            }
          }
        }
      );

      if (response.data.success) {
        alert("✅ Fish listing updated successfully!");
        setShowEditModal(false);
        setEditingFish(null);
        setUploadProgress(0);
        setImagePreview(null);
        fetchFishPosts();
      }
    } catch (err) {
      console.error("Error updating fish:", err);
      alert(err.response?.data?.message || "❌ Error updating fish listing");
    }
  };

  // Get fish image based on fish type
  const getFishImage = (fishType) => {
    return fishImageMap[fishType] || defaultFishImg;
  };

  const handleImageError = (fishId) => {
    setImageErrors(prev => ({
      ...prev,
      [fishId]: true
    }));
  };

  const filteredPosts = filter === "all"
    ? fishPosts
    : fishPosts.filter((f) => f?.status === filter);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending": return "status-badge pending";
      case "Verified": return "status-badge verified";
      case "Rejected": return "status-badge rejected";
      case "Sold Out": return "status-badge soldout";
      default: return "status-badge";
    }
  };

  if (loading) {
    return <div className="loading">Loading fish listings...</div>;
  }

  return (
    <div className="fish-modern">
      <div className="section-header">
  <h1>Fish Listings Management</h1>

  <div style={{ display: "flex", gap: "10px" }}>
    <button 
  className="add-btn"
  onClick={() => setActiveTab("addFish")}
>
  ➕ Add Fish
</button>

    <button className="refresh-btn" onClick={fetchFishPosts}>
      <span>⟳</span> Refresh
    </button>
  </div>
</div>

      {/* Filter Section */}
      <div className="filter-section">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Listings ({fishPosts.length})</option>
          <option value="Pending">
            Pending ({fishPosts.filter(f => f?.status === "Pending").length})
          </option>
          <option value="Verified">
            Verified ({fishPosts.filter(f => f?.status === "Verified").length})
          </option>
          <option value="Rejected">
            Rejected ({fishPosts.filter(f => f?.status === "Rejected").length})
          </option>
          <option value="Sold Out">
            Sold Out ({fishPosts.filter(f => f?.status === "Sold Out").length})
          </option>
        </select>
      </div>

      {/* Listings Grid */}
      <div className="fish-grid-modern">
        {filteredPosts.length === 0 ? (
          <p className="no-results">No fish listings found</p>
        ) : (
          filteredPosts.map((f) => (
            <div key={f._id} className="fish-card-modern">
              
              {/* Fish Image */}
              <img
                src={getFishImage(f.fishType)}
                alt={f.fishType}
                className="fish-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultFishImg;
                }}
              />

              <div className="fish-card-header">
                <h3>{f.fishType}</h3>
                <span className={getStatusBadge(f.status)}>
                  {f.status}
                </span>
              </div>

              <div className="fish-card-body">
                <p><strong>Seller:</strong> <span>{f.sellerName}</span></p>
                <p><strong>Total Quantity:</strong> <span>{f.quantity} kg</span></p>
                <p className="highlight-row">
                  <strong>Available:</strong> 
                  <span className={f.availableQuantity === 0 ? "sold-out" : "available"}>
                    {f.availableQuantity || 0} kg
                  </span>
                </p>
                <p><strong>Sold:</strong> <span>{(f.quantity - (f.availableQuantity || 0))} kg</span></p>
                <p><strong>Price:</strong> <span>₹{f.pricePerKg}/kg</span></p>
                <p><strong>Total Value:</strong> <span>₹{f.totalPrice}</span></p>
                <p><strong>Phone:</strong> <span>{f.phone}</span></p>
                <p><strong>Location:</strong> <span className="location-badge">📍 {f.location || f.pickupLocation || "Not specified"}</span></p>
                <p><strong>Catch Date:</strong> <span>{new Date(f.catchDate).toLocaleDateString()}</span></p>
                {f.description && (
                  <p><strong>Description:</strong> <span>{f.description}</span></p>
                )}
                {f.orders && f.orders.length > 0 && (
                  <p><strong>Orders:</strong> <span>{f.orders.length}</span></p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="card-actions">
                <button
                  className="edit-btn"
                  onClick={() => openEditModal(f)}
                  data-tooltip="Edit listing"
                >
                  ✎ Edit
                </button>
                
                {f.status === "Pending" && (
                  <>
                    <button
                      className="verify-btn-modern"
                      onClick={() => verifyFish(f._id)}
                      data-tooltip="Verify listing"
                    >
                      ✓ Verify
                    </button>
                    <button
                      className="reject-btn-modern"
                      onClick={() => rejectFish(f._id)}
                      data-tooltip="Reject listing"
                    >
                      ✗ Reject
                    </button>
                  </>
                )}

                <button
                  className="delete-btn"
                  onClick={() => deleteFish(f._id)}
                  data-tooltip="Delete listing"
                >
                  🗑 Delete
                </button>
              </div>

              {f.status === "Verified" && (
                <div className="verified-info">
                  <p className="live-badge">✅ Live on Browse Fish</p>
                  {f.availableQuantity === 0 && (
                    <p className="sold-out-badge">📦 Completely Sold Out</p>
                  )}
                </div>
              )}

              {f.status === "Rejected" && (
                <div className="rejected-info">
                  <p><strong>Reason:</strong> {f.rejectionReason || "Not specified"}</p>
                </div>
              )}

              {f.status === "Sold Out" && (
                <div className="sold-out-info">
                  <p>📦 Sold Out - {f.orders?.length || 0} orders placed</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <h2>Edit Fish Listing</h2>
            
            <form onSubmit={updateFish} className="edit-form" encType="multipart/form-data">
              
              {/* Fish Type */}
              <div className="form-group">
                <label>Fish Type *</label>
                <input
                  type="text"
                  name="fishType"
                  value={editFormData.fishType}
                  onChange={handleEditChange}
                  required
                  placeholder="Enter fish type"
                />
              </div>

              <div className="grid-2">
                {/* Quantity */}
                <div className="form-group">
                  <label>Total Quantity (KG) *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={editFormData.quantity}
                    onChange={handleEditChange}
                    min="0.5"
                    step="0.5"
                    required
                    placeholder="e.g., 10.5"
                  />
                  <small className="field-hint">
                    Current available: {editingFish?.availableQuantity || 0} kg
                  </small>
                </div>

                {/* Price Per KG */}
                <div className="form-group">
                  <label>Price Per KG (₹) *</label>
                  <input
                    type="number"
                    name="pricePerKg"
                    value={editFormData.pricePerKg}
                    onChange={handleEditChange}
                    min="1"
                    required
                    placeholder="e.g., 450"
                  />
                </div>
              </div>

              {/* Total Price */}
              <div className="form-group">
                <label>Total Price (₹)</label>
                <input
                  type="number"
                  value={editFormData.totalPrice || (editFormData.quantity * editFormData.pricePerKg)}
                  readOnly
                  className="total-price-field"
                  placeholder="Auto-calculated"
                />
              </div>

              <div className="grid-2">
                {/* Phone */}
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditChange}
                    pattern="[0-9]{10}"
                    maxLength="10"
                    required
                    placeholder="10 digit mobile number"
                  />
                </div>

                {/* Catch Date */}
                <div className="form-group">
                  <label>Catch Date *</label>
                  <input
                    type="date"
                    name="catchDate"
                    value={editFormData.catchDate}
                    onChange={handleEditChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              {/* Location Dropdown - NEW */}
              <div className="form-group">
                <label>Seller Location *</label>
                <select
                  name="location"
                  value={editFormData.location}
                  onChange={handleEditChange}
                  required
                  className="location-select"
                >
                  <option value="">Select City/Town</option>
                  {TAMIL_NADU_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <small className="field-hint">
                  📍 This location will be used for delivery charge calculation
                </small>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  rows="3"
                  placeholder="Describe the fish quality, size, freshness, etc."
                  maxLength="500"
                />
                <small className="char-count">
                  {editFormData.description?.length || 0}/500 characters
                </small>
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <label>Change Fish Image (Optional)</label>
                <div className="image-upload-section">
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                  )}
                  
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      name="image"
                      accept="image/jpeg,image/png,image/jpg,image/gif"
                      onChange={handleEditChange}
                      id="fish-image-upload"
                    />
                    <label htmlFor="fish-image-upload" className="file-input-label">
                      {editFormData.image ? 'Change Image' : 'Choose New Image'}
                    </label>
                  </div>
                  
                  {uploadError && (
                    <div className="upload-error">{uploadError}</div>
                  )}
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="progress-bar">
                      <div 
                        className="progress" 
                        style={{ width: `${uploadProgress}%` }}
                      >
                        {uploadProgress}%
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={uploadProgress > 0 && uploadProgress < 100}
                >
                  {uploadProgress > 0 && uploadProgress < 100 
                    ? `Uploading ${uploadProgress}%` 
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFishListings;