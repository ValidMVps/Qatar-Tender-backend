// middleware/authMiddleware.js
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

const admin = (req, res, next) => {
  if (
    req.user &&
    req.user.userType === "admin" &&
    req.user.adminType === "super"
  ) {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as a super admin");
  }
};

// Middleware to check document verification
const verified = (req, res, next) => {
  if (req.user && req.user.isDocumentVerified === "verified") {
    next();
  } else {
    res.status(401);
    throw new Error("Account documents not verified");
  }
};

export { protect, admin, verified };
