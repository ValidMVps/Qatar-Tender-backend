import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const resetAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = process.env.SUPER_ADMIN_EMAIL;
    const newPassword = process.env.SUPER_ADMIN_NEWPASSWORD;
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Super admin not found");
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    console.log("Password reset successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting password:", error);
    process.exit(1);
  }
};

resetAdminPassword();