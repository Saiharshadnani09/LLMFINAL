// routes/examRoutes.js
import express from "express";
import Exam from "../models/Exam.js";

const router = express.Router();

// 🔹 Create new exam (with optional scheduling)
router.post("/", async (req, res) => {
  try {
    const { title, questions, startTime, endTime, duration, examType } = req.body;

    const exam = new Exam({ title, questions, startTime, endTime, duration, examType });
    await exam.save();

    res.status(201).json({ message: "Exam created successfully ✅", exam });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// 🔹 Get all exams
router.get("/", async (req, res) => {
  try {
    const exams = await Exam.find();
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// 🔹 Get exam by ID
router.get("/:id", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// 🔹 Update exam (title, schedule, questions)
router.put("/:id", async (req, res) => {
  try {
    const { title, startTime, endTime, questions, duration, examType } = req.body;
    // Prevent editing after start time
    const existing = await Exam.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Exam not found" });
    if (existing.startTime && new Date(existing.startTime) <= new Date()) {
      return res.status(400).json({ message: "Cannot edit: exam already started" });
    }
    existing.title = title ?? existing.title;
    existing.startTime = startTime ?? existing.startTime;
    existing.endTime = endTime ?? existing.endTime;
    if (typeof duration !== "undefined") existing.duration = duration;
    if (examType) existing.examType = examType;
    if (Array.isArray(questions)) existing.questions = questions;
    const updated = await existing.save();
    res.json({ message: "Exam updated ✅", exam: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// 🔹 Delete exam
router.delete("/:id", async (req, res) => {
  try {
    const existing = await Exam.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Exam not found" });
    // Allow delete anytime per requirement; optionally guard after start if needed
    await existing.deleteOne();
    res.json({ message: "Exam deleted ✅" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
