// routes/paymentRoutes.js
import express from "express";
import {
  processPayment,
  getPaymentById,
  getMyPayments,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/process")
  .post(protect, processPayment);

router.route("/:id")
  .get(protect, getPaymentById);

router.route("/my-payments")
  .get(protect, getMyPayments);

export default router;