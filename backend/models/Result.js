import mongoose from "mongoose";

const codingSubmissionSchema = new mongoose.Schema(
  {
    code: { type: String },
    language: { type: String },
    passed: { type: Number },
    total: { type: Number },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    examType: { type: String, enum: ["mcq", "coding", "theory"], required: true },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    // For MCQ: store selected answers (array of option indices)
    mcqAnswers: [{ type: Number }],
    // For Coding: store submitted code and language plus pass counts
    coding: codingSubmissionSchema,
    // For Theory: store long answers per question index
    theoryAnswers: [{ type: String }],
  },
  { timestamps: true }
);

const Result = mongoose.model("Result", resultSchema);
export default Result;
