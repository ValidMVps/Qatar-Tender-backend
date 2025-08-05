import express from "express";
import dotenv from "dotenv";
import connectDB from './config/db.js';
import cors from "cors";

dotenv.config();
connectDB();

const app = express(); 
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
// const userRoutes = require("./routes/userRoutes");
// app.use("/api/users", userRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
