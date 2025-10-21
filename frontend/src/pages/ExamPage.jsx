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
    <div className="min-h-screen bg-black text-white p-6 max-w-4xl mx-auto">
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center border border-red-500">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-3 text-red-400">Warning</h3>
            <p className="text-sm mb-6 text-gray-300">{violationReason}. You have {Math.max(0, 3 - violationCount)} warnings left before auto-submission.</p>
            <div className="flex items-center justify-center space-x-3">
              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
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
        <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-500 rounded-lg">
          <p className="text-sm mb-3 text-yellow-300">For a distraction-free test, please enter fullscreen mode.</p>
          <button onClick={enterFullscreen} className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
            Enter Fullscreen
          </button>
          {fullscreenError && <p className="text-xs mt-2 text-red-400">{fullscreenError}</p>}
        </div>
      )}
      
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 mb-6">
        <h2 className="text-3xl font-bold mb-4 text-center">
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {exam.title}
          </span>
        </h2>
        {timeLeftMs != null && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-red-900/30 border border-red-500 rounded-lg">
              <span className="text-red-400 font-bold text-lg">
                ⏰ Time left: {Math.max(0, Math.floor(timeLeftMs / 60000))}m {Math.max(0, Math.floor((timeLeftMs % 60000) / 1000))}s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8 bg-gray-900 p-4 rounded-xl border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-300">
            Progress: {answeredCount} / {totalQuestions} questions
          </p>
          <span className="text-sm text-blue-400 font-semibold">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {exam.examType === "theory"
        ? exam.questions.map((q, qIndex) => (
            <div key={qIndex} className="mb-8 bg-gray-900 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300">
              <p className="font-semibold mb-4 text-lg text-white">{qIndex + 1}. {q.question}</p>
              <textarea
                className="w-full border border-gray-600 bg-gray-800 text-white rounded-lg p-4 h-40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                placeholder="Type your answer here..."
                value={answers[qIndex] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [qIndex]: e.target.value }))}
              />
            </div>
          ))
        : exam.examType === "coding" ? (
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                <p className="font-semibold mb-4 text-xl text-white flex items-center">
                  <span className="mr-2">💻</span> Problem Statement
                </p>
                <div className="p-4 border border-gray-600 rounded-lg bg-gray-800 text-gray-200 whitespace-pre-wrap min-h-40 font-mono text-sm">
                  {exam.questions?.[0]?.question}
                </div>
                {Array.isArray(exam.questions?.[0]?.testcases) && (
                  <div className="mt-6">
                    <p className="font-semibold mb-3 text-lg text-white flex items-center">
                      <span className="mr-2">🧪</span> Sample Testcases
                    </p>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                      <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
                        {exam.questions[0].testcases.slice(0,5).map((tc, i) => (
                          <li key={i} className="font-mono">
                            <span className="text-blue-400">Input:</span> {String(tc.input)} 
                            <span className="text-green-400 ml-2">→ Expected:</span> {String(tc.expected)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
                <p className="font-semibold mb-4 text-xl text-white flex items-center">
                  <span className="mr-2">⚡</span> Your Code
                </p>
                <textarea
                  className="w-full border border-gray-600 bg-gray-800 text-white rounded-lg p-4 h-80 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  value={currentCode}
                  onChange={(e) => setAnswers((prev) => ({ ...(prev || {}), code: e.target.value }))}
                  placeholder="Write your solution here..."
                />
                <div className="mt-4">
                  <p className="font-semibold mb-2 text-white">Program Input (stdin)</p>
                  <textarea
                    className="w-full border border-gray-600 bg-gray-800 text-white rounded-lg p-3 h-24 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    placeholder="Optional input passed to your program"
                    value={runInput}
                    onChange={(e) => setRunInput(e.target.value)}
                  />
                  {currentLanguage === "python" && /input\s*\(/.test(String(currentCode)) && !runInput.trim() && (
                    <p className="mt-2 text-xs text-yellow-400 bg-yellow-900/30 p-2 rounded border border-yellow-500">
                      Your code uses input(). Provide sample input above to avoid EOF errors.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                onClick={handleRunCode}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:transform-none flex items-center"
                disabled={running}
              >
                <span className="mr-2">{running ? "⏳" : "▶️"}</span>
                {running ? "Running..." : "Run Code"}
              </button>
              {Array.isArray(exam.questions?.[0]?.testcases) && exam.questions[0].testcases.length > 0 && (
                <button
                  onClick={handleRunSampleTests}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:transform-none flex items-center"
                  disabled={runningSamples}
                >
                  <span className="mr-2">{runningSamples ? "⏳" : "🧪"}</span>
                  {runningSamples ? "Running Samples..." : "Run Sample Tests"}
                </button>
              )}
            </div>
            {runResult && (
              <div className="mt-6 p-4 border border-gray-600 rounded-xl bg-gray-900">
                <p className="text-sm mb-3"><span className="font-semibold text-blue-400">Status:</span> <span className="text-white">{runResult.status}</span></p>
                {runResult.stdout && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-green-400 mb-2">Output:</p>
                    <pre className="text-xs whitespace-pre-wrap bg-gray-800 p-3 rounded border border-gray-600 text-gray-200 font-mono">{runResult.stdout}</pre>
                  </div>
                )}
                {runResult.compile_output && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-yellow-400 mb-2">Compiler Output:</p>
                    <pre className="text-xs whitespace-pre-wrap bg-red-900/30 p-3 rounded border border-red-500 text-red-300 font-mono">{runResult.compile_output}</pre>
                  </div>
                )}
                {runResult.stderr && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-red-400 mb-2">Errors:</p>
                    <pre className="text-xs whitespace-pre-wrap bg-red-900/30 p-3 rounded border border-red-500 text-red-300 font-mono">{runResult.stderr}</pre>
                  </div>
                )}
              </div>
            )}
            {sampleResults && sampleResults.length > 0 && (
              <div className="mt-6 p-4 border border-gray-600 rounded-xl bg-gray-900">
                <p className="font-semibold mb-4 text-lg text-white flex items-center">
                  <span className="mr-2">📊</span> Sample Test Results
                </p>
                <ul className="text-sm space-y-3">
                  {sampleResults.map((r, i) => (
                    <li key={i} className={`p-4 rounded-lg border ${r.passed ? "bg-green-900/30 border-green-500" : "bg-red-900/30 border-red-500"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">Test {i + 1}</span>
                        <span className={`font-semibold ${r.passed ? "text-green-400" : "text-red-400"}`}>
                          {r.passed ? "✅ Passed" : "❌ Failed"}
                        </span>
                      </div>
                      <div className="space-y-1 text-gray-300 font-mono text-xs">
                        <div><span className="text-blue-400">Input:</span> <code className="bg-gray-800 px-2 py-1 rounded">{r.input}</code></div>
                        <div><span className="text-green-400">Expected:</span> <code className="bg-gray-800 px-2 py-1 rounded">{r.expected}</code></div>
                        <div><span className="text-purple-400">Output:</span> <code className="bg-gray-800 px-2 py-1 rounded">{(r.stdout || "").trim()}</code></div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : exam.questions.map((q, qIndex) => (
            <div key={qIndex} className="mb-8 bg-gray-900 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300">
              <p className="font-semibold mb-4 text-lg text-white">
                {qIndex + 1}. {q.question || q.questionText}
              </p>
              <div className="space-y-3">
                {q.options.map((opt, optIndex) => (
                  <label key={optIndex} className="flex items-center cursor-pointer p-3 rounded-lg border border-gray-600 hover:border-blue-500 hover:bg-gray-800 transition-all duration-300">
                    <input
                      type="radio"
                      name={`q-${qIndex}`}
                      value={optIndex}
                      checked={answers[qIndex] === optIndex}
                      onChange={() => handleChange(qIndex, optIndex)}
                      className="mr-3 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-200">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

      <div className="mb-8">
        {exam.examType === "coding" && (
          <div className="mb-6 bg-gray-900 p-4 rounded-xl border border-gray-700">
            <label className="mr-3 font-medium text-white">Programming Language:</label>
            <select
              onChange={(e) => setAnswers((prev) => ({ ...(prev || {}), language: e.target.value }))}
              value={currentLanguage}
              className="border border-gray-600 bg-gray-800 text-white p-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
            >
              {(exam.allowedLanguages?.length ? exam.allowedLanguages : ["javascript", "python", "c", "cpp", "java"]).map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-center mb-8">
        <button 
          onClick={() => handleSubmit(false)} 
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
        >
          <span className="mr-2">🚀</span>
          Submit Exam
        </button>
      </div>

      {message && (
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
          <p className="font-semibold text-lg">{message}</p>
        </div>
      )}
    </div>
  );
}

export default ExamPage;
