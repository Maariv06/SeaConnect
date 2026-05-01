// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// ======================
// IMPORTANT: Webhook needs raw body, so apply it BEFORE express.json()
// ======================
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// ======================
// MIDDLEWARE
// ======================
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// STATIC FILES
// ======================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory");
}

app.use('/uploads', express.static(uploadsDir));

// ======================
// DATABASE CONNECTION
// ======================
mongoose.connect("mongodb://127.0.0.1:27017/seaconnect")
.then(() => console.log("✅ MongoDB Connected Successfully"))
.catch((err) => {
  console.error("❌ MongoDB Connection Error:", err);
});

// ======================
// ROUTES
// ======================
const authRoutes = require("./routes/authRoutes");
const fishRoutes = require("./routes/fishRoutes");
const orderRoutes = require("./routes/orderRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const walletRoutes = require("./routes/walletRoutes"); // You'll need to create this

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/fish", fishRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auction", auctionRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/wallet", walletRoutes);

// ======================
// TEST ROUTES
// ======================
app.get("/", (req, res) => {
  res.json({ message: "🐟 SeaConnect API is running" });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    time: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "not configured"
  });
});

// ======================
// 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.url} not found` 
  });
});

// ======================
// ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ======================
// START SERVER
// ======================
const PORT = 5000;
const server = app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
  console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅' : '❌'}`);
  console.log(`=================================`);
  
  // Start cron jobs after server is running
  try {
    console.log("🔄 Initializing cron jobs...");
    require('./cronStarter');
  } catch (error) {
    console.error("⚠️ Cron jobs not started:", error.message);
    console.log("💡 To fix: Run 'npm install axios' in backend folder");
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    mongoose.connection.close();
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    mongoose.connection.close();
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

module.exports = server;