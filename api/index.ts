// Serverless adapter: serves the Polopine API (santiagogarza/polopine-backend)
// from this Vercel project under /api. The backend source is copied into
// ./server at deploy time (see scripts/deploy-with-backend.sh).
import express from "express";
import { app } from "../server/src/app.js";
import { seed } from "../server/src/store.js";

// Seed on every cold start so the demo polls always exist.
seed();

const root = express();
root.use("/api", app);

export default root;
