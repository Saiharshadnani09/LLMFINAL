import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminStudentProfile from "./pages/AdminStudentProfile";
import TrainingPortal from "./pages/TrainingPortal";
import StudentTrainingView from "./pages/StudentTrainingView";
import SchedulePortal from "./pages/SchedulePortal";
import StudentScheduleView from "./pages/StudentScheduleView";
import ExamPage from "./pages/ExamPage";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="p-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student-only routes */}
          <Route
            path="/profile"
            element={
              <PrivateRoute allowedRoles={["student"]}>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route
            path="/training"
            element={
              <PrivateRoute allowedRoles={["student"]}>
                <StudentTrainingView />
              </PrivateRoute>
            }
          />

          <Route
            path="/schedules"
            element={
              <PrivateRoute allowedRoles={["student"]}>
                <StudentScheduleView />
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
          <Route
            path="/admin/training"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <TrainingPortal />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/schedules"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <SchedulePortal />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
