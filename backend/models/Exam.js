import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema({
  input: { type: String },
  expected: { type: String },
});

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }], // for MCQ or starterCode for coding
  correctAnswer: { type: Number, required: true }, // for MCQ
  // Coding-specific (optional)
  starterCode: { type: String },
  testcases: [testCaseSchema],
});

const examSchema = new mongoose.Schema({
  examType: { type: String, enum: ["mcq", "theory", "coding"], default: "mcq" },
  title: { type: String, required: true },
  questions: [questionSchema],
  allowedLanguages: [{ type: String }],
  // Optional scheduling
  startTime: { type: Date },
  endTime: { type: Date },
  // Duration in minutes for timer-based auto submit
  duration: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Exam", examSchema);
