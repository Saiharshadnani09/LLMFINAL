import React from "react";//k
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from '../assets/image.png'; // your logo path

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isHome = location.pathname === "/";

  return (
    <nav
      className={`${
        isHome
          ? "bg-black/80 backdrop-blur absolute top-0 left-0 w-full z-50"
          : "bg-black shadow-md"
      } text-white p-4 flex justify-between items-center`}
    >
      {/* Logo */}
      <img
        src={logo}
        alt="Logo"
        className="cursor-pointer w-28 sm:w-28 md:w-32 drop-shadow" // responsive width
        onClick={() => navigate("/")}
      />

      {/* Navigation Links / User */}
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <span className="font-medium">Hi, {user.name}</span>

            {user.role === "admin" ? (
              <>
                <Link to="/admin" className="hover:underline">
                  Admin Dashboard
                </Link>
                <Link to="/admin/students" className="hover:underline">
                  Students
                </Link>
                <Link to="/admin/training" className="hover:underline">
                  Training Portal
                </Link>
                <Link to="/admin/schedules" className="hover:underline">
                  Schedule Portal
                </Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="hover:underline">
                  Profile
                </Link>
                <Link to="/training" className="hover:underline">
                  Training Videos
                </Link>
                <Link to="/schedules" className="hover:underline">
                  Schedules
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded border border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-3 py-1 rounded bg-transparent text-white hover:bg-white/10"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-3 py-1 rounded bg-transparent text-white hover:bg-white/10"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
