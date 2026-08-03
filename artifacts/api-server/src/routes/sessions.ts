import { Router } from "express";
import { makeId, pool } from "../lib/db.js";
import { getJoinCode } from "../lib/workspace.js";
import { sendPushOne } from "../lib/push.js";

const router = Router();

router.post("/sessions/checkin", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { userId, role, name } = req.body as { userId: string; role: string; name?: string };

  const { rows: ws } = await pool.query("SELECT id FROM workspaces WHERE join_code=$1", [code]);
  if (ws.length === 0) return res.status(404).json({ error: "Workspace not found" });

  const { rows: open } = await pool.query(
    "SELECT id FROM work_sessions WHERE join_code=$1 AND user_id=$2 AND check_out_at IS NULL",
    [code, userId],
  );
  if (open.length > 0) return res.json({ id: open[0].id, alreadyCheckedIn: true });

  const id = makeId();
  await pool.query(
    "INSERT INTO work_sessions (id, workspace_id, join_code, user_id, role, check_in_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [id, ws[0].id, code, userId, role, Date.now()],
  );

  // Notify manager when an operator checks in (fire-and-forget)
  if (role === "chef") {
    pool.query(
      "SELECT token FROM push_tokens WHERE join_code=$1 AND role='boss' LIMIT 1",
      [code],
    ).then(({ rows: tokens }) => {
      if (tokens.length > 0) {
        sendPushOne({
          to: tokens[0].token,
          title: "Operator checked in",
          body: name ? `${name} has started their shift` : "An operator has started their shift",
          data: { screen: "boss", type: "checkin" },
          sound: "default",
        });
      }
    }).catch(() => {/* non-fatal */});
  }

  return res.json({ id, alreadyCheckedIn: false });
});

router.post("/sessions/checkout", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { userId } = req.body as { userId: string };
  const now = Date.now();
  const { rows } = await pool.query(
    "UPDATE work_sessions SET check_out_at=$1 WHERE join_code=$2 AND user_id=$3 AND check_out_at IS NULL RETURNING *",
    [now, code, userId],
  );
  if (rows.length === 0) return res.status(404).json({ error: "No open session" });
  const w = rows[0];
  return res.json({ id: w.id, userId: w.user_id, role: w.role, checkInAt: Number(w.check_in_at), checkOutAt: Number(w.check_out_at) });
});

router.get("/sessions/current/:userId", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { rows } = await pool.query(
    "SELECT * FROM work_sessions WHERE join_code=$1 AND user_id=$2 AND check_out_at IS NULL LIMIT 1",
    [code, req.params.userId],
  );
  if (rows.length === 0) return res.json(null);
  const w = rows[0];
  return res.json({ id: w.id, userId: w.user_id, role: w.role, checkInAt: Number(w.check_in_at), checkOutAt: null });
});

router.get("/sessions/today", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const { rows } = await pool.query(
    "SELECT * FROM work_sessions WHERE join_code=$1 AND check_in_at >= $2 ORDER BY check_in_at DESC",
    [code, start.getTime()],
  );
  return res.json(rows.map((w) => ({
    id: w.id, userId: w.user_id, role: w.role,
    checkInAt: Number(w.check_in_at), checkOutAt: w.check_out_at ? Number(w.check_out_at) : null,
  })));
});

export default router;
