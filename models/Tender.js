// models/Tender.js
import mongoose from "mongoose";

const tenderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please use a valid email address"],
    },
    image: {
      type: String,
    },
    estimatedBudget: {
      type: Number,
      required: true,
      min: [0, "Budget cannot be negative"],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "awarded", "closed", "rejected", "completed"],
      default: "active",
    },
    deadline: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Deadline must be in the future",
      },
    },
    awardedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Tender = mongoose.model("Tender", tenderSchema);

export default Tender;
