// server.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Routes
import userRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import tenderRoutes from "./routes/tenderRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Enable CORS
app.use(cors());

// Body parser middleware
app.use(express.json());

// ES Modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static folder for file uploads
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tenders", tenderRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Tender Management API is running...");
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
