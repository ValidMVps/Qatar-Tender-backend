// controllers/reviewController.js
import asyncHandler from "express-async-handler";
import Review from "../models/Review.js";
import Tender from "../models/Tender.js";
import Profile from "../models/Profile.js";

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { tender, reviewedUser, rating, comment } = req.body;

  // Validation
  if (!tender || !reviewedUser || !rating) {
    res.status(400);
    throw new Error("Please provide tender ID, reviewed user ID, and rating");
  }

  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5");
  }

  // Check if tender exists and is completed
  const tenderDoc = await Tender.findById(tender);
  if (!tenderDoc) {
    res.status(404);
    throw new Error("Tender not found");
  }

  if (tenderDoc.status !== "completed") {
    res.status(400);
    throw new Error("Can only review completed tenders");
  }

  // Check if user is the tender owner
  if (tenderDoc.postedBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Only the tender owner can leave a review");
  }

  // Check if reviewed user is the awarded user
  if (tenderDoc.awardedTo.toString() !== reviewedUser.toString()) {
    res.status(400);
    throw new Error("Can only review the user who was awarded the tender");
  }

  // Check if user already reviewed this tender
  const existingReview = await Review.findOne({
    tender,
    reviewer: req.user._id,
  });
  if (existingReview) {
    res.status(400);
    throw new Error("You already reviewed this tender");
  }

  // Create review
  const review = await Review.create({
    tender,
    reviewer: req.user._id,
    reviewedUser,
    rating,
    comment,
  });

  // Update reviewed user's profile rating
  await updateUserRating(reviewedUser);

  res.status(201).json(review);
});

// Helper function to update user rating
const updateUserRating = async (userId) => {
  const reviews = await Review.find({ reviewedUser: userId });
  const ratingCount = reviews.length;
  const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = ratingSum / ratingCount;

  await Profile.findOneAndUpdate(
    { user: userId },
    {
      rating: averageRating,
      ratingCount,
    }
  );
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getReviewsForUser = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewedUser: req.params.userId })
    .populate("reviewer", "email userType")
    .populate("tender", "title")
    .sort({ createdAt: -1 });

  res.json(reviews);
});

// @desc    Get reviews I've received
// @route   GET /api/reviews/my-reviews
// @access  Private
const getMyReceivedReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewedUser: req.user._id })
    .populate("reviewer", "email userType")
    .populate("tender", "title")
    .sort({ createdAt: -1 });

  res.json(reviews);
});

export { createReview, getReviewsForUser, getMyReceivedReviews };