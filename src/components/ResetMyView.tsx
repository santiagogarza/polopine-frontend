import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAllVoted } from "../voted";

/** Clears local vote markers and redirects to home (demo screenshare hack). */
export function ResetMyView() {
  const navigate = useNavigate();

  useEffect(() => {
    clearAllVoted();
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <section className="page">
      <p className="page-lead">Resetting your view…</p>
    </section>
  );
}
