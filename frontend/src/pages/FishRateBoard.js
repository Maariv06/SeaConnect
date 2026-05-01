import React, { useState } from "react";
import "./FishRateBoard.css";
import { FaSearch, FaMapMarkerAlt, FaArrowUp, FaArrowDown } from "react-icons/fa";

function FishRateBoard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");

  const prices = [
    {
      id: 1,
      fish: "Seer Fish (Vanjaram)",
      city: "Thoothukudi",
      price: 780,
      change: "+30",
      updated: "10:20 AM",
    },
    {
      id: 2,
      fish: "Tuna (Sura)",
      city: "Thoothukudi",
      price: 520,
      change: "-10",
      updated: "09:50 AM",
    },
    {
      id: 3,
      fish: "Sardine (Mathi)",
      city: "Kanyakumari",
      price: 260,
      change: "+15",
      updated: "11:00 AM",
    },
    {
      id: 4,
      fish: "Pomfret (Vavval)",
      city: "Kanyakumari",
      price: 680,
      change: "-20",
      updated: "10:40 AM",
    },
    {
      id: 5,
      fish: "King Fish",
      city: "Rameswaram",
      price: 740,
      change: "+25",
      updated: "09:30 AM",
    },
    {
      id: 6,
      fish: "Anchovy (Nethili)",
      city: "Tiruchendur",
      price: 320,
      change: "+5",
      updated: "10:10 AM",
    },
    {
      id: 7,
      fish: "Crab (Nandu)",
      city: "Colachel",
      price: 450,
      change: "-15",
      updated: "09:45 AM",
    },
    {
      id: 8,
      fish: "Prawns (Eral)",
      city: "Mandapam",
      price: 600,
      change: "+40",
      updated: "10:55 AM",
    },
  ];

  const cities = [
    "All",
    "Thoothukudi",
    "Kanyakumari",
    "Rameswaram",
    "Tiruchendur",
    "Colachel",
    "Mandapam",
  ];

  const filteredPrices = prices.filter((item) => {
    return (
      item.fish.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCity === "All" || item.city === selectedCity)
    );
  });

  return (
    <div className="price-container">
      <div className="price-header">
        <h1>🐟 SeaConnect – Tamil Nadu Coastal Fish Market Prices</h1>
<p>Live Rates from Thoothukudi & Kanyakumari Coastal Region</p>
      </div>

      <div className="price-controls">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search fish (Vanjaram, Mathi...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="city-filter">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            {cities.map((city, index) => (
              <option key={index}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="price-table">
        <div className="table-header">
          <span>Fish</span>
          <span>Location</span>
          <span>Price (₹/kg)</span>
          <span>Change</span>
          <span>Updated</span>
        </div>

        {filteredPrices.map((item) => (
          <div className="table-row" key={item.id}>
            <span>{item.fish}</span>
            <span>
              <FaMapMarkerAlt /> {item.city}
            </span>
            <span className="price">₹{item.price}</span>
            <span
              className={
                item.change.includes("+") ? "up change" : "down change"
              }
            >
              {item.change.includes("+") ? <FaArrowUp /> : <FaArrowDown />}
              {item.change}
            </span>
            <span>{item.updated}</span>
          </div>
        ))}
      </div>

      <div className="price-footer">
        <p>SeaConnect TN • Daily Updated Coastal Fish Rates</p>
      </div>
    </div>
  );
}

export default FishRateBoard;