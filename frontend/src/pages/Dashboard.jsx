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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">📚 Available Exams</h1>

      <button
        onClick={handleViewResults}
        className="bg-green-600 text-white px-4 py-2 rounded-lg mb-6"
      >
        View My Results
      </button>

      {exams.length === 0 ? (
        <p>No exams available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((exam) => (
            <div
              key={exam._id}
              className="border rounded-xl shadow p-6 bg-white"
            >
              <h2 className="text-xl font-semibold">{exam.title}</h2>
              <p className="text-gray-600 mb-4">
                {exam.description || "No description"}
              </p>
              <button
                onClick={() => handleStartExam(exam._id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Start Exam
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
