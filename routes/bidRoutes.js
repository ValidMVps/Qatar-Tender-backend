// routes/bidRoutes.js
import express from "express";
import {
  createBid,
  processBidPayment,
  getBidsForTender,
  getMyBids,
  updateBidStatus,
  deleteBid,
} from "../controllers/bidController.js";
import { protect, verified } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, verified, createBid);

router.route("/:id/process-payment").post(protect, processBidPayment);

router.route("/tender/:tenderId").get(protect, getBidsForTender);

router.route("/my-bids").get(protect, getMyBids);

router.route("/:id/status").put(protect, updateBidStatus);

router.route("/:id").delete(protect, deleteBid);

export default router;
