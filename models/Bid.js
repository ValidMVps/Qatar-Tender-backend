// models/Bid.js
import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    tender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tender",
      required: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["submitted", "under_review", "rejected", "accepted"],
      default: "submitted",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentAmount: {
      type: Number,
      default: process.env.BID_PAYMENT_FEE || 100, // Default fee if not set
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
  },
  { timestamps: true }
);

const Bid = mongoose.model("Bid", bidSchema);

export default Bid;
