import { Router } from "express";
import { makeId, pool } from "../lib/db.js";
import { getJoinCode } from "../lib/workspace.js";
import { sendPushOne } from "../lib/push.js";

const EDIT_WINDOW = 15 * 60 * 1000;
const router = Router();

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id, chefId: r.chef_id, chefName: r.chef_name, type: r.type, note: r.note,
    stoppedAt: Number(r.stopped_at), resumedAt: Number(r.resumed_at),
    createdAt: Number(r.created_at), editableUntil: Number(r.editable_until),
  };
}

router.get("/problems", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { chefId, today } = req.query as { chefId?: string; today?: string };
  let query = "SELECT * FROM problems WHERE join_code=$1";
  const params: (string | number)[] = [code];
  if (chefId) { params.push(chefId); query += ` AND chef_id=$${params.length}`; }
  if (today === "1") { const s = new Date(); s.setHours(0,0,0,0); params.push(s.getTime()); query += ` AND created_at >= $${params.length}`; }
  query += " ORDER BY created_at DESC";
  const { rows } = await pool.query(query, params);
  return res.json(rows.map(mapRow));
});

router.post("/problems", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { chefId, chefName, type, note, stoppedAt, resumedAt } = req.body as {
    chefId: string; chefName: string; type: string; note: string; stoppedAt: number; resumedAt: number;
  };
  const { rows: ws } = await pool.query("SELECT id FROM workspaces WHERE join_code=$1", [code]);
  if (ws.length === 0) return res.status(404).json({ error: "Workspace not found" });
  const now = Date.now();
  const id = makeId();
  await pool.query(
    "INSERT INTO problems (id, workspace_id, join_code, chef_id, chef_name, type, note, stopped_at, resumed_at, created_at, editable_until) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
    [id, ws[0].id, code, chefId, chefName, type, note||"", stoppedAt, resumedAt, now, now + EDIT_WINDOW],
  );
  const { rows } = await pool.query("SELECT * FROM problems WHERE id=$1", [id]);

  // Push notification to manager (fire-and-forget)
  pool.query(
    "SELECT token FROM push_tokens WHERE join_code=$1 AND role='boss' LIMIT 1",
    [code],
  ).then(({ rows: tokens }) => {
    if (tokens.length > 0) {
      const label = type === "machine" ? "🔧 Machine issue" :
                    type === "material" ? "📦 Material issue" :
                    type === "personal" ? "🙋 Personal issue" : "⚠️ Problem";
      sendPushOne({
        to: tokens[0].token,
        title: `${label} reported`,
        body: `${chefName}${note ? ": " + note : ""}`,
        data: { screen: "boss", type: "problem" },
        sound: "default",
      });
    }
  }).catch(() => {/* non-fatal */});

  return res.json(mapRow(rows[0]));
});

router.put("/problems/:id", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { type, note, stoppedAt, resumedAt } = req.body as { type: string; note: string; stoppedAt: number; resumedAt: number };
  const { rows } = await pool.query(
    "UPDATE problems SET type=$1, note=$2, stopped_at=$3, resumed_at=$4 WHERE id=$5 AND join_code=$6 AND editable_until > $7 RETURNING *",
    [type, note||"", stoppedAt, resumedAt, req.params.id, code, Date.now()],
  );
  if (rows.length === 0) return res.status(403).json({ error: "Not editable" });
  return res.json(mapRow(rows[0]));
});

router.delete("/problems/:id", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { rowCount } = await pool.query(
    "DELETE FROM problems WHERE id=$1 AND join_code=$2 AND editable_until > $3",
    [req.params.id, code, Date.now()],
  );
  if (!rowCount) return res.status(403).json({ error: "Not deletable" });
  return res.json({ ok: true });
});

export default router;
