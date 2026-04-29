import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MemberDetailPage from "./pages/MemberDetailPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import TaskFormPage from "./pages/TaskFormPage";
import ChangeRequestsPage from "./pages/ChangeRequestsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminTeamsPage from "./pages/AdminTeamsPage";
import AdminWeightMultipliersPage from "./pages/AdminWeightMultipliersPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/members/:id" element={<MemberDetailPage />} />
                <Route path="/tasks/new" element={<TaskFormPage />} />
                <Route path="/tasks/:id" element={<TaskDetailPage />} />
                <Route path="/change-requests" element={<ChangeRequestsPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/teams" element={<AdminTeamsPage />} />
                <Route path="/admin/weight-multipliers" element={<AdminWeightMultipliersPage />} />
            </Routes>
        </BrowserRouter>
    );
}