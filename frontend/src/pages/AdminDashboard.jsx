import React, { useEffect, useState } from "react";

function AdminDashboard() {
  const [exams, setExams] = useState([]);
  const [examType, setExamType] = useState("mcq"); // mcq | coding | theory
  const [title, setTitle] = useState("");
  // MCQ builder state (multiple questions)
  const [questionsDraft, setQuestionsDraft] = useState([]); // [{question, options, correctAnswer}]
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState(""); // minutes
  const [editExamId, setEditExamId] = useState(null); // explicit edit mode
  const [theoryEditExam, setTheoryEditExam] = useState(null); // pass to TheoryBuilder

  // Fetch exams
  const fetchExams = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/exams");
      const data = await res.json();
      setExams(data);
    } catch (err) {
      setError("Failed to fetch exams ❌");
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Add current question into draft list
  const handleAddQuestion = () => {
    setError("");
    setSuccess("");
    if (!question.trim()) {
      setError("Question text is required");
      return;
    }
    const filledOptions = options.map((o) => o.trim());
    if (filledOptions.some((o) => !o)) {
      setError("All options are required");
      return;
    }
    const newItem = { question, options: filledOptions, correctAnswer };
    setQuestionsDraft((prev) => [...prev, newItem]);
    // reset current editor
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setSuccess("Question added");
  };

  // Publish exam with accumulated questions (create or update if edit mode)
  const handlePublishExam = async () => {
    setError("");
    setSuccess("");
    if (!title.trim()) {
      setError("Exam title is required");
      return;
    }
    if (questionsDraft.length === 0) {
      setError("Add at least one question before publishing");
      return;
    }
    // Optional: validate times if provided
    let payload = { title, questions: questionsDraft };
    if (startTime) payload.startTime = new Date(startTime).toISOString();
    if (endTime) payload.endTime = new Date(endTime).toISOString();
    if (duration) payload.duration = Number(duration);
    try {
      const url = editExamId
        ? `http://localhost:5000/api/exams/${editExamId}`
        : "http://localhost:5000/api/exams";
      const method = editExamId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, examType: "mcq" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to create exam ❌");
      } else {
        setSuccess(editExamId ? "✅ Exam updated successfully" : "✅ Exam published successfully");
        // reset all builder state
        setTitle("");
        setQuestionsDraft([]);
        setQuestion("");
        setOptions(["", "", "", ""]);
        setCorrectAnswer(0);
        setStartTime("");
        setEndTime("");
        setDuration("");
        setEditExamId(null);
        fetchExams();
      }
    } catch (err) {
      setError("Server error while creating exam ❌");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">📘 Exam Dashboard (Admin)</h2>

      {error && <p className="text-red-500">{error}</p>}

      {/* Exam Type Selector */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setExamType("mcq")}
          className={`px-4 py-2 rounded border ${
            examType === "mcq" ? "bg-blue-600 text-white" : "bg-white"
          }`}
        >
          1) MCQ's
        </button>
        <button
          onClick={() => setExamType("coding")}
          className={`px-4 py-2 rounded border ${
            examType === "coding" ? "bg-blue-600 text-white" : "bg-white"
          }`}
        >
          2) Coding
        </button>
        <button
          onClick={() => setExamType("theory")}
          className={`px-4 py-2 rounded border ${
            examType === "theory" ? "bg-blue-600 text-white" : "bg-white"
          }`}
        >
          3) Theory
        </button>
      </div>

      {/* Sections */}
      {examType === "mcq" && (
        <div className="mb-8">
          <div className="bg-white border rounded-xl shadow p-5">
            <h3 className="text-lg font-semibold mb-3">{editExamId ? "Edit MCQ Exam" : "Create MCQ Exam"}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Exam Title</label>
              <input
                type="text"
                placeholder="e.g. JavaScript Basics Quiz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border p-2 w-full rounded"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Question editor */}
              <div>
                <label className="block text-sm font-medium mb-1">Question</label>
                <input
                  type="text"
                  placeholder="Type the question here"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="border p-2 w-full rounded"
                />

                <div className="grid grid-cols-2 gap-2 mt-3">
                  {options.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[i] = e.target.value;
                        setOptions(newOptions);
                      }}
                      className="border p-2 rounded"
                    />
                  ))}
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Correct Option</label>
                  <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(Number(e.target.value))}
                    className="border p-2 rounded"
                  >
                    {options.map((_, i) => (
                      <option key={i} value={i}>
                        Option {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleAddQuestion}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    type="button"
                  >
                    + Add Question
                  </button>
                  <button
                    onClick={() => {
                      setQuestion("");
                      setOptions(["", "", "", ""]);
                      setCorrectAnswer(0);
                    }}
                    className="bg-gray-200 px-4 py-2 rounded"
                    type="button"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Draft questions preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Draft Questions ({questionsDraft.length})</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePublishExam}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                      type="button"
                    >
                      {editExamId ? "Save Changes" : "Publish Exam"}
                    </button>
                    {editExamId && (
                      <button
                        type="button"
                        className="px-4 py-2 border rounded"
                        onClick={() => {
                          setEditExamId(null);
                          setSuccess("Exited edit mode");
                          setTitle("");
                          setQuestionsDraft([]);
                          setQuestion("");
                          setOptions(["", "", "", ""]);
                          setCorrectAnswer(0);
                          setStartTime("");
                          setEndTime("");
                          setDuration("");
                        }}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>
                {/* Scheduling */}
                <div className="grid md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start time (optional)</label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End time (optional)</label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 30"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                </div>
                {questionsDraft.length === 0 ? (
                  <p className="text-sm text-gray-600">No questions added yet.</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-auto pr-1">
                    {questionsDraft.map((q, idx) => (
                      <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                        <p className="font-medium mb-2">
                          {idx + 1}. {q.question}
                        </p>
                        <ul className="list-disc pl-5 text-sm">
                          {q.options.map((o, oi) => (
                            <li key={oi} className={oi === q.correctAnswer ? "font-semibold text-green-700" : ""}>
                              {o} {oi === q.correctAnswer ? "(correct)" : ""}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2">
                          <button
                            type="button"
                            className="text-sm text-red-600 hover:underline"
                            onClick={() =>
                              setQuestionsDraft((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {(error || success) && (
                  <p className={`mt-3 text-sm ${error ? "text-red-600" : "text-green-700"}`}>
                    {error || success}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {examType === "coding" && (
        <CodingBuilder fetchExams={fetchExams} />
      )}

      {examType === "theory" && (
        <TheoryBuilder fetchExams={fetchExams} editExam={theoryEditExam} setEditExam={setTheoryEditExam} />
      )}

      {/* Exam List (filtered by type) */}
      <h3 className="text-lg font-bold">📑 {examType.toUpperCase()} Exams</h3>
      {exams.filter((e) => (examType === "coding" ? e.examType === "coding" : e.examType === examType)).length === 0 ? (
        <p>No exams found</p>
      ) : (
        <div className="space-y-3">
          {exams
            .filter((e) => (examType === "coding" ? e.examType === "coding" : e.examType === examType))
            .map((exam) => {
            const startsAt = exam.startTime ? new Date(exam.startTime) : null;
            const now = new Date();
            const editable = !startsAt || now < startsAt; // edit allowed before start
            return (
              <div key={exam._id} className="p-3 border rounded flex items-center justify-between bg-white">
                <div>
                  <p className="font-semibold">{exam.title}</p>
                  <p className="text-sm text-gray-600">
                    {exam.questions.length} questions
                    {exam.startTime ? ` | Starts: ${new Date(exam.startTime).toLocaleString()}` : ""}
                    {exam.endTime ? ` | Ends: ${new Date(exam.endTime).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 rounded border ${editable ? "bg-yellow-100 hover:bg-yellow-200" : "bg-gray-100 cursor-not-allowed"}`}
                    disabled={!editable}
                    onClick={async () => {
                      if (!editable) return;
                      if (exam.examType === "mcq") {
                        // Load into MCQ builder
                        setExamType("mcq");
                        setTitle(exam.title);
                        setQuestionsDraft(exam.questions || []);
                        setStartTime(exam.startTime ? new Date(exam.startTime).toISOString().slice(0,16) : "");
                        setEndTime(exam.endTime ? new Date(exam.endTime).toISOString().slice(0,16) : "");
                        setDuration(exam.duration ? String(exam.duration) : "");
                        setEditExamId(exam._id);
                        setSuccess("Edit mode enabled. Save Changes to update.");
                      } else if (exam.examType === "theory") {
                        // Load into Theory builder
                        setExamType("theory");
                        setTheoryEditExam(exam);
                      }
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 rounded border bg-red-100 hover:bg-red-200"
                    onClick={async () => {
                      if (!confirm("Delete this exam? This action cannot be undone.")) return;
                      try {
                        const res = await fetch(`http://localhost:5000/api/exams/${exam._id}`, { method: "DELETE" });
                        const data = await res.json();
                        if (!res.ok) {
                          alert(data.message || "Failed to delete");
                        } else {
                          await fetchExams();
                        }
                      } catch (e) {
                        alert("Server error while deleting");
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

// --- Theory Builder Component ---
function TheoryBuilder({ fetchExams }) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]); // array of { prompt }
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);

  const addQuestion = () => {
    setError("");
    if (!prompt.trim()) {
      setError("Question text is required");
      return;
    }
    setQuestions((q) => [...q, { prompt }]);
    setPrompt("");
  };

  const publish = async () => {
    setError("");
    setSuccess("");
    if (!title.trim() || questions.length === 0) {
      setError("Title and at least one question are required");
      return;
    }
    const payload = {
      examType: "theory",
      title,
      duration: duration ? Number(duration) : undefined,
      startTime: startTime ? new Date(startTime).toISOString() : undefined,
      endTime: endTime ? new Date(endTime).toISOString() : undefined,
      // Store theory questions in the common 'questions' array using 'question' field
      // Use a non-empty placeholder option to satisfy schema requirements
      questions: questions.map((q) => ({ question: q.prompt, options: ["(long answer)"] , correctAnswer: 0 })),
    };
    try {
      const url = editId ? `http://localhost:5000/api/exams/${editId}` : "http://localhost:5000/api/exams";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to save exam");
      } else {
        setSuccess(editId ? "✅ Theory exam updated" : "✅ Theory exam created");
        setTitle("");
        setQuestions([]);
        setPrompt("");
        setDuration("");
        setStartTime("");
        setEndTime("");
        setEditId(null);
        fetchExams();
      }
    } catch (e) {
      setError("Server error");
    }
  };

  return (
    <div className="mb-6 space-y-4 p-4 border rounded bg-white">
      <h3 className="text-lg font-semibold">{editId ? "Edit Theory Exam" : "Create Theory Exam"}</h3>
      <div>
        <label className="block text-sm font-medium mb-1">Exam Title</label>
        <input className="border p-2 rounded w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Start time</label>
          <input type="datetime-local" className="border p-2 rounded w-full" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End time</label>
          <input type="datetime-local" className="border p-2 rounded w-full" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <input type="number" min="1" className="border p-2 rounded w-full" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Theory Question</label>
        <textarea className="border p-2 rounded w-full h-24" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <div className="mt-2 flex gap-2">
          <button onClick={addQuestion} type="button" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">
            + Add Question
          </button>
          <button
            onClick={() => setPrompt("")}
            type="button"
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Reset
          </button>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Draft Questions ({questions.length})</h4>
          <button onClick={publish} type="button" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
            {editId ? "Save Changes" : "Publish Exam"}
          </button>
        </div>
        {questions.length === 0 ? (
          <p className="text-sm text-gray-600">No questions added yet.</p>
        ) : (
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="border rounded p-3 bg-gray-50">
                <div className="flex items-start justify-between">
                  <p className="font-medium mr-3">{i + 1}. {q.prompt}</p>
                  <button className="text-red-600 text-sm" onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {(success || error) && (
        <p className={`text-sm ${error ? "text-red-600" : "text-green-700"}`}>{error || success}</p>
      )}
    </div>
  );
}

// --- Coding Builder Component ---
function CodingBuilder({ fetchExams }) {
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [starterCode, setStarterCode] = useState("function solve(input) {\n  // write your code\n  return input;\n}");
  const [testcases, setTestcases] = useState([{ input: "1", expected: "1" }]);
  const [languages, setLanguages] = useState({ javascript: true, python: true, c: false, cpp: false, java: false });
  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);

  const addCase = () => setTestcases((t) => [...t, { input: "", expected: "" }]);
  const removeCase = (idx) => setTestcases((t) => t.filter((_, i) => i !== idx));

  const publish = async () => {
    setError("");
    setSuccess("");
    if (!title.trim()) return setError("Title is required");
    if (!problem.trim()) return setError("Problem statement is required");
    const cleanCases = testcases.filter((c) => String(c.input).length > 0 || String(c.expected).length > 0);
    const payload = {
      examType: "coding",
      title,
      duration: duration ? Number(duration) : undefined,
      startTime: startTime ? new Date(startTime).toISOString() : undefined,
      endTime: endTime ? new Date(endTime).toISOString() : undefined,
      questions: [
        {
          question: problem,
          options: ["(code)"] ,
          correctAnswer: 0,
          starterCode,
          testcases: cleanCases,
        },
      ],
      allowedLanguages: Object.keys(languages).filter((k) => languages[k]),
    };
    try {
      const url = editId ? `http://localhost:5000/api/exams/${editId}` : "http://localhost:5000/api/exams";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Failed to save coding exam");
      setSuccess(editId ? "✅ Coding exam updated" : "✅ Coding exam created");
      setTitle("");
      setProblem("");
      setStarterCode("function solve(input) {\n  // write your code\n  return input;\n}");
      setTestcases([{ input: "1", expected: "1" }]);
      setDuration("");
      setStartTime("");
      setEndTime("");
      setEditId(null);
      fetchExams();
    } catch (_e) {
      setError("Server error");
    }
  };

  return (
    <div className="mb-6 space-y-4 p-4 border rounded bg-white">
      <h3 className="text-lg font-semibold">{editId ? "Edit Coding Exam" : "Create Coding Exam"}</h3>
      <div>
        <label className="block text-sm font-medium mb-1">Exam Title</label>
        <input className="border p-2 rounded w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Allowed Languages</label>
        <div className="flex flex-wrap gap-3 text-sm">
          {[
            ["javascript", "JavaScript"],
            ["python", "Python"],
            ["c", "C"],
            ["cpp", "C++"],
            ["java", "Java"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-1">
              <input type="checkbox" checked={!!languages[key]} onChange={(e) => setLanguages((s) => ({ ...s, [key]: e.target.checked }))} />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Problem Statement</label>
        <textarea className="border p-2 rounded w-full h-28" value={problem} onChange={(e) => setProblem(e.target.value)} />
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Start time</label>
          <input type="datetime-local" className="border p-2 rounded w-full" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End time</label>
          <input type="datetime-local" className="border p-2 rounded w-full" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <input type="number" min="1" className="border p-2 rounded w-full" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Starter Code</label>
        <textarea className="border p-2 rounded w-full h-40 font-mono" value={starterCode} onChange={(e) => setStarterCode(e.target.value)} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Testcases</h4>
          <button onClick={addCase} className="px-3 py-1 bg-green-600 text-white rounded" type="button">+ Add Case</button>
        </div>
        <div className="space-y-2">
          {testcases.map((tc, i) => (
            <div key={i} className="grid md:grid-cols-2 gap-2 items-center">
              <input className="border p-2 rounded" placeholder="Input" value={tc.input} onChange={(e) => setTestcases((t) => t.map((c, idx) => idx === i ? { ...c, input: e.target.value } : c))} />
              <div className="flex gap-2">
                <input className="border p-2 rounded w-full" placeholder="Expected output" value={tc.expected} onChange={(e) => setTestcases((t) => t.map((c, idx) => idx === i ? { ...c, expected: e.target.value } : c))} />
                <button className="text-red-600" onClick={() => removeCase(i)} type="button">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={publish} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded" type="button">{editId ? "Save Changes" : "Publish Exam"}</button>
        {editId && <button onClick={() => setEditId(null)} className="px-4 py-2 border rounded" type="button">Cancel Edit</button>}
      </div>
      {(success || error) && <p className={`text-sm ${error ? "text-red-600" : "text-green-700"}`}>{error || success}</p>}
    </div>
  );
}
