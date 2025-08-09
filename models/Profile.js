// models/Profile.js
import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Common fields
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    userType: {
      type: String,
      required: true,
      enum: ["individual", "business", "admin"],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },

    // Individual-specific fields
    fullName: {
      type: String,
    },
    nationalId: {
      type: String,
    },
    nationalIdFront: {
      type: String, // URL to the document
    },
    nationalIdBack: {
      type: String, // URL to the document
    },
    personalEmail: {
      type: String,
    },

    // Business-specific fields
    companyName: {
      type: String,
    },
    companyEmail: {
      type: String,
    },
    contactPersonName: {
      type: String,
    },
    commercialRegistrationNumber: {
      type: String,
    },
    commercialRegistrationDoc: {
      type: String, // URL to the document
    },

    // Admin-specific fields (for profile completeness)
    adminName: {
      type: String,
    },
    adminPosition: {
      type: String,
    },
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
