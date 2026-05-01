// backend/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["admin", "seller", "buyer"],
    default: "buyer"
  },
  phone: {
    type: String
  },
  location: {
    type: String
  },
  status: {
    type: String,
    enum: ["Active", "Blocked"],
    default: "Active"
  },
  // Wallet balance field - added for wallet system
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);