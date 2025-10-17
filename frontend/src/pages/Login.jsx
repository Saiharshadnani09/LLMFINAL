import React, { useState } from "react";
import AuthBackground from "../components/AuthBackground";
import ParticlesBackground from "../components/ParticlesBackground";
import { useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // ✅ Role-based navigation
        if (data.user.role === "admin") {
          navigate("/admin"); // admin exam dashboard
        } else {
          navigate("/profile"); // student profile page
        }
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (error) {
      setMessage("❌ Server error");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-0px)] flex items-center justify-center bg-white py-12 overflow-hidden">
      <AuthBackground />
      <ParticlesBackground />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl p-8 shadow-lg border border-zinc-200">
        <h2 className="text-2xl font-semibold text-zinc-900 mb-6 text-center">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              onChange={handleChange}
              className="w-full bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 p-3 rounded focus:outline-none focus:ring-2 focus:ring-zinc-400/60"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
              className="w-full bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 p-3 rounded focus:outline-none focus:ring-2 focus:ring-zinc-400/60"
              required
            />
          </div>

          <button type="submit" className="w-full bg-black text-white font-medium py-3 rounded hover:bg-zinc-800 transition">
            Login
          </button>
        </form>
        {message && <p className="mt-4 text-center text-red-600">{message}</p>}
      </div>
    </div>
  );
}

export default Login;
