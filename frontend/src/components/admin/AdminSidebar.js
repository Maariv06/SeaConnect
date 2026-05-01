// components/admin/AdminSidebar.js
import React from "react";
import logo from "../../assets/logo.jpeg";
import "./AdminSidebar.css";

const AdminSidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "fish", label: "Fish Listings", icon: "🐟" },
    { id: "auctions", label: "Auctions", icon: "🔨" },
    { id: "orders", label: "Orders", icon: "📦" },
  ];

  return (
    <div className="sidebar-modern">
      <div className="sidebar-logo">
        <img src={logo} alt="logo" />
        <h2>Admin</h2>
      </div>

      <ul>
        {/* Regular menu items */}
        {menuItems.map(item => (
          <li 
            key={item.id}
            className={activeTab === item.id ? "active" : ""}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span>{item.label}</span>
          </li>
        ))}
        
        {/* Logout button - now with consistent height */}
        <li onClick={onLogout} className="logout-btn">
          <span className="menu-icon">🚪</span>
          <span>Logout</span>
        </li>
      </ul>
    </div>
  );
};

export default AdminSidebar;