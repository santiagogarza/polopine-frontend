import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { CreatePoll } from "./pages/CreatePoll";
import { Home } from "./pages/Home";
import { Results } from "./pages/Results";
import { Vote } from "./pages/Vote";

export function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <Link to="/" className="logo">
            Polopine
          </Link>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreatePoll />} />
            <Route path="/poll/:id" element={<Vote />} />
            <Route path="/poll/:id/results" element={<Results />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
