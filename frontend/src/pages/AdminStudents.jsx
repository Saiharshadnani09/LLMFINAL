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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Students</h2>
        <Link 
          className="px-4 py-2 bg-black text-white font-medium rounded hover:bg-zinc-800 transition" 
          to="/admin"
        >
          Back to Admin
        </Link>
      </div>
      {students.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No students found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((s) => (
            <div key={s._id} className="p-4 border border-zinc-300 rounded-lg bg-white shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="font-semibold text-zinc-900">{s.name}</p>
                <p className="text-sm text-zinc-600">{s.email}</p>
              </div>
              <Link 
                className="px-4 py-2 bg-black text-white font-medium rounded hover:bg-zinc-800 transition" 
                to={`/admin/students/${s._id}`}
              >
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


