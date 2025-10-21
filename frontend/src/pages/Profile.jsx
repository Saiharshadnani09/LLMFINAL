import { useEffect, useState } from "react";
import axios from "axios";

function Profile() {
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (savedUser) setUser(savedUser);

    const fetchData = async () => {
      try {
        // Fetch all exams (no auth required)
        const examRes = await axios.get("http://localhost:5000/api/exams");
        setExams(examRes.data);

        // Fetch student results only if logged in
        const studentId = savedUser?._id || savedUser?.id;
        if (studentId) {
          const resultRes = await axios.get(
            `http://localhost:5000/api/results/${studentId}`,
            token
              ? { headers: { Authorization: `Bearer ${token}` } }
              : undefined
          );
          setResults(resultRes.data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch profile data:", err);
        setError("Failed to load data ❌");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!user) return <p>Loading user info...</p>;

  // Map results by examId for quick lookup
  const resultMap = {};
  results.forEach((r) => {
    resultMap[r.examId?._id || r.examId] = r;
  });

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Student Info */}
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg mb-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 animate-fadeInUp hover-lift">
        <h2 className="text-2xl font-bold text-white mb-2">{user.name}</h2>
        <p className="text-gray-300">Email: {user.email}</p>
        <p className="text-gray-300">Role: <span className="text-blue-400 font-semibold animate-pulse-slow">{user.role}</span></p>
      </div>

      {/* Exams with results or Take Exam button */}
      <h3 className="text-2xl font-semibold mb-6 text-white flex items-center animate-slideInLeft">
        <span className="mr-2">🎓</span> 
        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Available Exams</span>
      </h3>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <p className="ml-3 text-gray-300">Loading...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No exams available.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {exams.map((exam, index) => {
            const result = resultMap[exam._id];
            // Disable access if scheduled and not started yet or already ended
            const now = new Date();
            const startsAt = exam.startTime ? new Date(exam.startTime) : null;
            const endsAt = exam.endTime ? new Date(exam.endTime) : null;
            const notStarted = startsAt && now < startsAt;
            const ended = endsAt && now > endsAt;
            const disabled = notStarted || ended;
            return (
              <div
                key={exam._id}
                className="p-6 border border-gray-700 rounded-xl shadow-lg bg-gray-900 hover:bg-gray-800 hover:border-gray-600 transition-all duration-300 transform hover:scale-105 animate-fadeInUp hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h4 className="text-xl font-bold text-white mb-3">{exam.title}</h4>
                {exam.duration ? (
                  <p className="text-gray-300 mb-2">⏱️ Duration: <span className="text-blue-400">{exam.duration} mins</span></p>
                ) : null}
                <p className="text-gray-300 mb-2">📝 Total Questions: <span className="text-purple-400">{exam.questions.length}</span></p>
                {(startsAt || endsAt) && (
                  <p className="text-sm text-gray-400 mt-2 p-2 bg-gray-800 rounded">
                    {startsAt ? `🕐 Starts: ${new Date(exam.startTime).toLocaleString()}` : ""}
                    {startsAt && endsAt ? " | " : ""}
                    {endsAt ? `⏰ Ends: ${new Date(exam.endTime).toLocaleString()}` : ""}
                  </p>
                )}

                {result ? (
                  // Show result if completed
                  <div className="mt-4 p-4 bg-green-900/30 border border-green-500 rounded-lg">
                    <p className="font-semibold text-green-400 flex items-center">
                      <span className="mr-2">✅</span> Completed
                    </p>
                    <p className="text-gray-300 mt-1">
                      Score: <span className="text-green-400 font-semibold">{result.score}/{result.totalQuestions}</span>
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Taken on: {new Date(result.createdAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  // Show Take Exam button if not completed
                  <button
                    onClick={() => !disabled && (window.location.href = `/exam/${exam._id}`)}
                    disabled={disabled}
                    className={`mt-4 px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 transform ${
                      disabled
                        ? "bg-gray-600 cursor-not-allowed opacity-50"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg"
                    }`}
                  >
                    {notStarted
                      ? "⏳ Not yet available"
                      : ended
                      ? "❌ Exam ended"
                      : "🚀 Take Exam"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Profile;
