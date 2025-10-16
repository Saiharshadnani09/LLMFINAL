import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from '../assets/peopletechimg.png'; // Adjust path based on your file location

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
   <nav className="bg-[#36b52a] text-white p-4 flex justify-between items-center shadow-md">
      <img
        src={logo}
        alt="Logo"
        className="cursor-pointer w-20"
        onClick={() => navigate("/")}
      />

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
