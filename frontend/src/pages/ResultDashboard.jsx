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
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center animate-fadeInUp">
          <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            📊 My Results
          </span>
        </h2>

        {message && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <p className="ml-3 text-gray-300">{message}</p>
          </div>
        )}

        {results.length === 0 && !message && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-400 text-xl">No results yet.</p>
          </div>
        )}

        <div className="grid gap-6">
          {results.map((r, index) => (
            <div
              key={r._id}
              className="border border-gray-700 p-6 rounded-xl shadow-lg bg-gray-900 hover:bg-gray-800 hover:border-gray-600 transition-all duration-300 transform hover:scale-105 animate-fadeInUp hover-lift"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{r.exam?.title}</h3>
                <div className="flex items-center px-3 py-1 bg-green-900/30 border border-green-500 rounded-full">
                  <span className="text-green-400 font-semibold">✅ Completed</span>
                </div>
              </div>
              
              <p className="text-gray-300 mb-4">{r.exam?.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-900/30 border border-blue-500 p-4 rounded-lg">
                  <p className="text-blue-400 font-semibold mb-1">Score</p>
                  <p className="text-white text-2xl font-bold">
                    {r.score} / {r.answers.length}
                  </p>
                </div>
                
                <div className="bg-purple-900/30 border border-purple-500 p-4 rounded-lg">
                  <p className="text-purple-400 font-semibold mb-1">Percentage</p>
                  <p className="text-white text-2xl font-bold">
                    {Math.round((r.score / r.answers.length) * 100)}%
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-400 mt-4 flex items-center">
                <span className="mr-2">📅</span>
                Taken on: {new Date(r.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ResultDashboard;
