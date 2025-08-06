import asyncHandler from "express-async-handler";
import Profile from "../models/Profile.js";

// @desc    Create or update user profile
// @route   POST /api/profiles
// @access  Private
const createProfile = asyncHandler(async (req, res) => {
  const { userType } = req.user;

  let profileData = {
    user: req.user._id,
    phone: req.body.phone,
    userType,
  };

  if (userType === "individual") {
    profileData.fullName = req.body.fullName;
    profileData.nationalId = req.body.nationalId || undefined;
  } else if (userType === "business") {
    profileData.companyName = req.body.companyName;
    profileData.commercialRegistrationNumber =
      req.body.commercialRegistrationNumber || undefined;
  }

  const profile = await Profile.findOneAndUpdate(
    { user: req.user._id },
    profileData,
    { new: true, upsert: true }
  );

  res.status(201).json(profile);
});

// @desc    Update profile
// @route   PUT /api/profiles
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id });

  if (profile) {
    profile.phone = req.body.phone || profile.phone;

    if (profile.userType === "individual") {
      profile.fullName = req.body.fullName || profile.fullName;
      profile.nationalId = req.body.nationalId || profile.nationalId;
    } else if (profile.userType === "business") {
      profile.companyName = req.body.companyName || profile.companyName;
      profile.commercialRegistrationNumber =
        req.body.commercialRegistrationNumber ||
        profile.commercialRegistrationNumber;
    }

    const updatedProfile = await profile.save();
    res.json(updatedProfile);
  } else {
    res.status(404);
    throw new Error("Profile not found");
  }
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

export { createProfile, updateProfile, getProfile };
