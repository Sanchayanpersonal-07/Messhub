import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import NotFound from "./pages/NotFound";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentMenu from "./pages/student/StudentMenu";
import StudentFeedback from "./pages/student/StudentFeedback";
import StudentDuties from "./pages/student/StudentDuties";
import StudentNotifications from "./pages/student/StudentNotifications";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentBill from "./pages/student/StudentBill";

// Manager pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerMeals from "./pages/manager/ManagerMeals";
import ManagerFeedback from "./pages/manager/ManagerFeedback";
import MenuUpload from "./pages/manager/MenuUpload";
import ManagerNotifications from "./pages/manager/ManagerNotifications";
import ManagerAttendance from "./pages/manager/ManagerAttendance";
import ManagerPrediction from "./pages/manager/ManagerPrediction";

// Warden pages
import WardenDashboard from "./pages/warden/WardenDashboard";
import WardenFeedback from "./pages/warden/WardenFeedback";
import WardenDutyReports from "./pages/warden/WardenDutyReports";
import WardenAnalytics from "./pages/warden/WardenAnalytics";
import WardenDuties from "./pages/warden/WardenDuties";
import WardenBills from "./pages/warden/WardenBills";

function App() {
  return (
    <>
      {/* ✅ FIX: Toaster added — required for toast() calls throughout the app */}
      <Toaster richColors position="top-right" />

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Student routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/menu"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentMenu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/feedback"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentFeedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/duties"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDuties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/notifications"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/bill"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentBill />
            </ProtectedRoute>
          }
        />

        {/* Manager routes */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/meals"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerMeals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/feedback"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerFeedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/menu-upload"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <MenuUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/notifications"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/attendance"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/prediction"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerPrediction />
            </ProtectedRoute>
          }
        />

        {/* Warden routes */}
        <Route
          path="/warden"
          element={
            <ProtectedRoute allowedRoles={["warden"]}>
              <WardenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warden/analytics"
          element={
            <ProtectedRoute allowedRoles={["warden"]}>
              <WardenAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warden/feedback"
          element={
            <ProtectedRoute allowedRoles={["warden"]}>
              <WardenFeedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warden/duty-reports"
          element={
            <ProtectedRoute allowedRoles={["warden"]}>
              <WardenDutyReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warden/duty-management"
          element={
            <ProtectedRoute allowedRoles={["warden"]}>
              <WardenDuties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warden/bills"
          element={
            <ProtectedRoute allowedRoles={["warden"]}>
              <WardenBills />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
