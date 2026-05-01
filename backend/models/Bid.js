const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  fishId: { type: mongoose.Schema.Types.ObjectId, ref: "Fish" },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  bidAmount: Number
}, { timestamps: true });

module.exports = mongoose.model("Bid", bidSchema);
