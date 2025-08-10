// controllers/tenderController.js
import asyncHandler from "express-async-handler";
import Tender from "../models/Tender.js";
import Category from "../models/Category.js";
import Payment from "../models/Payment.js";
import { v4 as uuidv4 } from "uuid";

// @desc    Create a new tender
// @route   POST /api/tenders
// @access  Private
const createTender = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    location,
    contactEmail,
    image,
    estimatedBudget,
    deadline,
  } = req.body;

  if (
    !title ||
    !description ||
    !category ||
    !location ||
    !contactEmail ||
    !estimatedBudget ||
    !deadline
  ) {
    res.status(400);
    throw new Error("Please fill all required fields");
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists || !categoryExists.isActive) {
    res.status(400);
    throw new Error("Invalid category");
  }

  const deadlineDate = new Date(deadline);
  if (deadlineDate <= new Date()) {
    res.status(400);
    throw new Error("Deadline must be in the future");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(contactEmail)) {
    res.status(400);
    throw new Error("Please provide a valid contact email");
  }

  // Create tender
  const tender = await Tender.create({
    title,
    description,
    category,
    location,
    contactEmail,
    image,
    estimatedBudget,
    deadline: deadlineDate,
    postedBy: req.user._id,
  });

  res.status(201).json(tender);
});

// @desc    Get all tenders
// @route   GET /api/tenders
// @access  Public
const getTenders = asyncHandler(async (req, res) => {
  const { status, category, search } = req.query;
  const query = {};

  if (status) query.status = status;
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  const tenders = await Tender.find(query)
    .populate("category", "name")
    .populate("postedBy", "email userType")
    .sort({ createdAt: -1 });

  res.json(tenders);
});

// @desc    Get tender by ID
// @route   GET /api/tenders/:id
// @access  Public
const getTenderById = asyncHandler(async (req, res) => {
  const tender = await Tender.findById(req.params.id)
    .populate("category", "name description")
    .populate("postedBy", "email userType")
    .populate("awardedTo", "email userType");

  if (!tender) {
    res.status(404);
    throw new Error("Tender not found");
  }

  res.json(tender);
});

// @desc    Update tender
// @route   PUT /api/tenders/:id
// @access  Private (only owner or admin)
const updateTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findById(req.params.id);
  if (!tender) {
    res.status(404);
    throw new Error("Tender not found");
  }

  // Check if user is owner or admin
  if (
    tender.postedBy.toString() !== req.user._id.toString() &&
    req.user.userType !== "admin"
  ) {
    res.status(401);
    throw new Error("Not authorized to update this tender");
  }

  // Only allow certain fields to be updated
  const {
    title,
    description,
    location,
    contactEmail,
    image,
    estimatedBudget,
    deadline,
  } = req.body;

  if (title) tender.title = title;
  if (description) tender.description = description;

  if (location) tender.location = location;

  if (contactEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      res.status(400);
      throw new Error("Please provide a valid contact email");
    }
    tender.contactEmail = contactEmail;
  }

  if (image) tender.image = image;

  if (estimatedBudget) {
    if (isNaN(estimatedBudget) || estimatedBudget <= 0) {
      res.status(400);
      throw new Error("Estimated budget must be a positive number");
    }
    tender.estimatedBudget = estimatedBudget;
  }

  if (deadline) {
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      res.status(400);
      throw new Error("Deadline must be in the future");
    }
    tender.deadline = deadlineDate;
  }

  const updatedTender = await tender.save();
  res.json(updatedTender);
});

// @desc    Update tender status
// @route   PUT /api/tenders/:id/status
// @access  Private (only owner or admin)
const updateTenderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const tender = await Tender.findById(req.params.id);
  if (!tender) {
    res.status(404);
    throw new Error("Tender not found");
  }

  // Check if user is owner or admin
  if (
    tender.postedBy.toString() !== req.user._id.toString() &&
    req.user.userType !== "admin"
  ) {
    res.status(401);
    throw new Error("Not authorized to update this tender");
  }

  // Validate status transition
  const validTransitions = {
    active: ["awarded", "closed", "rejected"],
    awarded: ["completed"],
    closed: [],
    rejected: [],
    completed: [],
  };

  if (!validTransitions[tender.status].includes(status)) {
    res.status(400);
    throw new Error(
      `Invalid status transition from ${tender.status} to ${status}`
    );
  }

  tender.status = status;
  await tender.save();

  res.json({ message: "Tender status updated successfully", tender });
});

// @desc    Award tender to a bidder
// @route   PUT /api/tenders/:id/award
// @access  Private (only owner)
const awardTender = asyncHandler(async (req, res) => {
  const { bidId } = req.body;
  const tender = await Tender.findById(req.params.id);
  if (!tender) {
    res.status(404);
    throw new Error("Tender not found");
  }

  // Check if user is owner
  if (tender.postedBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to award this tender");
  }

  // Check if tender is active
  if (tender.status !== "active") {
    res.status(400);
    throw new Error("Tender must be active to be awarded");
  }

  // Check if bid exists and belongs to this tender
  const bid = await Bid.findById(bidId).populate("bidder", "id");
  if (!bid || bid.tender.toString() !== tender._id.toString()) {
    res.status(404);
    throw new Error("Bid not found for this tender");
  }

  tender.awardedTo = bid.bidder._id;
  tender.status = "awarded";
  await tender.save();

  // Update bid status
  bid.status = "accepted";
  await bid.save();

  // Reject all other bids
  await Bid.updateMany(
    {
      tender: tender._id,
      _id: { $ne: bid._id },
    },
    { status: "rejected" }
  );

  res.json({ message: "Tender awarded successfully", tender });
});

// @desc    Delete tender
// @route   DELETE /api/tenders/:id
// @access  Private (only owner or admin)
const deleteTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findById(req.params.id);
  if (!tender) {
    res.status(404);
    throw new Error("Tender not found");
  }

  // Check if user is owner or admin
  if (
    tender.postedBy.toString() !== req.user._id.toString() &&
    req.user.userType !== "admin"
  ) {
    res.status(401);
    throw new Error("Not authorized to delete this tender");
  }

  // Check if tender has bids
  const bidCount = await Bid.countDocuments({ tender: tender._id });
  if (bidCount > 0) {
    res.status(400);
    throw new Error("Cannot delete tender as it has bids");
  }

  await tender.remove();
  res.json({ message: "Tender removed" });
});

export {
  createTender,
  getTenders,
  getTenderById,
  updateTender,
  updateTenderStatus,
  awardTender,
  deleteTender,
};
