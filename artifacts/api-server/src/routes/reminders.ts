import { Router } from "express";
import { makeId, pool } from "../lib/db.js";
import { getJoinCode } from "../lib/workspace.js";
import { sendPush } from "../lib/push.js";

const router = Router();

router.post("/reminders", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { message } = req.body as { message: string };
  const { rows: ws } = await pool.query("SELECT id FROM workspaces WHERE join_code=$1", [code]);
  if (ws.length === 0) return res.status(404).json({ error: "Workspace not found" });
  const id = makeId();
  const now = Date.now();
  await pool.query(
    "INSERT INTO reminders (id, workspace_id, join_code, message, created_at, seen_by) VALUES ($1,$2,$3,$4,$5,'[]')",
    [id, ws[0].id, code, message || "Please submit your production.", now],
  );

  // Push notification to all operators in this workspace (fire-and-forget)
  pool.query(
    "SELECT token FROM push_tokens WHERE join_code=$1 AND role='chef'",
    [code],
  ).then(({ rows: tokens }) => {
    if (tokens.length > 0) {
      sendPush(tokens.map((t) => ({
        to: t.token,
        title: "📋 Reminder from manager",
        body: message || "Please submit your production.",
        data: { screen: "chef", type: "reminder" },
        sound: "default" as const,
      })));
    }
  }).catch(() => {/* non-fatal */});

  return res.json({ id, message, createdAt: now });
});

router.get("/reminders/unseen/:chefId", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { rows } = await pool.query(
    "SELECT * FROM reminders WHERE join_code=$1 AND NOT (seen_by @> $2::jsonb) ORDER BY created_at DESC",
    [code, JSON.stringify([req.params.chefId])],
  );
  return res.json(rows.map((r) => ({ id: r.id, message: r.message, createdAt: Number(r.created_at) })));
});

router.post("/reminders/mark-seen", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { chefId } = req.body as { chefId: string };
  await pool.query(
    `UPDATE reminders SET seen_by = (
       SELECT jsonb_agg(DISTINCT elem) FROM (
         SELECT jsonb_array_elements(seen_by) AS elem
         UNION SELECT $1::jsonb AS elem
       ) sub
     ) WHERE join_code=$2 AND NOT (seen_by @> $3::jsonb)`,
    [JSON.stringify(chefId), code, JSON.stringify([chefId])],
  );
  return res.json({ ok: true });
});

export default router;
