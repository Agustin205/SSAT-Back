const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
  console.log(authHeader,'autorizacionnfdksjnfjsndjkfdnskj')
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided." });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ message: "Token error." });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ message: "Token malformatted." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("jwt.verify error:", err);
      return res.status(401).json({ message: "Invalid token." });
    }

    req.userId = decoded.userId;
    console.log("userId from middleware:", req.userId);
    return next();
  });
  } catch (error) {
    console.error("Error creating Sequelize instance:", error);
  }
};

module.exports = authMiddleware;
