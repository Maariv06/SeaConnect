// components/DeliveryCalculator.js
import React, { useState, useEffect } from 'react';
import { calculateDeliveryCharges, getDeliverySummary, formatPrice, getZonePricingTable } from '../services/deliveryService';
import './DeliveryCalculator.css';

const DeliveryCalculator = ({ onDeliveryCalculated, initialCity = "", initialWeight = 1 }) => {
  const [city, setCity] = useState(initialCity);
  const [weight, setWeight] = useState(initialWeight);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPricingTable, setShowPricingTable] = useState(false);
  const [error, setError] = useState("");

  // Common Tamil Nadu cities for suggestions
  const commonCities = [
    "Thoothukudi", "Tiruchendur", "Srivaikuntam", "Kayalpattinam",
    "Tirunelveli", "Palayamkottai", "Kovilpatti", "Tenkasi", "Sankarankovil",
    "Kanyakumari", "Nagercoil", "Marthandam", "Kuzhithurai",
    "Madurai", "Ramanathapuram", "Sivagangai", "Virudhunagar", "Sivakasi",
    "Dindigul", "Palani", "Kodaikanal", "Theni",
    "Chennai", "Coimbatore", "Trichy", "Salem", "Erode", "Tiruppur",
    "Vellore", "Kanchipuram", "Pondicherry", "Cuddalore", "Thanjavur"
  ];

  useEffect(() => {
    if (city && weight > 0) {
      calculateDelivery();
    }
  }, [city, weight]);

  const calculateDelivery = () => {
    setLoading(true);
    setError("");
    
    if (!city.trim()) {
      setError("Please enter delivery city");
      setLoading(false);
      return;
    }

    if (weight <= 0) {
      setError("Weight must be greater than 0");
      setLoading(false);
      return;
    }

    const info = getDeliverySummary(city, weight);
    setDeliveryInfo(info);
    
    if (!info.success) {
      setError(info.message || "Could not calculate delivery");
    }
    
    if (onDeliveryCalculated) {
      onDeliveryCalculated(info);
    }
    setLoading(false);
  };

  const handleCityChange = (e) => {
    const value = e.target.value;
    setCity(value);
    setError("");
    
    // Filter suggestions
    if (value.length > 1) {
      const filtered = commonCities.filter(c => 
        c.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestedCity) => {
    setCity(suggestedCity);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleWeightChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setWeight(value);
    setError("");
  };

  const pricingTable = getZonePricingTable();

  return (
    <div className="delivery-calculator">
      <div className="calculator-header">
        <h3>🚚 Delivery Calculator</h3>
        <button 
          className="info-btn"
          onClick={() => setShowPricingTable(!showPricingTable)}
          title="View pricing table"
        >
          ℹ️
        </button>
      </div>

      {/* Pricing Table Modal */}
      {showPricingTable && (
        <div className="pricing-table-modal">
          <div className="pricing-table-content">
            <h4>Delivery Charges</h4>
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Distance</th>
                  <th>≤10kg</th>
                  <th>10-25kg</th>
                  <th>25kg+</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Local</strong></td>
                  <td>0-20 km</td>
                  <td className="free">FREE</td>
                  <td>₹50</td>
                  <td>₹100</td>
                </tr>
                <tr>
                  <td><strong>Nearby</strong></td>
                  <td>20-100 km</td>
                  <td>₹100</td>
                  <td>₹200</td>
                  <td>₹300</td>
                </tr>
                <tr>
                  <td><strong>Regional</strong></td>
                  <td>100-300 km</td>
                  <td>₹350</td>
                  <td>₹550</td>
                  <td>₹750</td>
                </tr>
                <tr>
                  <td><strong>Distant</strong></td>
                  <td>300-600 km</td>
                  <td>₹700</td>
                  <td>₹900</td>
                  <td>₹1100</td>
                </tr>
                <tr>
                  <td><strong>Long Distance</strong></td>
                  <td>600km+</td>
                  <td>₹900</td>
                  <td>₹1200</td>
                  <td>₹1200 + ₹15/kg</td>
                </tr>
              </tbody>
            </table>
            <button 
              className="close-table-btn"
              onClick={() => setShowPricingTable(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      <div className="calculator-form">
        <div className="form-group">
          <label>Delivery City</label>
          <div className="city-input-container">
            <input
              type="text"
              value={city}
              onChange={handleCityChange}
              placeholder="Enter city name (e.g., Chennai)"
              className={`city-input ${error ? 'error' : ''}`}
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((s, index) => (
                  <li key={index} onClick={() => handleSuggestionClick(s)}>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Weight (kg)</label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={weight}
            onChange={handleWeightChange}
            placeholder="Enter weight in kg"
            className={error ? 'error' : ''}
          />
        </div>

        <button 
          className="calculate-btn"
          onClick={calculateDelivery}
          disabled={!city || weight <= 0}
        >
          Calculate Delivery
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading">Calculating...</div>}

      {deliveryInfo && deliveryInfo.success && !loading && (
        <div className={`delivery-result ${deliveryInfo.isFreeDelivery ? 'free-delivery' : ''}`}>
          <div className="result-header">
            <div>
              <span className="zone-badge">{deliveryInfo.zone}</span>
              {deliveryInfo.isFreeDelivery && (
                <span className="free-badge">FREE DELIVERY</span>
              )}
            </div>
            <span className="distance-badge">{deliveryInfo.distance} km</span>
          </div>

          <div className="result-details">
            <div className="detail-row">
              <span>📍 From:</span>
              <span>{deliveryInfo.fromWarehouse}</span>
            </div>
            <div className="detail-row">
              <span>📦 To:</span>
              <span>{deliveryInfo.deliveryCity}</span>
            </div>
            <div className="detail-row">
              <span>⚖️ Weight:</span>
              <span>{deliveryInfo.weight} kg</span>
            </div>
            <div className="detail-row">
              <span>🚚 Delivery:</span>
              <span>{deliveryInfo.estimatedDays}</span>
            </div>
            <div className="detail-row price-row">
              <span>💰 Delivery Charge:</span>
              <span className={`price ${deliveryInfo.isFreeDelivery ? 'free' : ''}`}>
                {deliveryInfo.priceDisplay}
              </span>
            </div>
          </div>

          {deliveryInfo.tooltip && (
            <div className="info-tooltip">
              ℹ️ {deliveryInfo.tooltip}
            </div>
          )}

          {deliveryInfo.distance <= 20 && deliveryInfo.weight > 10 && (
            <div className="info-note">
              💡 Tip: Orders under 10kg qualify for FREE delivery in Local zone
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryCalculator;