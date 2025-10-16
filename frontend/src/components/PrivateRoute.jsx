import React from "react";
import { Navigate } from "react-router-dom";

function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // role not allowed → redirect based on role
    return <Navigate to={user.role === "admin" ? "/admin" : "/profile"} />;
  }

  return children;
}

export default PrivateRoute;
