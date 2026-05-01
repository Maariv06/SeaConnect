// backend/routes/fishRoutes.js
const express = require("express");
const router = express.Router();
const Fish = require("../models/Fish");
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

/* =========================
CREATE FISH LISTING
========================= */
router.post("/create", async (req, res) => {
  try {
    const {
      fishType,
      quantity,
      availableQuantity,
      pricePerKg,
      totalPrice,
      catchDate,
      phone,
      location,
      description,
      fishImage,
      sellerId,
      sellerName,
      sellerEmail
    } = req.body;

    console.log("📝 Creating fish listing with data:", {
      fishType,
      quantity,
      location,
      sellerName
    });

    // Validate required fields
    if (!location) {
      return res.status(400).json({
        success: false,
        message: "Location is required"
      });
    }

    const newFish = new Fish({
      fishType,
      quantity: Number(quantity),
      availableQuantity: Number(availableQuantity) || Number(quantity),
      pricePerKg: Number(pricePerKg),
      totalPrice: Number(totalPrice) || (Number(quantity) * Number(pricePerKg)),
      catchDate,
      phone,
      location,
      description,
      image: fishImage || "default-fish.jpg",
      sellerId,
      sellerName,
      sellerEmail,
      status: "Pending"
    });

    await newFish.save();
    
    console.log(`✅ Fish listing created with ID: ${newFish._id}`);
    console.log(`📍 Location saved: ${newFish.location}`);

    res.status(201).json({
      success: true,
      message: "Fish listing created successfully",
      data: newFish
    });
  } catch (error) {
    console.error("❌ Error creating fish listing:", error);
    res.status(500).json({
      success: false,
      message: "Error creating fish listing",
      error: error.message
    });
  }
});

/* =========================
GET VERIFIED FISH (For Browse Page)
========================= */
router.get("/verified", async (req, res) => {
  try {
    console.log("🔍 Fetching verified fish listings...");
    
    const verifiedFish = await Fish.find({ 
      status: "Verified",
      availableQuantity: { $gt: 0 }
    }).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${verifiedFish.length} verified listings`);
    
    verifiedFish.forEach((fish, index) => {
      console.log(`   ${index + 1}. ${fish.fishType} - Qty: ${fish.availableQuantity}kg - Location: "${fish.location || 'NO LOCATION!'}"`);
    });
    
    res.json({
      success: true,
      count: verifiedFish.length,
      data: verifiedFish
    });
    
  } catch (error) {
    console.error("❌ Error fetching verified fish:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching verified fish",
      error: error.message
    });
  }
});

/* =========================
GET ALL FISH (Admin/Debug)
========================= */
router.get("/all", async (req, res) => {
  try {
    const allFish = await Fish.find({}).sort({ createdAt: -1 });
    console.log(`📊 All listings: ${allFish.length}`);
    
    allFish.forEach((fish, i) => {
      console.log(`   ${i+1}. ${fish.fishType} - Status: ${fish.status} - Location: ${fish.location || 'MISSING'}`);
    });
    
    res.json({
      success: true,
      count: allFish.length,
      data: allFish
    });
  } catch (error) {
    console.error("❌ Error fetching all fish:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/* =========================
GET FISH BY SELLER ID (For My Activity)
========================= */
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const fish = await Fish.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: fish.length,
      data: fish
    });
  } catch (error) {
    console.error("❌ Error fetching seller fish:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching seller fish"
    });
  }
});

/* =========================
UPDATE FISH QUANTITY (After Order)
========================= */
router.put("/update-quantity/:id", async (req, res) => {
  try {
    const { orderedQuantity, orderId, customerName } = req.body;
    
    const fish = await Fish.findById(req.params.id);
    
    if (!fish) {
      return res.status(404).json({
        success: false,
        message: "Fish not found"
      });
    }
    
    if (fish.availableQuantity < orderedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${fish.availableQuantity} kg available`
      });
    }
    
    fish.availableQuantity -= orderedQuantity;
    
    fish.orders.push({
      orderId,
      quantity: orderedQuantity,
      customerName,
      orderedAt: new Date()
    });
    
    if (fish.availableQuantity === 0) {
      fish.status = "Sold Out";
    }
    
    await fish.save();
    
    res.json({
      success: true,
      message: "Quantity updated successfully",
      data: {
        availableQuantity: fish.availableQuantity,
        status: fish.status
      }
    });
    
  } catch (error) {
    console.error("❌ Error updating quantity:", error);
    res.status(500).json({
      success: false,
      message: "Error updating quantity"
    });
  }
});

/* =========================
GET SINGLE FISH
========================= */
router.get("/:id", async (req, res) => {
  try {
    const fish = await Fish.findById(req.params.id);

    if (!fish) {
      return res.status(404).json({
        success: false,
        message: "Fish not found"
      });
    }

    res.json({
      success: true,
      data: fish
    });
  } catch (error) {
    console.error("❌ Error fetching fish:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching fish"
    });
  }
});

/* =========================
UPDATE FISH (Admin) - FIXED VERSION
========================= */
router.put("/update/:id", upload.single('image'), async (req, res) => {
  try {
    console.log("📝 Updating fish with ID:", req.params.id);
    console.log("📦 Request body:", req.body);
    console.log("📦 Request file:", req.file);

    // Extract data from req.body
    const {
      fishType,
      quantity,
      pricePerKg,
      description,
      phone,
      catchDate,
      location
    } = req.body;

    console.log("📦 Extracted data:", {
      fishType,
      quantity,
      pricePerKg,
      location,
      phone,
      catchDate
    });

    // Validate required fields
    if (!fishType || !quantity || !pricePerKg || !phone || !catchDate || !location) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        received: req.body
      });
    }

    // Find the fish first
    const currentFish = await Fish.findById(req.params.id);
    
    if (!currentFish) {
      return res.status(404).json({
        success: false,
        message: "Fish not found"
      });
    }

    // Calculate total price
    const totalPrice = Number(quantity) * Number(pricePerKg);
    
    // Calculate quantity difference
    const quantityDiff = Number(quantity) - currentFish.quantity;
    const newAvailableQuantity = currentFish.availableQuantity + quantityDiff;

    if (newAvailableQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot reduce quantity below already sold amount"
      });
    }

    // Prepare update data
    const updateData = {
      fishType: fishType,
      quantity: Number(quantity),
      availableQuantity: newAvailableQuantity,
      pricePerKg: Number(pricePerKg),
      totalPrice: totalPrice,
      description: description || currentFish.description,
      phone: phone,
      catchDate: catchDate,
      location: location, // Update location
    };

    // Update image if new one uploaded
    if (req.file) {
      updateData.image = req.file.filename;
    }

    console.log("🔄 Updating with data:", updateData);

    const updatedFish = await Fish.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (updatedFish.availableQuantity > 0 && updatedFish.status === "Sold Out") {
      updatedFish.status = "Verified";
      await updatedFish.save();
    }

    console.log("✅ Fish updated successfully");
    console.log("📍 New location:", updatedFish.location);

    res.json({
      success: true,
      message: "Fish updated successfully",
      data: updatedFish
    });

  } catch (error) {
    console.error("❌ Error updating fish:", error);
    console.error("Error details:", error.message);
    console.error("Stack:", error.stack);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message
    });
  }
});

/* =========================
VERIFY FISH (Admin)
========================= */
router.put("/verify/:id", async (req, res) => {
  try {
    const fish = await Fish.findByIdAndUpdate(
      req.params.id,
      { 
        status: "Verified",
        verifiedAt: new Date()
      },
      { new: true }
    );

    if (!fish) {
      return res.status(404).json({
        success: false,
        message: "Fish not found"
      });
    }

    console.log(`✅ Fish ${fish._id} verified successfully - Location: ${fish.location}`);

    res.json({
      success: true,
      message: "Fish verified successfully",
      data: fish
    });
  } catch (error) {
    console.error("❌ Error verifying fish:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed"
    });
  }
});

/* =========================
REJECT FISH (Admin)
========================= */
router.put("/reject/:id", async (req, res) => {
  try {
    const { reason } = req.body;

    const fish = await Fish.findByIdAndUpdate(
      req.params.id,
      {
        status: "Rejected",
        rejectionReason: reason || "Not specified",
        rejectedAt: new Date()
      },
      { new: true }
    );

    if (!fish) {
      return res.status(404).json({
        success: false,
        message: "Fish not found"
      });
    }

    res.json({
      success: true,
      message: "Fish rejected",
      data: fish
    });
  } catch (error) {
    console.error("❌ Error rejecting fish:", error);
    res.status(500).json({
      success: false,
      message: "Reject failed"
    });
  }
});

/* =========================
DELETE FISH (Admin)
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const fish = await Fish.findByIdAndDelete(req.params.id);

    if (!fish) {
      return res.status(404).json({
        success: false,
        message: "Fish not found"
      });
    }

    res.json({
      success: true,
      message: "Fish deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting fish:", error);
    res.status(500).json({
      success: false,
      message: "Delete failed"
    });
  }
});

module.exports = router;