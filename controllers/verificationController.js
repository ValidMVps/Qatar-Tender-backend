// controllers/verificationController.js
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Profile from "../models/Profile.js";

// @desc    Get all users with pending document verification
// @route   GET /api/verification/pending
// @access  Private/Admin
const getPendingVerifications = asyncHandler(async (req, res) => {
  // Check admin permissions
  if (
    req.user.adminType !== "super" &&
    !req.user.permissions.includes("verify_documents")
  ) {
    res.status(403);
    throw new Error("Not authorized to verify documents");
  }

  const users = await User.find({
    userType: { $in: ["individual", "business"] },
    isDocumentVerified: "pending",
  }).select("-password");

  // Get profiles with documents
  const profiles = await Profile.find({
    user: { $in: users.map((u) => u._id) },
  });

  // Combine user and profile data
  const result = users.map((user) => {
    const profile = profiles.find(
      (p) => p.user.toString() === user._id.toString()
    );
    return {
      ...user._doc,
      documents: {
        nationalId: user.userType === "individual" ? profile?.nationalId : null,
        nationalIdFront:
          user.userType === "individual" ? profile?.nationalIdFront : null,
        nationalIdBack:
          user.userType === "individual" ? profile?.nationalIdBack : null,
        commercialRegistrationNumber:
          user.userType === "business"
            ? profile?.commercialRegistrationNumber
            : null,
        commercialRegistrationDoc:
          user.userType === "business"
            ? profile?.commercialRegistrationDoc
            : null,
      },
    };
  });

  res.json(result);
});

// @desc    Verify user documents
// @route   PUT /api/verification/:userId/verify
// @access  Private/Admin
const verifyUserDocuments = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  // Check admin permissions
  if (
    req.user.adminType !== "super" &&
    !req.user.permissions.includes("verify_documents")
  ) {
    res.status(403);
    throw new Error("Not authorized to verify documents");
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

  if (status === "verified") {
    user.isDocumentVerified = "verified";
    user.documentRejectionReason = undefined;
  } else if (status === "rejected") {
    if (!rejectionReason) {
      res.status(400);
      throw new Error("Rejection reason is required");
    }
    user.isDocumentVerified = "rejected";
    user.documentRejectionReason = rejectionReason;
  } else {
    res.status(400);
    throw new Error("Invalid status");
  }

  await user.save();

  // TODO: Send email notification to user about verification status

  res.json({
    message: `Documents ${status}`,
    userId: user._id,
    status: user.isDocumentVerified,
    rejectionReason: user.documentRejectionReason,
  });
});

export { getPendingVerifications, verifyUserDocuments };