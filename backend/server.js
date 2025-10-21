import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import examRoutes from "./routes/examRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import trainingRoutes from "./routes/trainingRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/exams", examRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/schedule", scheduleRoutes);

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));
