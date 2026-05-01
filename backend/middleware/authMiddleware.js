const jwt = require("jsonwebtoken");

exports.auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json("No token");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json("Invalid token");
  }
};

exports.roleCheck = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json("Access denied");
    }
    next();
  };
};
