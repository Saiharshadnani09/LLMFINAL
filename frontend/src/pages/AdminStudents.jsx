import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/auth/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data.filter((u) => u.role === "student") : [];
        setStudents(list);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load students");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6">Loading students...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Students</h2>
        <Link className="text-blue-700 underline" to="/admin">Back to Admin</Link>
      </div>
      {students.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <div key={s._id} className="p-3 border rounded bg-white flex items-center justify-between">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-gray-600">{s.email}</p>
              </div>
              <Link className="px-3 py-1 border rounded bg-blue-600 text-white" to={`/admin/students/${s._id}`}>
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminStudents;


