import asyncHandler from "express-async-handler";
import Profile from "../models/Profile.js";
import User from "../models/User.js";

// @desc    Create or update user profile
// @route   POST /api/profiles
// @access  Private
const createProfile = asyncHandler(async (req, res) => {
  const { userType } = req.user;
  const profile = await Profile.findOne({ user: req.user._id });

  if (profile) {
    res.status(400);
    throw new Error("Profile already exists. Use update instead.");
  }

  let profileData = {
    user: req.user._id,
    userType,
    ...req.body,
  };

  const newProfile = await Profile.create(profileData);
  res.status(201).json(newProfile);
});

// @desc    Update profile
// @route   PUT /api/profiles
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const profile = await Profile.findOne({ user: req.user._id });

  if (!profile) {
    res.status(404);
    throw new Error("Profile not found");
  }

  // Common fields
  if (req.body.phone) {
    profile.phone = req.body.phone;
  }
  if (req.body.address) {
    profile.address = req.body.address;
  }

  if (profile.userType === "individual") {
    // Individual fields
    if (req.body.fullName) {
      profile.fullName = req.body.fullName;
    }
    if (req.body.personalEmail) {
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.personalEmail)) {
        res.status(400);
        throw new Error("Invalid email format");
      }
      profile.personalEmail = req.body.personalEmail;
      user.email = req.body.personalEmail; // Update main user email
    }
    if (req.body.nationalId) {
      profile.nationalId = req.body.nationalId;
    }

    // Handle document uploads with validation
    if (req.body.nationalIdFront) {
      if (!isValidImageUrl(req.body.nationalIdFront)) {
        res.status(400);
        throw new Error("Invalid national ID front image URL");
      }
      profile.nationalIdFront = req.body.nationalIdFront;
    }
    if (req.body.nationalIdBack) {
      if (!isValidImageUrl(req.body.nationalIdBack)) {
        res.status(400);
        throw new Error("Invalid national ID back image URL");
      }
      profile.nationalIdBack = req.body.nationalIdBack;
    }
  } else if (profile.userType === "business") {
    // Business fields
    if (req.body.contactPersonName) {
      profile.contactPersonName = req.body.contactPersonName;
    }
    if (req.body.companyEmail) {
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.companyEmail)) {
        res.status(400);
        throw new Error("Invalid email format");
      }
      profile.companyEmail = req.body.companyEmail;
      user.email = req.body.companyEmail; // Update main user email
    }

    // Handle commercial registration document (can only be set once)
    if (req.body.commercialRegistrationDoc) {
      if (profile.commercialRegistrationDoc) {
        res.status(400);
        throw new Error(
          "Commercial registration document cannot be modified once uploaded"
        );
      }
      if (!isValidImageUrl(req.body.commercialRegistrationDoc)) {
        res.status(400);
        throw new Error("Invalid commercial registration document URL");
      }
      profile.commercialRegistrationDoc = req.body.commercialRegistrationDoc;
    }

    // Allow setting registration number only if not already set
    if (
      req.body.commercialRegistrationNumber &&
      !profile.commercialRegistrationNumber
    ) {
      profile.commercialRegistrationNumber =
        req.body.commercialRegistrationNumber;
    }
  }

  // Save both user and profile
  await Promise.all([user.save(), profile.save()]);

  // Return updated profile (excluding sensitive fields)
  const response = profile.toObject();
  delete response.__v;
  delete response.createdAt;

  res.json({
    ...response,
    message: "Profile updated successfully",
  });
});

// Helper function to validate image URLs
function isValidImageUrl(url) {
  try {
    new URL(url); // Validates URL structure
    // Check for common image extensions
    return /\.(jpe?g|png|webp|bmp|gif|svg)$/i.test(url.split("?")[0]);
  } catch {
    return false;
  }
}

// @desc    Submit documents for verification
// @route   PUT /api/profiles/submit-documents
// @access  Private
const submitDocuments = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const profile = await Profile.findOne({ user: req.user._id });

  if (!profile) {
    res.status(404);
    throw new Error("Profile not found");
  }

  // Check if documents are already verified
  if (user.isDocumentVerified === "verified") {
    res.status(400);
    throw new Error("Documents are already verified");
  }

  // Check if documents are pending verification
  if (user.isDocumentVerified === "pending") {
    res.status(400);
    throw new Error("Documents are already submitted for verification");
  }

  // Validate documents based on user type
  if (user.userType === "individual") {
    if (
      !req.body.nationalId ||
      !req.body.nationalIdFront ||
      !req.body.nationalIdBack
    ) {
      res.status(400);
      throw new Error(
        "Please provide national ID and front/back images for verification"
      );
    }

    // Validate image URLs
    if (
      !isValidImageUrl(req.body.nationalIdFront) ||
      !isValidImageUrl(req.body.nationalIdBack)
    ) {
      res.status(400);
      throw new Error("Invalid document image URL(s)");
    }

    profile.nationalId = req.body.nationalId;
    profile.nationalIdFront = req.body.nationalIdFront;
    profile.nationalIdBack = req.body.nationalIdBack;
  } else if (user.userType === "business") {
    if (
      !req.body.commercialRegistrationNumber ||
      !req.body.commercialRegistrationDoc
    ) {
      res.status(400);
      throw new Error(
        "Please provide commercial registration number and document for verification"
      );
    }

    // Validate document URL
    if (!isValidImageUrl(req.body.commercialRegistrationDoc)) {
      res.status(400);
      throw new Error("Invalid commercial registration document URL");
    }

    profile.commercialRegistrationNumber =
      req.body.commercialRegistrationNumber;
    profile.commercialRegistrationDoc = req.body.commercialRegistrationDoc;
  } else {
    res.status(400);
    throw new Error("Invalid user type for document submission");
  }

  // Update document verification status
  user.isDocumentVerified = "pending";
  user.documentRejectionReason = undefined;

  await Promise.all([profile.save(), user.save()]);

  res.json({
    message: "Documents submitted for verification",
    isDocumentVerified: user.isDocumentVerified,
  });
});

// @desc    Get document verification status
// @route   GET /api/profiles/verification-status
// @access  Private
const getVerificationStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "isDocumentVerified documentRejectionReason"
  );

  res.json({
    isDocumentVerified: user.isDocumentVerified,
    documentRejectionReason: user.documentRejectionReason,
  });
});
// @desc    Get user profile
// @route   GET /api/profiles
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id });

  if (profile) {
    res.json(profile);
  } else {
    res.status(404);
    throw new Error("Profile not found");
  }
});

export {
  createProfile,
  updateProfile,
  getProfile,
  submitDocuments,
  getVerificationStatus,
};
