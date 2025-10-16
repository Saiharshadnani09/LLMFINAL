// src/pages/ExamPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { runCodeWithJudge0, judge0LanguageIdFor } from "../services/judge0";
import { useNavigate, useParams } from "react-router-dom";

// Read studentId from logged-in user (stored in localStorage by auth flow)
const getLoggedInStudentId = () => {
  try {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return null;
    const user = JSON.parse(userRaw);
    // Backend login returns { id, name, role, email }
    // But some flows may store Mongo's _id. Support both.
    return user?._id || user?.id || null;
  } catch (e) {
    return null;
  }
};

function ExamPage() {
  const { id } = useParams(); // examId from URL
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [message, setMessage] = useState("");
  const [timeLeftMs, setTimeLeftMs] = useState(null); // countdown in ms
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [violationReason, setViolationReason] = useState("");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runInput, setRunInput] = useState("");
  const [runningSamples, setRunningSamples] = useState(false);
  const [sampleResults, setSampleResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setMessage("");
    fetch(`http://localhost:5000/api/exams/${id}`)
      .then((res) => res.json())
      .then((data) => setExam(data))
      .catch(() => setMessage("Failed to load exam ❌"));
  }, [id]);

  // Initialize timer when exam loads
  useEffect(() => {
    if (!exam) return;
    // Determine available time: priority to duration; otherwise compute from end-start
    let ms = null;
    if (exam.duration && Number(exam.duration) > 0) {
      ms = Number(exam.duration) * 60 * 1000;
    } else if (exam.endTime && exam.startTime) {
      ms = new Date(exam.endTime) - new Date();
    }
    if (ms && ms > 0) setTimeLeftMs(ms);
  }, [exam]);

  // Attempt to enter fullscreen on mount and track fullscreen state
  useEffect(() => {
    let lastFullscreen = false;

    const onFsChange = () => {
      const fsElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      const nowFs = !!fsElement;
      // Detect exiting fullscreen (counts as a violation if was previously in fullscreen)
      if (lastFullscreen && !nowFs) {
        incrementViolation("Exited fullscreen");
      }
      lastFullscreen = nowFs;
      setIsFullscreen(nowFs);
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange", onFsChange);
    document.addEventListener("MSFullscreenChange", onFsChange);

    // Try to request fullscreen shortly after mount (may be blocked if not user-initiated)
    const tryFs = async () => {
      setFullscreenError("");
      try {
        const el = document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
        else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      } catch (e) {
        setFullscreenError("Please click the button to enter fullscreen.");
      }
    };

    // Small timeout to let the page settle
    const t = setTimeout(tryFs, 100);

    return () => {
      clearTimeout(t);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
  }, []);

  // Detect tab switches or window hiding
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        incrementViolation("Switched tab or minimized window");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const incrementViolation = (reason) => {
    setViolationCount((prev) => {
      const next = prev + 1;
      if (next >= 4) {
        // Auto-submit on 4th violation
        handleSubmit(true);
      } else {
        setViolationReason(reason || "Policy violation detected");
        setShowWarning(true);
      }
      return next;
    });
  };

  const enterFullscreen = async () => {
    setFullscreenError("");
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    } catch (e) {
      setFullscreenError("Fullscreen was blocked. Please allow fullscreen and try again.");
    }
  };

  const exitFullscreenIfActive = async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) await document.mozCancelFullScreen();
        else if (document.msExitFullscreen) await document.msExitFullscreen();
      }
    } catch (_) {
      // no-op
    }
  };

  // Tick countdown and auto submit
  useEffect(() => {
    if (timeLeftMs == null) return;
    if (timeLeftMs <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setTimeout(() => setTimeLeftMs((v) => (v == null ? v : v - 1000)), 1000);
    return () => clearTimeout(t);
  }, [timeLeftMs]);

  const handleChange = (qIndex, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmit = async (auto = false) => {
    setMessage("");

    // For coding exams, require non-empty code
    if (!auto && exam?.examType === "coding") {
      const code = (answers && answers.code) != null ? String(answers.code) : String((exam?.questions?.[0]?.starterCode) || "");
      if (!code.trim()) {
        setMessage("Please write your solution before submitting.");
        return;
      }
      // Ensure the latest editor content is included in answers for submission
      setAnswers((prev) => ({ ...(prev || {}), code }));
    }

    // Build payload answers according to exam type
    let payloadAnswers = answers;
    if (exam?.examType === "coding") {
      payloadAnswers = {
        code: (answers && answers.code) != null ? String(answers.code) : String((exam?.questions?.[0]?.starterCode) || ""),
        language: (answers && answers.language) || (exam?.allowedLanguages && exam.allowedLanguages[0]) || "javascript",
      };
    } else if (exam?.examType !== "theory") {
      // MCQ: normalize to array
      if (!Array.isArray(answers) && typeof answers === "object") {
        payloadAnswers = Object.keys(answers)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => answers[k]);
      }
    }

    const studentId = getLoggedInStudentId();
    if (!studentId) {
      setMessage("Please log in again to submit the exam.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/results/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: id,
          studentId,
          answers: payloadAnswers,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(
          auto
            ? `⏲️ Time up! Auto-submitted. Score: ${data.score}/${data.total}`
            : `✅ Exam submitted! Your score: ${data.score}/${data.total}`
        );
        // Exit fullscreen after submit
        exitFullscreenIfActive();
        // Redirect to profile after short delay so result appears there
        setTimeout(() => navigate("/profile"), 800);
      } else {
        setMessage(data.message || "Submission failed ❌");
      }
    } catch (err) {
      setMessage("Server error ❌");
    }
  };

  const handleRunCode = async () => {
    if (exam?.examType !== "coding") return;
    const code = (answers && answers.code) || exam.questions?.[0]?.starterCode || "";
    const language = (answers && answers.language) || (exam.allowedLanguages && exam.allowedLanguages[0]) || "javascript";
    if (!code || !judge0LanguageIdFor(language)) {
      setRunResult({ status: "Error", stderr: "Unsupported language or empty code." });
      return;
    }
    try {
      setRunning(true);
      setRunResult(null);
      const result = await runCodeWithJudge0({ sourceCode: code, language, stdin: runInput });
      setRunResult(result);
    } catch (e) {
      setRunResult({ status: "Error", stderr: String(e.message || e) });
    } finally {
      setRunning(false);
    }
  };

  const handleRunSampleTests = async () => {
    if (exam?.examType !== "coding") return;
    const code = (answers && answers.code) || exam.questions?.[0]?.starterCode || "";
    const language = (answers && answers.language) || (exam.allowedLanguages && exam.allowedLanguages[0]) || "javascript";
    const tests = Array.isArray(exam.questions?.[0]?.testcases) ? exam.questions[0].testcases.slice(0, 10) : [];
    if (!tests.length) return;
    setRunningSamples(true);
    setSampleResults([]);
    const results = [];
    for (let i = 0; i < tests.length; i++) {
      const t = tests[i];
      try {
        const r = await runCodeWithJudge0({ sourceCode: code, language, stdin: String(t.input ?? "") });
        const passed = String((r.stdout || "").trim()) === String((t.expected ?? "").trim());
        results.push({
          input: String(t.input ?? ""),
          expected: String(t.expected ?? ""),
          stdout: String(r.stdout || ""),
          status: r.status,
          passed,
        });
      } catch (e) {
        results.push({
          input: String(t.input ?? ""),
          expected: String(t.expected ?? ""),
          stdout: "",
          status: "Error",
          error: String(e.message || e),
          passed: false,
        });
      }
    }
    setSampleResults(results);
    setRunningSamples(false);
  };

  if (!exam) return <p className="p-4">Loading exam...</p>;

  // Progress bar calculations
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam?.questions.length || 0;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const currentLanguage = (answers && answers.language) || (exam?.allowedLanguages && exam.allowedLanguages[0]) || "javascript";
  const starterCode = exam?.questions?.[0]?.starterCode || "function solve(input){\n  return input;\n}";
  const currentCode = (answers && answers.code) ?? starterCode;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold mb-2">Warning</h3>
            <p className="text-sm mb-4">{violationReason}. You have {Math.max(0, 3 - violationCount)} warnings left before auto-submission.</p>
            <div className="flex items-center justify-center space-x-3">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => {
                  setShowWarning(false);
                  // Try to re-enter fullscreen if not in fullscreen
                  if (!isFullscreen) enterFullscreen();
                }}
              >
                Continue Exam
              </button>
            </div>
          </div>
        </div>
      )}
      {!isFullscreen && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm mb-2">For a distraction-free test, please enter fullscreen mode.</p>
          <button onClick={enterFullscreen} className="px-4 py-1 bg-yellow-600 text-white rounded">Enter Fullscreen</button>
          {fullscreenError && <p className="text-xs mt-1 text-red-600">{fullscreenError}</p>}
        </div>
      )}
      <h2 className="text-2xl font-bold mb-2">{exam.title}</h2>
      {timeLeftMs != null && (
        <div className="mb-4 text-sm text-gray-700">
          Time left: {Math.max(0, Math.floor(timeLeftMs / 60000))}m {Math.max(0, Math.floor((timeLeftMs % 60000) / 1000))}s
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <p className="mb-1 text-sm text-gray-700">
          Answered {answeredCount} / {totalQuestions}
        </p>
        <div className="w-full bg-gray-200 rounded h-3">
          <div
            className="bg-green-500 h-3 rounded transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {exam.examType === "theory"
        ? exam.questions.map((q, qIndex) => (
            <div key={qIndex} className="mb-6 border-b pb-4">
              <p className="font-semibold mb-2">{qIndex + 1}. {q.question}</p>
              <textarea
                className="w-full border rounded p-2 h-40"
                placeholder="Type your answer here..."
                value={answers[qIndex] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [qIndex]: e.target.value }))}
              />
            </div>
          ))
        : exam.examType === "coding" ? (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold mb-2">Problem</p>
                <div className="p-3 border rounded bg-gray-50 whitespace-pre-wrap min-h-40">
                  {exam.questions?.[0]?.question}
                </div>
                {Array.isArray(exam.questions?.[0]?.testcases) && (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Sample Testcases</p>
                    <ul className="list-disc pl-5 text-sm text-gray-700">
                      {exam.questions[0].testcases.slice(0,5).map((tc, i) => (
                        <li key={i}>input: {String(tc.input)} → expected: {String(tc.expected)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold mb-2">Your Code</p>
                <textarea
                  className="w-full border rounded p-2 h-80 font-mono"
                  value={currentCode}
                  onChange={(e) => setAnswers((prev) => ({ ...(prev || {}), code: e.target.value }))}
                />
                <div className="mt-3">
                  <p className="font-semibold mb-2">Program Input (stdin)</p>
                  <textarea
                    className="w-full border rounded p-2 h-24 font-mono"
                    placeholder="Optional input passed to your program"
                    value={runInput}
                    onChange={(e) => setRunInput(e.target.value)}
                  />
                  {currentLanguage === "python" && /input\s*\(/.test(String(currentCode)) && !runInput.trim() && (
                    <p className="mt-1 text-xs text-amber-700">Your code uses input(). Provide sample input above to avoid EOF errors.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-3">
              <button
                onClick={handleRunCode}
                className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-60"
                disabled={running}
              >
                {running ? "Running..." : "Run Code"}
              </button>
              {Array.isArray(exam.questions?.[0]?.testcases) && exam.questions[0].testcases.length > 0 && (
                <button
                  onClick={handleRunSampleTests}
                  className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-60"
                  disabled={runningSamples}
                >
                  {runningSamples ? "Running Samples..." : "Run Sample Tests"}
                </button>
              )}
            </div>
            {runResult && (
              <div className="mt-4 p-3 border rounded bg-gray-50">
                <p className="text-sm"><span className="font-semibold">Status:</span> {runResult.status}</p>
                {runResult.stdout && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Output:</p>
                    <pre className="text-xs whitespace-pre-wrap">{runResult.stdout}</pre>
                  </div>
                )}
                {runResult.compile_output && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Compiler Output:</p>
                    <pre className="text-xs whitespace-pre-wrap text-red-700">{runResult.compile_output}</pre>
                  </div>
                )}
                {runResult.stderr && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Errors:</p>
                    <pre className="text-xs whitespace-pre-wrap text-red-700">{runResult.stderr}</pre>
                  </div>
                )}
              </div>
            )}
            {sampleResults && sampleResults.length > 0 && (
              <div className="mt-4 p-3 border rounded">
                <p className="font-semibold mb-2">Sample Results</p>
                <ul className="text-sm space-y-2">
                  {sampleResults.map((r, i) => (
                    <li key={i} className={`p-2 rounded ${r.passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Test {i + 1}</span>
                        <span className={r.passed ? "text-green-700" : "text-red-700"}>{r.passed ? "Passed" : "Failed"}</span>
                      </div>
                      <div className="mt-1">input: <code>{r.input}</code></div>
                      <div>expected: <code>{r.expected}</code></div>
                      <div>output: <code>{(r.stdout || "").trim()}</code></div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : exam.questions.map((q, qIndex) => (
            <div key={qIndex} className="mb-6 border-b pb-4">
              <p className="font-semibold mb-2">
                {qIndex + 1}. {q.question || q.questionText}
              </p>
              {q.options.map((opt, optIndex) => (
                <label key={optIndex} className="block cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${qIndex}`}
                    value={optIndex}
                    checked={answers[qIndex] === optIndex}
                    onChange={() => handleChange(qIndex, optIndex)}
                    className="mr-2"
                  />
                  {opt}
                </label>
              ))}
            </div>
          ))}

      <div className="mb-3">
        {exam.examType === "coding" && (
          <div className="mb-3 text-sm">
            <label className="mr-2 font-medium">Language:</label>
            <select
              onChange={(e) => setAnswers((prev) => ({ ...(prev || {}), language: e.target.value }))}
              value={currentLanguage}
              className="border p-2 rounded"
            >
              {(exam.allowedLanguages?.length ? exam.allowedLanguages : ["javascript", "python", "c", "cpp", "java"]).map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button onClick={() => handleSubmit(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Submit Exam
      </button>

      {message && <p className="mt-4 font-semibold">{message}</p>}
    </div>
  );
}

export default ExamPage;
