// models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tender",
    },
    bid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["credit_card", "bank_transfer", "wallet", "pending"],
      default: "pending",
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentDetails: {
      type: Object,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
