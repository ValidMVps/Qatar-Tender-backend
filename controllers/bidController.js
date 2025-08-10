// controllers/bidController.js
import asyncHandler from "express-async-handler";
import Bid from "../models/Bid.js";
import Tender from "../models/Tender.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import { v4 as uuidv4 } from "uuid";

// @desc    Create a new bid
// @route   POST /api/bids
// @access  Private (business users only)
const createBid = asyncHandler(async (req, res) => {
  const { tender, amount, description } = req.body;

  // Validation
  if (!tender || !amount || !description) {
    res.status(400);
    throw new Error("Please fill all required fields");
  }

  // Check if user is a business user
  if (req.user.userType !== "business") {
    res.status(403);
    throw new Error("Only business users can place bids");
  }

  // Check if tender exists and is active
  const tenderDoc = await Tender.findById(tender);
  if (!tenderDoc) {
    res.status(404);
    throw new Error("Tender not found");
  }

  if (tenderDoc.status !== "active") {
    res.status(400);
    throw new Error("Cannot bid on inactive tender");
  }

  // Check if deadline has passed
  if (new Date(tenderDoc.deadline) < new Date()) {
    res.status(400);
    throw new Error("Bidding deadline has passed");
  }

  // Check if user is not the tender owner
  if (tenderDoc.postedBy.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("Cannot bid on your own tender");
  }

  // Check if user already has a bid for this tender
  const existingBid = await Bid.findOne({
    tender,
    bidder: req.user._id,
  });
  if (existingBid) {
    res.status(400);
    throw new Error("You already have a bid for this tender");
  }

  // Create bid with pending payment status
  const bid = await Bid.create({
    tender,
    bidder: req.user._id,
    amount,
    description,
    paymentStatus: "pending",
    paymentAmount: process.env.BID_PAYMENT_FEE || 100,
  });

  // Generate payment reference
  const payment = await Payment.create({
    user: req.user._id,
    tender: tender,
    bid: bid._id,
    amount: bid.paymentAmount,
    paymentMethod: "pending",
    transactionId: uuidv4(),
    status: "pending",
  });

  // Update bid with payment ID
  bid.paymentId = payment._id;
  await bid.save();

  res.status(201).json({
    ...bid._doc,
    paymentId: payment._id,
    paymentReference: payment.transactionId,
  });
});

// @desc    Process bid payment
// @route   POST /api/bids/:id/process-payment
// @access  Private
const processBidPayment = asyncHandler(async (req, res) => {
  const { paymentMethod, paymentDetails } = req.body;
  const bid = await Bid.findById(req.params.id);

  if (!bid) {
    res.status(404);
    throw new Error("Bid not found");
  }

  // Check if bid belongs to user
  if (bid.bidder.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to process this payment");
  }

  // Check if payment is already processed
  if (bid.paymentStatus !== "pending") {
    res.status(400);
    throw new Error("Payment already processed");
  }

  // Update payment record
  const payment = await Payment.findById(bid.paymentId);
  if (!payment) {
    res.status(404);
    throw new Error("Payment record not found");
  }

  // In a real app, you would integrate with a payment gateway here
  // For demo purposes, we'll just simulate a successful payment
  payment.paymentMethod = paymentMethod;
  payment.paymentDetails = paymentDetails;
  payment.status = "completed";
  await payment.save();

  // Update bid payment status
  bid.paymentStatus = "paid";
  await bid.save();

  res.json({ message: "Bid payment processed successfully", bid });
});

// @desc    Get bids for a tender
// @route   GET /api/bids/tender/:tenderId
// @access  Private (tender owner or admin)
const getBidsForTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findById(req.params.tenderId);
  if (!tender) {
    res.status(404);
    throw new Error("Tender not found");
  }

  // Check if user is tender owner or admin
  if (
    tender.postedBy.toString() !== req.user._id.toString() &&
    req.user.userType !== "admin"
  ) {
    res.status(401);
    throw new Error("Not authorized to view these bids");
  }

  const bids = await Bid.find({
    tender: req.params.tenderId,
    paymentStatus: "paid",
  })
    .populate("bidder", "email userType")
    .sort({ amount: 1 });

  res.json(bids);
});

// @desc    Get user's bids
// @route   GET /api/bids/my-bids
// @access  Private
const getMyBids = asyncHandler(async (req, res) => {
  const bids = await Bid.find({ bidder: req.user._id })
    .populate("tender", "title status deadline")
    .sort({ createdAt: -1 });

  res.json(bids);
});

// @desc    Update bid status
// @route   PUT /api/bids/:id/status
// @access  Private (tender owner or admin)
const updateBidStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const bid = await Bid.findById(req.params.id).populate("tender", "postedBy");
  if (!bid) {
    res.status(404);
    throw new Error("Bid not found");
  }

  // Check if user is tender owner or admin
  if (
    bid.tender.postedBy.toString() !== req.user._id.toString() &&
    req.user.userType !== "admin"
  ) {
    res.status(401);
    throw new Error("Not authorized to update this bid");
  }

  // Validate status
  const validStatuses = ["submitted", "under_review", "rejected", "accepted"];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid bid status");
  }

  bid.status = status;
  await bid.save();

  res.json(bid);
});

// @desc    Delete bid
// @route   DELETE /api/bids/:id
// @access  Private (bid owner or admin)
const deleteBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id);
  if (!bid) {
    res.status(404);
    throw new Error("Bid not found");
  }

  // Check if user is bid owner or admin
  if (
    bid.bidder.toString() !== req.user._id.toString() &&
    req.user.userType !== "admin"
  ) {
    res.status(401);
    throw new Error("Not authorized to delete this bid");
  }

  // Check if tender is still active
  const tender = await Tender.findById(bid.tender);
  if (tender.status !== "active") {
    res.status(400);
    throw new Error("Cannot delete bid for inactive tender");
  }

  await bid.remove();
  res.json({ message: "Bid removed" });
});

export {
  createBid,
  processBidPayment,
  getBidsForTender,
  getMyBids,
  updateBidStatus,
  deleteBid,
};
