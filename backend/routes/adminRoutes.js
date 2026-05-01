const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Fish = require("../models/Fish");
const Order = require("../models/Order");


/* ==================================
GET ALL USERS
================================== */

router.get("/users", async (req, res) => {
  try {

    const users = await User.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });

  }
});



/* ==================================
GET ALL FISH POSTS
================================== */

router.get("/fish-posts", async (req, res) => {
  try {

    const fishPosts = await Fish.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      fishPosts
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch fish posts"
    });

  }
});



/* ==================================
GET ALL ORDERS
================================== */

router.get("/orders", async (req, res) => {
  try {

    const orders = await Order.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });

  }
});


/* ==================================
VERIFY FISH
================================== */

router.put("/verify-fish/:id", async (req, res) => {

  try {

    const fish = await Fish.findByIdAndUpdate(
      req.params.id,
      { status: "Verified" },
      { new: true }
    );

    res.json({
      success: true,
      fish
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Verification failed"
    });

  }

});



/* ==================================
REJECT FISH
================================== */

router.put("/reject-fish/:id", async (req, res) => {

  try {

    const fish = await Fish.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected" },
      { new: true }
    );

    res.json({
      success: true,
      fish
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Reject failed"
    });

  }

});



/* ==================================
EDIT PRICE & QUANTITY
================================== */

router.put("/update-fish/:id", async (req, res) => {

  try {

    const { pricePerKg, quantity } = req.body;

    const totalPrice = pricePerKg * quantity;

    const fish = await Fish.findByIdAndUpdate(
      req.params.id,
      {
        pricePerKg,
        quantity,
        totalPrice
      },
      { new: true }
    );

    res.json({
      success: true,
      fish
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Update failed"
    });

  }

});


module.exports = router;