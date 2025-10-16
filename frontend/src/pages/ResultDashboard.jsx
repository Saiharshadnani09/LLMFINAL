import React, { useEffect, useState } from "react";

const STUDENT_ID = "68a84d19ef8bb10e428ffcf0"; // replace with logged-in student id

function ResultDashboard() {
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage("Loading results...");
    fetch(`http://localhost:5000/api/results/${STUDENT_ID}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data);
        setMessage("");
      })
      .catch(() => setMessage("❌ Failed to fetch results"));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">📊 My Results</h2>

      {message && <p>{message}</p>}

      {results.length === 0 && !message && <p>No results yet.</p>}

      <div className="space-y-4">
        {results.map((r) => (
          <div
            key={r._id}
            className="border p-4 rounded shadow-md bg-white"
          >
            <h3 className="font-semibold">{r.exam?.title}</h3>
            <p className="text-gray-600">{r.exam?.description}</p>
            <p className="mt-2">
              ✅ Score: <b>{r.score}</b> / {r.answers.length}
            </p>
            <p className="text-sm text-gray-500">
              Taken on: {new Date(r.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResultDashboard;
