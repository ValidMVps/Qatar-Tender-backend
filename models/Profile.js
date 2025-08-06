import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
      },
      phone: {
        type: String,
        required: true,
      },
      // Individual-specific fields
      fullName: {
        type: String,
        required: function () {
          return this.userType === "individual";
        },
      },
      nationalId: {
        type: String,
        required: function () {
          return this.userType === "individual";
        },
      },
      // Business-specific fields
      companyName: {
        type: String,
        required: function () {
          return this.userType === "business";
        },
      },
      commercialRegistrationNumber: {
        type: String,
        required: function () {
          return this.userType === "business";
        },
      },
      userType: {
        type: String,
        required: true,
        enum: ["individual", "business"],
      },
    },
    { timestamps: true }
  );
const Profile = mongoose.model("Profile", profileSchema);

export default Profile;