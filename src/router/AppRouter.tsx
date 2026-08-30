import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { LoginPage } from "../pages/LoginPage/LoginPage";
import { ConnectHHPage } from "../pages/ConnectHHPage/ConnectHHPage";
import { DashboardPage } from "../pages/DashboardPage/DashboardPage";
import { ProfilePage } from "../pages/ProfilePage/ProfilePage";
import { VacanciesPage } from "../pages/VacanciesPage";
import { ResponsesPage } from "../pages/ResponsesPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/connect-hh" element={<ConnectHHPage />} />
        </Route>
        <Route element={<ProtectedRoute requireHH />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vacancies" element={<VacanciesPage />} />
          <Route path="/responses" element={<ResponsesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
