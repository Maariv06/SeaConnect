import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";

import AdminSidebar from "../components/admin/AdminSidebar";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminUsers from "../components/admin/AdminUsers";
import AdminFishListings from "../components/admin/AdminFishListings";
import AdminAuctions from "../components/admin/AdminAuctions";
import AdminOrders from "../components/admin/AdminOrders";
import SellFish from "./SellFish"; 
import CreateAuction from "./CreateAuction";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const renderContent = () => {
    switch(activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <AdminUsers />;
      case "fish":
        return <AdminFishListings setActiveTab={setActiveTab} />;
      case "addFish":
  return (
    <div className="no-padding">
      <SellFish setActiveTab={setActiveTab} />
    </div>
  );
      case "auctions":
  return <AdminAuctions setActiveTab={setActiveTab} />;
        case "addAuction":
  return <CreateAuction setActiveTab={setActiveTab} />;
      case "orders":
        return <AdminOrders />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="admin-panel-modern">
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />
      <div className="main-modern">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminPanel;