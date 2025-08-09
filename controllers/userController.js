import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import generateToken from "../utils/generateToken.js";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "../utils/emailSender.js";

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, userType, phone, ...rest } = req.body;

  // Validation based on user type
  if (userType === "individual") {
    if (!rest.fullName) {
      res.status(400);
      throw new Error("Please provide full name");
    }
  } else if (userType === "business") {
    if (!rest.companyName) {
      res.status(400);
      throw new Error("Please provide company name");
    }
  }

  if (!email || !password || !phone) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Generate verification token
  const verificationToken = generateVerificationToken();
  const verificationTokenExpires = new Date();
  verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

  // Log the token to console
  console.log("====================================");
  console.log("NEW USER REGISTRATION");
  console.log("Email:", email);
  console.log("Verification Token:", verificationToken);
  console.log(
    "Verification URL:",
    `${process.env.BASE_URL}/api/users/verify-email/${verificationToken}`
  );
  console.log("Token Expires:", verificationTokenExpires);
  console.log("====================================");

  // Create user
  const user = await User.create({
    email,
    password,
    userType,
    verificationToken,
    verificationTokenExpires,
  });

  if (user) {
    // Create profile with minimal data
    const profileData = {
      user: user._id,
      userType,
      phone,
    };

    if (userType === "individual") {
      profileData.fullName = rest.fullName;
    } else if (userType === "business") {
      profileData.companyName = rest.companyName;
      profileData.companyEmail = email;
    }

    await Profile.create(profileData);

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.verificationToken);
      console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }

    res.status(201).json({
      _id: user._id,
      email: user.email,
      userType: user.userType,
      isVerified: user.isVerified,
      message:
        "Registration successful. Please check your email for verification.",
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error("Email is already verified");
  }

  // Generate new token
  const verificationToken = generateVerificationToken();
  const verificationTokenExpires = new Date();
  verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

  user.verificationToken = verificationToken;
  user.verificationTokenExpires = verificationTokenExpires;
  await user.save();

  await sendVerificationEmail(user.email, user.verificationToken);

  res.json({
    message: "Verification email resent successfully",
  });
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
// controllers/userController.js
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // Skip email verification check for admin users
    if (user.userType !== "admin" && !user.isVerified) {
      res.status(401);
      throw new Error("Please verify your email before logging in");
    }

    res.json({
      _id: user._id,
      email: user.email,
      userType: user.userType,
      adminType: user.adminType,
      isVerified: user.isVerified,
      isDocumentVerified: user.isDocumentVerified,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Verify email
// @route   GET /api/users/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired verification token");
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.json({
    message: "Email verified successfully",
    _id: user._id,
    email: user.email,
    isVerified: user.isVerified,
  });
});

export {
  registerUser,
  loginUser,
  getUserProfile,
  resendVerificationEmail,
  verifyEmail,
};
