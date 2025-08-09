// models/AdminTask.js
import mongoose from "mongoose";

const adminTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskType: {
      type: String,
      required: true,
      enum: [
        "document_verification",
        "content_moderation",
        "user_support",
        "other",
      ],
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "rejected"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
    completionNotes: {
      type: String,
    },
  },
  { timestamps: true }
);

const AdminTask = mongoose.model("AdminTask", adminTaskSchema);

export default AdminTask;
