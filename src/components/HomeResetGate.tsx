import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Home } from "../pages/Home";
import { clearAllVoted } from "../voted";

/** Renders Home, or clears local votes when ?reset=me is present. */
export function HomeResetGate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shouldReset = searchParams.get("reset") === "me";

  useEffect(() => {
    if (!shouldReset) {
      return;
    }
    clearAllVoted();
    navigate("/", { replace: true });
  }, [shouldReset, navigate]);

  if (shouldReset) {
    return (
      <section className="page">
        <p className="page-lead">Resetting your view…</p>
      </section>
    );
  }

  return <Home />;
}
