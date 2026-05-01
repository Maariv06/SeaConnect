const bcrypt = require("bcryptjs");

async function generateHash() {
  const hash = await bcrypt.hash("123456", 10);
  console.log("Hashed Password:");
  console.log(hash);
}

generateHash();
