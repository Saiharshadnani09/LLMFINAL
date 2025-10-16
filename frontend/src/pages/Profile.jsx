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
    <div className="p-6">
      {/* Student Info */}
      <div className="bg-gray-100 p-4 rounded-xl shadow mb-6">
        <h2 className="text-xl font-bold">{user.name}</h2>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
      </div>

      {/* Exams with results or Take Exam button */}
      <h3 className="text-lg font-semibold mb-4">🎓 Exams</h3>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : exams.length === 0 ? (
        <p>No exams available.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {exams.map((exam) => {
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
                className="p-4 border rounded-xl shadow bg-white"
              >
                <h4 className="text-lg font-bold">{exam.title}</h4>
                {exam.duration ? (
                  <p>Duration: {exam.duration} mins</p>
                ) : null}
                <p>Total Questions: {exam.questions.length}</p>
                {(startsAt || endsAt) && (
                  <p className="text-sm text-gray-600 mt-1">
                    {startsAt ? `Starts: ${new Date(exam.startTime).toLocaleString()}` : ""}
                    {startsAt && endsAt ? " | " : ""}
                    {endsAt ? `Ends: ${new Date(exam.endTime).toLocaleString()}` : ""}
                  </p>
                )}

                {result ? (
                  // Show result if completed
                  <div className="mt-3 p-2 bg-green-50 rounded">
                    <p className="font-semibold text-green-700">
                      ✅ Completed
                    </p>
                    <p>
                      Score: {result.score}/{result.totalQuestions}
                    </p>
                    <p>
                      Taken on:{" "}
                      {new Date(result.createdAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  // Show Take Exam button if not completed
                  <button
                    onClick={() => !disabled && (window.location.href = `/exam/${exam._id}`)}
                    disabled={disabled}
                    className={`mt-3 px-4 py-2 rounded-lg text-white ${
                      disabled
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {notStarted
                      ? "Not yet available"
                      : ended
                      ? "Exam ended"
                      : "Take Exam"}
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
