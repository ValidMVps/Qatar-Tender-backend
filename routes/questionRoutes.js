// routes/questionRoutes.js
import express from "express";
import {
  askQuestion,
  answerQuestion,
  getQuestionsForTender,
  getMyQuestions,
} from "../controllers/questionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .post(protect, askQuestion);

router.route("/:id/answer")
  .put(protect, answerQuestion);

router.route("/tender/:tenderId")
  .get(getQuestionsForTender);

router.route("/my-questions")
  .get(protect, getMyQuestions);

export default router;