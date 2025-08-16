// routes/tenderRoutes.js
import express from "express";
import {
  createTender,
  getTenders,
  getTenderById,
  updateTender,
  updateTenderStatus,
  awardTender,
  deleteTender,
} from "../controllers/tenderController.js";
import { protect, verified } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, verified, createTender).get(getTenders);

router
  .route("/:id")
  .get(getTenderById)
  .put(protect, updateTender)
  .delete(protect, deleteTender);

router.route("/:id/status").put(protect, updateTenderStatus);

router.route("/:id/award").put(protect, awardTender);

export default router;
