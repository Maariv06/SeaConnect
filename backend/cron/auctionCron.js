// backend/cron/auctionCron.js
const axios = require('axios');

// Run this every minute to check for expired auctions
const checkExpiredAuctions = async () => {
  try {
    console.log(`[${new Date().toISOString()}] 🔍 Checking expired auctions...`);
    
    const response = await axios.post('http://localhost:5000/api/auction/check-expired');
    
    if (response.data.success) {
      const results = response.data.data;
      
      if (results.timeEnded?.length > 0 || results.inactivityEnded?.length > 0 || results.noBidsCancelled?.length > 0) {
        console.log(`✅ Time-ended auctions: ${results.timeEnded?.length || 0}`);
        console.log(`✅ Inactivity-ended auctions: ${results.inactivityEnded?.length || 0}`);
        console.log(`❌ No-bids cancelled: ${results.noBidsCancelled?.length || 0}`);
        
        if (results.timeEnded?.length > 0 || results.inactivityEnded?.length > 0) {
          console.log(`📦 Orders created for completed auctions`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error in cron job:", error.message);
  }
};

// Run immediately on start
checkExpiredAuctions();

// Run every minute
setInterval(checkExpiredAuctions, 60 * 1000);

console.log("🕐 Auction cron job started - checking every minute");

module.exports = checkExpiredAuctions;