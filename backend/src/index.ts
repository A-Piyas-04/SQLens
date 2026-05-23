import cors from "cors";
import express from "express";
import "dotenv/config";

import aiRoutes from "./routes/aiRoutes";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", aiRoutes);

app.listen(PORT, () => {
  console.log(`SQLens backend running at http://localhost:${PORT}`);
});
