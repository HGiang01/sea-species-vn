import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import "./App.css";
import IntroPage from "./Pages/IntroPage";
import LoginPage from "./Pages/LoginPage";
import ChangePasswordPage from "./Pages/ChangePasswordPage";
import HomePage from "./Pages/HomePage";
import SpeciesPage from "./Pages/SpeciesPage";
import DashboardPage from "./Pages/DashboardPage";
import NotFoundPage from "./Pages/NotFoundPage";
import useAuthStore from "./store/useAuthStore";

function App() {
    const { isAuthenticated } = useAuthStore();
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<IntroPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/change-password" element={<ChangePasswordPage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/species/:id" element={<SpeciesPage />} />
                    <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to={"/home"} />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
