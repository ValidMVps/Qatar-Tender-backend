// controllers/adminController.js
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import AdminTask from "../models/AdminTask.js";
import generateToken from "../utils/generateToken.js";

// @desc    Create a new admin
// @route   POST /api/admin/create
// @access  Private/Super Admin
const createAdmin = asyncHandler(async (req, res) => {
  const { email, password, adminType, permissions, ...profileData } = req.body;

  // Only super admin can create other admins
  if (req.user.adminType !== "super") {
    res.status(403);
    throw new Error("Only super admin can create admin accounts");
  }

  if (!email || !password || !adminType) {
    res.status(400);
    throw new Error("Please provide email, password and admin type");
  }

  // Validate admin type
  if (!["super", "normal"].includes(adminType)) {
    res.status(400);
    throw new Error("Invalid admin type");
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Create admin user
  const user = await User.create({
    email,
    password,
    userType: "admin",
    adminType,
    permissions: adminType === "super" ? ["all"] : permissions || [],
    isVerified: true, // Admin accounts are auto-verified
    isDocumentVerified: "verified", // Admin accounts are auto-document verified
  });

  // Create admin profile
  const profile = await Profile.create({
    user: user._id,
    userType: "admin",
    ...profileData,
  });

  res.status(201).json({
    _id: user._id,
    email: user.email,
    adminType: user.adminType,
    permissions: user.permissions,
    profile,
  });
});

// @desc    Get all admins
// @route   GET /api/admin
// @access  Private/Super Admin
const getAdmins = asyncHandler(async (req, res) => {
  // Only super admin can view all admins
  if (req.user.adminType !== "super") {
    res.status(403);
    throw new Error("Only super admin can view admin accounts");
  }

  const admins = await User.find({ userType: "admin" })
    .select("-password")
    .populate("profile");

  res.json(admins);
});

// @desc    Update admin permissions
// @route   PUT /api/admin/:id/permissions
// @access  Private/Super Admin
const updateAdminPermissions = asyncHandler(async (req, res) => {
  // Only super admin can update permissions
  if (req.user.adminType !== "super") {
    res.status(403);
    throw new Error("Only super admin can update permissions");
  }

  const { permissions } = req.body;
  const admin = await User.findById(req.params.id);

  if (!admin || admin.userType !== "admin") {
    res.status(404);
    throw new Error("Admin not found");
  }

  // Cannot modify super admin permissions
  if (admin.adminType === "super") {
    res.status(400);
    throw new Error("Cannot modify super admin permissions");
  }

  admin.permissions = permissions;
  await admin.save();

  res.json({
    _id: admin._id,
    email: admin.email,
    adminType: admin.adminType,
    permissions: admin.permissions,
  });
});

// @desc    Get pending document verifications
// @route   GET /api/admin/verifications/pending
// @access  Private/Admin with verification permission
const getPendingVerifications = asyncHandler(async (req, res) => {
  // Check if admin has verification permission
  if (
    req.user.adminType !== "super" &&
    !req.user.permissions.includes("document_verification")
  ) {
    res.status(403);
    throw new Error("Not authorized for document verification");
  }

  const pendingUsers = await User.find({
    isDocumentVerified: "pending",
    userType: { $in: ["individual", "business"] },
  }).populate("profile");

  res.json(pendingUsers);
});

// @desc    Verify user documents
// @route   PUT /api/admin/verifications/:userId/verify
// @access  Private/Admin with verification permission
const verifyUserDocuments = asyncHandler(async (req, res) => {
  // Check if admin has verification permission
  if (
    req.user.adminType !== "super" &&
    !req.user.permissions.includes("document_verification")
  ) {
    res.status(403);
    throw new Error("Not authorized for document verification");
  }

  const user = await User.findById(req.params.userId);
  if (!user || !["individual", "business"].includes(user.userType)) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.isDocumentVerified !== "pending") {
    res.status(400);
    throw new Error("User documents are not pending verification");
  }

  user.isDocumentVerified = "verified";
  await user.save();

  // Create a task completion record
  await AdminTask.create({
    title: "Document Verification",
    description: `Verified documents for user ${user.email}`,
    assignedBy: req.user._id,
    assignedTo: req.user._id,
    taskType: "document_verification",
    relatedUser: user._id,
    status: "completed",
    completionNotes: "Documents verified successfully",
  });

  res.json({ message: "User documents verified successfully", user });
});

// @desc    Reject user documents
// @route   PUT /api/admin/verifications/:userId/reject
// @access  Private/Admin with verification permission
const rejectUserDocuments = asyncHandler(async (req, res) => {
  // Check if admin has verification permission
  if (
    req.user.adminType !== "super" &&
    !req.user.permissions.includes("document_verification")
  ) {
    res.status(403);
    throw new Error("Not authorized for document verification");
  }

  const { rejectionReason } = req.body;
  if (!rejectionReason) {
    res.status(400);
    throw new Error("Please provide a rejection reason");
  }

  const user = await User.findById(req.params.userId);
  if (!user || !["individual", "business"].includes(user.userType)) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.isDocumentVerified !== "pending") {
    res.status(400);
    throw new Error("User documents are not pending verification");
  }

  user.isDocumentVerified = "rejected";
  user.documentRejectionReason = rejectionReason;
  await user.save();

  // Create a task completion record
  await AdminTask.create({
    title: "Document Rejection",
    description: `Rejected documents for user ${user.email}`,
    assignedBy: req.user._id,
    assignedTo: req.user._id,
    taskType: "document_verification",
    relatedUser: user._id,
    status: "completed",
    completionNotes: `Documents rejected. Reason: ${rejectionReason}`,
  });

  res.json({ message: "User documents rejected", user });
});

// @desc    Assign task to admin
// @route   POST /api/admin/tasks
// @access  Private/Super Admin
const assignAdminTask = asyncHandler(async (req, res) => {
  // Only super admin can assign tasks
  if (req.user.adminType !== "super") {
    res.status(403);
    throw new Error("Only super admin can assign tasks");
  }

  const {
    assignedTo,
    title,
    description,
    taskType,
    relatedUser,
    priority,
    dueDate,
  } = req.body;

  if (!assignedTo || !title || !taskType) {
    res.status(400);
    throw new Error("Please provide assignedTo, title and taskType");
  }

  // Check if assignedTo is an admin
  const assignedToUser = await User.findById(assignedTo);
  if (!assignedToUser || assignedToUser.userType !== "admin") {
    res.status(400);
    throw new Error("Can only assign tasks to admin users");
  }

  // Check if related user exists if provided
  if (relatedUser) {
    const userExists = await User.findById(relatedUser);
    if (!userExists) {
      res.status(404);
      throw new Error("Related user not found");
    }
  }

  const task = await AdminTask.create({
    title,
    description,
    assignedBy: req.user._id,
    assignedTo,
    taskType,
    relatedUser,
    priority: priority || "medium",
    dueDate,
    status: "pending",
  });

  res.status(201).json(task);
});

// @desc    Get my assigned tasks
// @route   GET /api/admin/tasks/my-tasks
// @access  Private/Admin
const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await AdminTask.find({ assignedTo: req.user._id })
    .populate("assignedBy", "email")
    .populate("relatedUser", "email userType")
    .sort({ createdAt: -1 });

  res.json(tasks);
});

// @desc    Update task status
// @route   PUT /api/admin/tasks/:id/status
// @access  Private/Admin
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, completionNotes } = req.body;

  const task = await AdminTask.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // Check if current user is assigned to this task
  if (task.assignedTo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this task");
  }

  task.status = status;
  if (completionNotes) task.completionNotes = completionNotes;
  await task.save();

  res.json(task);
});

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, userType: "admin" });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      email: user.email,
      adminType: user.adminType,
      permissions: user.permissions,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const adminLogout = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
});

export {
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
};
