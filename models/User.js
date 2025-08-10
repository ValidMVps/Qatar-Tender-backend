// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    password: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["individual", "business", "admin"],
      default: "individual",
    },
    adminType: {
      type: String,
      enum: ["super", "normal", null],
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDocumentVerified: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpires: {
      type: Date,
    },
    documentRejectionReason: {
      type: String,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.index({ email: 1 }, { collation: { locale: "en", strength: 2 } });

const User = mongoose.model("User", userSchema);

export default User;
