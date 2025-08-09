// routes/reviewRoutes.js
import express from "express";
import {
  createReview,
  getReviewsForUser,
  getMyReceivedReviews,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .post(protect, createReview);

router.route("/user/:userId")
  .get(getReviewsForUser);

router.route("/my-reviews")
  .get(protect, getMyReceivedReviews);

export default router;