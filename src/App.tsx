import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { HomeResetGate } from "./components/HomeResetGate";
import { ResetMyView } from "./components/ResetMyView";
import { Admin } from "./pages/Admin";
import { CreatePoll } from "./pages/CreatePoll";
import { Results } from "./pages/Results";
import { Vote } from "./pages/Vote";

function AppHeader() {
  const { pathname } = useLocation();
  const onCreatePage = pathname === "/create";

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="logo">
          Polopine
        </Link>
        {!onCreatePage ? (
          <Link to="/create" className="btn btn-primary btn-header">
            Create Poll
          </Link>
        ) : null}
      </div>
    </header>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <AppHeader />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomeResetGate />} />
            <Route path="/reset-me" element={<ResetMyView />} />
            <Route path="/admin" element={<Admin />} />
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
