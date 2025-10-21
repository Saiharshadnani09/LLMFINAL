import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/exams");
        const data = await res.json();
        setExams(data);
      } catch (err) {
        console.error("Failed to fetch exams", err);
      }
    };
    fetchExams();
  }, []);

  const handleStartExam = async (id) => {
    // Request fullscreen first (must be from user gesture)
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    } catch (_) {
      // Ignore; navigation still proceeds
    }
    navigate(`/exams/${id}`);
  };

  const handleViewResults = () => {
    // 👇 Replace with logged-in studentId (for now hardcode)
    const studentId = "68a84d19ef8bb10e428ffcf0";
    navigate(`/results/${studentId}`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center animate-fadeInUp">
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            📚 Available Exams
          </span>
        </h1>

        <div className="flex justify-center mb-8 animate-slideInLeft">
          <button
            onClick={handleViewResults}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center hover-glow"
          >
            <span className="mr-2">📊</span>
            View My Results
          </button>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-400 text-xl">No exams available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.map((exam, index) => (
              <div
                key={exam._id}
                className="border border-gray-700 rounded-xl shadow-lg p-6 bg-gray-900 hover:bg-gray-800 hover:border-gray-600 transition-all duration-300 transform hover:scale-105 animate-fadeInUp hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h2 className="text-xl font-semibold text-white mb-3">{exam.title}</h2>
                <p className="text-gray-300 mb-6">
                  {exam.description || "No description available"}
                </p>
                <button
                  onClick={() => handleStartExam(exam._id)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
                >
                  <span className="mr-2">🚀</span>
                  Start Exam
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
