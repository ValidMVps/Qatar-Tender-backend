import express from "express";
import {
  createProfile,
  updateProfile,
  getProfile,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .post(protect, createProfile)
  .put(protect, updateProfile)
  .get(protect, getProfile);

export default router;