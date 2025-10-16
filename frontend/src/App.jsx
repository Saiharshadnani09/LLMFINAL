import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminStudentProfile from "./pages/AdminStudentProfile";
import ExamPage from "./pages/ExamPage";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student-only route */}
          <Route
            path="/profile"
            element={
              <PrivateRoute allowedRoles={["student"]}>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* Take Exam (student) */}
          <Route
            path="/exam/:id"
            element={
              <PrivateRoute allowedRoles={["student"]}>
                <ExamPage />
              </PrivateRoute>
            }
          />

          {/* Admin-only route */}
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminStudents />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/students/:studentId"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminStudentProfile />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
