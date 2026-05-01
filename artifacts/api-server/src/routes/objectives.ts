import { Router } from "express";
import { makeId, pool } from "../lib/db.js";
import { getJoinCode } from "../lib/workspace.js";

const router = Router();

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

router.get("/objectives/today", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { rows } = await pool.query(
    "SELECT * FROM objectives WHERE join_code=$1 AND date=$2 ORDER BY created_at ASC",
    [code, todayKey()],
  );
  return res.json(rows.map((o) => ({ id: o.id, texts: o.texts, date: o.date, createdAt: Number(o.created_at) })));
});

router.post("/objectives", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { texts } = req.body as { texts: string[] };
  const cleaned = texts.map((t: string) => t.trim()).filter((t: string) => t.length > 0);
  if (cleaned.length === 0) return res.status(400).json({ error: "No texts" });
  const { rows: ws } = await pool.query("SELECT id FROM workspaces WHERE join_code=$1", [code]);
  if (ws.length === 0) return res.status(404).json({ error: "Workspace not found" });
  const id = makeId();
  const now = Date.now();
  await pool.query(
    "INSERT INTO objectives (id, workspace_id, join_code, texts, date, created_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [id, ws[0].id, code, JSON.stringify(cleaned), todayKey(), now],
  );
  return res.json({ id, texts: cleaned, date: todayKey(), createdAt: now });
});

router.delete("/objectives/:id", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  await pool.query("DELETE FROM objectives WHERE id=$1 AND join_code=$2", [req.params.id, code]);
  return res.json({ ok: true });
});

export default router;
