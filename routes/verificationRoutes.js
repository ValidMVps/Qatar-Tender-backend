// routes/verificationRoutes.js
import express from "express";
import {
  getPendingVerifications,
  verifyUserDocuments,
} from "../controllers/verificationController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/pending", protect, admin, getPendingVerifications);
router.put("/:userId/verify", protect, admin, verifyUserDocuments);

export default router;
