// utils/seedAdmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import bcrypt from "bcryptjs";

// Load environment variables from .env file
dotenv.config();

const seedSuperAdmin = async () => {
  try {
    console.log("Connecting to MongoDB...");
    console.log("MONGO_URI:", process.env.MONGO_URI);

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const email = process.env.SUPER_ADMIN_EMAIL || "superadmin@example.com";
    const password = process.env.SUPER_ADMIN_PASSWORD || "superadmin123";

    console.log(`Creating super admin with email: ${email}`);

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log("Super admin already exists");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create super admin user
    const user = await User.create({
      email,
      password: hashedPassword,
      userType: "admin",
      adminType: "super",
      isVerified: true,
      isDocumentVerified: "verified",
      permissions: ["all"],
    });

    // Create admin profile
    await Profile.create({
      user: user._id,
      userType: "admin",
      adminName: "Super Admin",
      adminPosition: "System Administrator",
      phone: "+1234567890",
    });

    console.log("Super admin created successfully");
    console.log(`Email: ${email}`);
    console.log(`Initial Password: ${password}`);
    console.log("Please change this password immediately after first login!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding super admin:", error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedSuperAdmin();
