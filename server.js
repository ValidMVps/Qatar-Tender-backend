const express = require("express");
const dotenv = require("dotenv");
// const connectDB = require("./config/db");
const cors = require("cors");

dotenv.config();
// connectDB();

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
