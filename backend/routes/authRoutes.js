// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ======================
// REGISTER
// ======================
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, role, phone, location } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: role || "buyer",
      phone,
      location
    });

    await newUser.save();

    res.status(201).json({ 
      success: true,
      message: "User Registered Successfully",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false,
      message: "Server Error" 
    });
  }
});

// ======================
// LOGIN
// ======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid Email or Password" 
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid Email or Password" 
      });
    }

    res.json({
      success: true,
      message: "Login Successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false,
      message: "Server Error" 
    });
  }
});

// ======================
// GET ALL USERS (For Admin)
// ======================
router.get("/users", async (req, res) => {
  try {
    // Get all users except passwords
    const users = await User.find().select("-password");
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching users" 
    });
  }
});

// ======================
// GET SINGLE USER BY ID
// ======================
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching user" 
    });
  }
});

// ======================
// UPDATE USER
// ======================
router.put("/user/:id", async (req, res) => {
  try {
    const { fullName, email, role, phone, location } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        fullName,
        email,
        role,
        phone,
        location
      },
      { new: true }
    ).select("-password");
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false,
      message: "Error updating user" 
    });
  }
});

// ======================
// CHANGE USER PASSWORD
// ======================
router.put("/user/:id/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user with password
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Current password is incorrect" 
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false,
      message: "Error changing password" 
    });
  }
});

// ======================
// DELETE USER (Admin only)
// ======================
router.delete("/user/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    res.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting user" 
    });
  }
});

// ======================
// BLOCK/UNBLOCK USER (Admin only)
// ======================
router.put("/user/:id/block", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "Blocked" },
      { new: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    res.json({
      success: true,
      message: "User blocked successfully",
      data: user
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false,
      message: "Error blocking user" 
    });
  }
});

router.put("/user/:id/unblock", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "Active" },
      { new: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    res.json({
      success: true,
      message: "User unblocked successfully",
      data: user
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false,
      message: "Error unblocking user" 
    });
  }
});

// ======================
// GET USERS BY ROLE
// ======================
router.get("/users/role/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role }).select("-password");
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching users by role" 
    });
  }
});

// ======================
// GET USER STATISTICS (For Dashboard)
// ======================
router.get("/users/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: "seller" });
    const totalBuyers = await User.countDocuments({ role: "buyer" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const activeUsers = await User.countDocuments({ status: "Active" });
    const blockedUsers = await User.countDocuments({ status: "Blocked" });
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalBuyers,
        totalAdmins,
        activeUsers,
        blockedUsers
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching user statistics" 
    });
  }
});

module.exports = router;