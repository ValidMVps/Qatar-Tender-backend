// controllers/questionController.js
import asyncHandler from "express-async-handler";
import Question from "../models/Question.js";
import Tender from "../models/Tender.js";

// @desc    Ask a question about a tender
// @route   POST /api/questions
// @access  Private
const askQuestion = asyncHandler(async (req, res) => {
  const { tender, question } = req.body;

  if (!tender || !question) {
    res.status(400);
    throw new Error("Please provide tender ID and question");
  }

  const tenderDoc = await Tender.findById(tender);
  if (!tenderDoc) {
    res.status(404);
    throw new Error("Tender not found");
  }

  // Check if tender is still active
  if (tenderDoc.status !== "active") {
    res.status(400);
    throw new Error("Cannot ask questions on inactive tender");
  }

  // Check if user is not the tender owner
  if (tenderDoc.postedBy.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("Cannot ask questions on your own tender");
  }

  const newQuestion = await Question.create({
    tender,
    askedBy: req.user._id,
    question,
  });

  res.status(201).json(newQuestion);
});

// @desc    Answer a question
// @route   PUT /api/questions/:id/answer
// @access  Private (tender owner)
const answerQuestion = asyncHandler(async (req, res) => {
  const { answer } = req.body;
  const question = await Question.findById(req.params.id).populate(
    "tender",
    "postedBy"
  );
  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  // Check if user is tender owner
  if (question.tender.postedBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to answer this question");
  }

  // Check if already answered
  if (question.answer) {
    res.status(400);
    throw new Error("Question already answered");
  }

  question.answer = answer;
  question.answeredBy = req.user._id;
  question.answeredAt = new Date();
  await question.save();

  res.json(question);
});

// @desc    Get questions for a tender
// @route   GET /api/questions/tender/:tenderId
// @access  Public
const getQuestionsForTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findById(req.params.tenderId);
  if (!tender) {
    res.status(404);
    throw new Error("Tender not found");
  }

  const questions = await Question.find({ tender: req.params.tenderId })
    .populate("askedBy", "email userType")
    .populate("answeredBy", "email userType")
    .sort({ createdAt: -1 });

  res.json(questions);
});

// @desc    Get my questions
// @route   GET /api/questions/my-questions
// @access  Private
const getMyQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find({ askedBy: req.user._id })
    .populate("tender", "title status")
    .populate("answeredBy", "email userType")
    .sort({ createdAt: -1 });

  res.json(questions);
});

export {
  askQuestion,
  answerQuestion,
  getQuestionsForTender,
  getMyQuestions,
};