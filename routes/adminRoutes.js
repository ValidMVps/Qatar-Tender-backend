// routes/adminRoutes.js
import express from "express";
import {
  createAdmin,
  getAdmins,
  updateAdminPermissions,
  getPendingVerifications,
  verifyUserDocuments,
  rejectUserDocuments,
  assignAdminTask,
  getMyTasks,
  updateTaskStatus,
  adminLogin,
  adminLogout,
} from "../controllers/adminController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Super admin only routes
router
  .route("/")
  .post(protect, admin, createAdmin)
  .get(protect, admin, getAdmins);

router.route("/:id/permissions").put(protect, admin, updateAdminPermissions);

// Document verification routes (for admins with permission)
router.route("/verifications/pending").get(protect, getPendingVerifications);

router.route("/verifications/:userId/verify").put(protect, verifyUserDocuments);

router.route("/verifications/:userId/reject").put(protect, rejectUserDocuments);

// Task management routes
router.route("/tasks").post(protect, admin, assignAdminTask);

router.route("/tasks/my-tasks").get(protect, getMyTasks);

router.route("/tasks/:id/status").put(protect, updateTaskStatus);

//login
router.post("/login", adminLogin);
router.post("/logout", adminLogout);

export default router;