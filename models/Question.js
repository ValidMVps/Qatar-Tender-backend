// models/Question.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    tender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tender",
      required: true,
    },
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      trim: true,
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    answeredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);

export default Question;