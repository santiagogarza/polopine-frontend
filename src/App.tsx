import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { CreatePoll } from "./pages/CreatePoll";
import { Home } from "./pages/Home";
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
