import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
   <nav className="bg-[#b52a4f] text-white p-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate("/")}>
         People Tech Group INC
      </h1>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <span className="font-medium">Hi, {user.name}</span>

            {user.role === "admin" ? (
              <>
                <Link to="/admin" className="hover:underline">Admin Dashboard</Link>
                <Link to="/admin/students" className="hover:underline">Students</Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="hover:underline">Profile</Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 px-3 py-1 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="hover:underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
