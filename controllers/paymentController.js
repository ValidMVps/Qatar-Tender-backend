// controllers/paymentController.js
import asyncHandler from "express-async-handler";
import Payment from "../models/Payment.js";
import Tender from "../models/Tender.js";

// @desc    Process payment for tender posting
// @route   POST /api/payments/process
// @access  Private
const processPayment = asyncHandler(async (req, res) => {
  const { paymentId, paymentMethod, paymentDetails } = req.body;

  const payment = await Payment.findById(paymentId).populate("user", "id");
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  // Check if payment belongs to user
  if (payment.user._id.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to process this payment");
  }

  // Check if payment is already processed
  if (payment.status !== "pending") {
    res.status(400);
    throw new Error("Payment already processed");
  }

  // In a real app, you would integrate with a payment gateway here
  // For demo purposes, we'll just simulate a successful payment

  payment.paymentMethod = paymentMethod;
  payment.paymentDetails = paymentDetails;
  payment.status = "completed";
  await payment.save();

  // Update tender payment status
  if (payment.tender) {
    const tender = await Tender.findById(payment.tender);
    if (tender) {
      tender.paymentStatus = "paid";
      await tender.save();
    }
  }

  res.json({ message: "Payment processed successfully", payment });
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("user", "id");
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  // Check if payment belongs to user or user is admin
  if (
    payment.user._id.toString() !== req.user._id.toString() &&
    req.user.userType !== "admin"
  ) {
    res.status(401);
    throw new Error("Not authorized to view this payment");
  }

  res.json(payment);
});

// @desc    Get my payments
// @route   GET /api/payments/my-payments
// @access  Private
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate("tender", "title")
    .sort({ createdAt: -1 });

  res.json(payments);
});

export { processPayment, getPaymentById, getMyPayments };