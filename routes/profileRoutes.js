// routes/profileRoutes.js
import express from "express";
import {
  createProfile,
  updateProfile,
  getProfile,
  submitDocuments,
  getVerificationStatus,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .post(protect, createProfile)
  .put(protect, updateProfile)
  .get(protect, getProfile);

// Document verification routes
router.route("/submit-documents").put(protect, submitDocuments);

router.route("/verification-status").get(protect, getVerificationStatus);

export default router;
