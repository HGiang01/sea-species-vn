import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";
import IntroPage from "./Pages/IntroPage";
import HomePage from "./Pages/HomePage";
import SpeciesPage from "./Pages/SpeciesPage";
import NotFoundPage from "./Pages/NotFoundPage";

function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<IntroPage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/species/:id" element={<SpeciesPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
