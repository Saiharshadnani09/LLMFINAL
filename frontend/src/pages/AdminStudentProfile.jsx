import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

function ScoreCard({ result, onOpen }) {
  const title = result?.examId?.title || "Exam";
  const type = result?.examId?.examType || result?.examType;
  return (
    <div className="p-4 border border-zinc-300 rounded-lg bg-white shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="font-semibold text-zinc-900">{title}</p>
        <p className="text-sm text-zinc-600 capitalize">Type: {type}</p>
        <p className="text-sm">Score: <b>{result.score}</b> / {result.totalQuestions}</p>
        <p className="text-xs text-zinc-500">Submitted: {new Date(result.createdAt).toLocaleString()}</p>
      </div>
      <button 
        onClick={() => onOpen(result)} 
        className="px-4 py-2 bg-black text-white font-medium rounded hover:bg-zinc-800 transition"
      >
        View
      </button>
    </div>
  );
}

function ResultDetailModal({ open, onClose, result }) {
  if (!open || !result) return null;
  const type = result.examType || result?.examId?.examType;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Result Detail</h3>
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-black text-white font-medium rounded hover:bg-zinc-800 transition"
          >
            Close
          </button>
        </div>
        <div className="space-y-3">
          <div className="text-sm text-gray-700">
            <div><b>Exam:</b> {result?.examId?.title}</div>
            <div className="capitalize"><b>Type:</b> {type}</div>
            <div><b>Score:</b> {result.score} / {result.totalQuestions}</div>
            <div><b>Submitted:</b> {new Date(result.createdAt).toLocaleString()}</div>
          </div>
          {type === "mcq" && Array.isArray(result.mcqAnswers) && (
            <div>
              <h4 className="font-semibold mb-2">Selected Options</h4>
              <ol className="list-decimal pl-5 text-sm">
                {result.mcqAnswers.map((a, i) => (
                  <li key={i}>Question {i + 1}: Option {Number(a) + 1}</li>
                ))}
              </ol>
            </div>
          )}
          {type === "coding" && result.coding && (
            <div>
              <h4 className="font-semibold mb-2">Submitted Code ({result.coding.language})</h4>
              <pre className="p-3 bg-gray-900 text-green-100 rounded text-xs whitespace-pre-wrap overflow-auto">{result.coding.code}</pre>
              <div className="text-sm mt-2">Passed: {result.coding.passed} / {result.coding.total}</div>
            </div>
          )}
          {type === "theory" && Array.isArray(result.theoryAnswers) && (
            <div>
              <h4 className="font-semibold mb-2">Written Answers</h4>
              <ol className="list-decimal pl-5 space-y-2">
                {result.theoryAnswers.map((t, i) => (
                  <li key={i} className="p-2 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-600 mb-1">Question {i + 1}</div>
                    <div className="whitespace-pre-wrap text-sm">{t}</div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminStudentProfile() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [mode, setMode] = useState("all"); // all | mcq | coding | theory
  const [open, setOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    // fetch student basic info
    fetch("http://localhost:5000/api/auth/admin/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((list) => {
        const s = Array.isArray(list) ? list.find((u) => u._id === studentId) : null;
        setStudent(s || null);
      })
      .catch(() => {});

    // fetch results
    fetch(`http://localhost:5000/api/results/student/${studentId}`)
      .then((r) => r.json())
      .then((data) => setResults(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [studentId]);

  const filtered = useMemo(() => {
    if (mode === "all") return results;
    
    // Debug: Log the first result to understand the data structure
    if (results.length > 0) {
      console.log("Sample result structure:", {
        result: results[0],
        examType: results[0].examType,
        examId: results[0].examId,
        examIdType: results[0].examId?.examType
      });
    }
    
    return results.filter((r) => {
      // Check both the result's examType and the populated exam's examType
      const resultExamType = r.examType;
      const populatedExamType = r?.examId?.examType;
      const examType = resultExamType || populatedExamType;
      
      console.log(`Filtering: resultExamType=${resultExamType}, populatedExamType=${populatedExamType}, final=${examType}, mode=${mode}`);
      
      // Handle case-insensitive comparison and ensure we have a valid exam type
      return examType && examType.toLowerCase() === mode.toLowerCase();
    });
  }, [results, mode]);

  const openDetail = async (r) => {
    try {
      const res = await fetch(`http://localhost:5000/api/results/detail/${r._id}`);
      const full = await res.json();
      setActiveResult(full);
      setOpen(true);
    } catch (_) {
      setActiveResult(r);
      setOpen(true);
    }
  };

  if (loading) return <div className="p-6">Loading student profile...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Student Profile</h2>
          {student && (
            <div className="text-sm text-zinc-700">{student.name} · {student.email}</div>
          )}
        </div>
        <Link 
          className="px-4 py-2 bg-black text-white font-medium rounded hover:bg-zinc-800 transition" 
          to="/admin/students"
        >
          Back to Students
        </Link>
      </div>

      <div className="mb-6 flex gap-3">
        {[
          ["all", "All"],
          ["mcq", "MCQ"],
          ["coding", "Coding"],
          ["theory", "Theory"],
        ].map(([key, label]) => (
          <button 
            key={key} 
            className={`px-4 py-2 border border-zinc-300 rounded font-medium transition ${
              mode === key 
                ? "bg-black text-white" 
                : "bg-white text-zinc-900 hover:bg-zinc-50"
            }`} 
            onClick={() => setMode(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-600 text-lg">No results found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <ScoreCard key={r._id} result={r} onOpen={openDetail} />
          ))}
        </div>
      )}

      <ResultDetailModal open={open} onClose={() => setOpen(false)} result={activeResult} />
    </div>
  );
}

export default AdminStudentProfile;


