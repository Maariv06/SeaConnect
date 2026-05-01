const Order = require("../models/Order");
const Fish = require("../models/Fish");

const COMMISSION_PERCENT = 5;

// Create order (Buy Now or Auction winner)
exports.createOrder = async (req, res) => {
  try {
    const { fishId, finalPrice, deliveryAddress } = req.body;

    const fish = await Fish.findById(fishId);

    const commissionAmount = (finalPrice * COMMISSION_PERCENT) / 100;

    const order = await Order.create({
      buyerId: req.user.id,
      sellerId: fish.sellerId,
      fishId,
      finalPrice,
      commissionAmount,
      paymentStatus: "Paid",
      orderStatus: "Pending",
      deliveryAddress
    });

    res.json(order);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Get my orders
exports.getMyOrders = async (req, res) => {
  let orders;

  if (req.user.role === "buyer") {
    orders = await Order.find({ buyerId: req.user.id });
  } else {
    orders = await Order.find({ sellerId: req.user.id });
  }

  res.json(orders);
};

// Admin update delivery
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  const order = await Order.findByIdAndUpdate(
    id,
    { orderStatus },
    { new: true }
  );

  res.json(order);
};
