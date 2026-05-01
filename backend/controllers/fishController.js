const Fish = require("../models/Fish");

/* ===========================
   CREATE FISH LISTING
=========================== */

exports.createFish = async (req, res) => {
  try {

    const fish = new Fish(req.body);

    await fish.save();

    res.status(201).json({
      message: "Fish listing created",
      fish
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
};


/* ===========================
   GET SELLER LISTINGS
=========================== */

exports.getMyListings = async (req, res) => {

  try {

    const fish = await Fish.find({
      sellerId: req.params.sellerId
    });

    res.json(fish);

  } catch (error) {

    res.status(500).json({ message: "Server Error" });

  }
};


/* ===========================
   GET VERIFIED FISH
=========================== */

exports.getVerifiedFish = async (req, res) => {

  try {

    const fish = await Fish.find({
      status: "Verified"
    });

    res.json(fish);

  } catch (error) {

    res.status(500).json({ message: "Server Error" });

  }

};