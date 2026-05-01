import { Router } from "express";
import { makeId, pool } from "../lib/db.js";
import { getClientIp } from "../lib/workspace.js";

const router = Router();

router.post("/sessions/checkin", async (req, res) => {
  const ip = getClientIp(req);
  const { userId, role } = req.body as { userId: string; role: string };

  const { rows: open } = await pool.query(
    "SELECT id FROM work_sessions WHERE workspace_id=$1 AND user_id=$2 AND check_out_at IS NULL",
    [ip, userId],
  );
  if (open.length > 0) {
    return res.json({ id: open[0].id, alreadyCheckedIn: true });
  }

  const id = makeId();
  await pool.query(
    "INSERT INTO work_sessions (id, workspace_id, user_id, role, check_in_at) VALUES ($1,$2,$3,$4,$5)",
    [id, ip, userId, role, Date.now()],
  );
  return res.json({ id, alreadyCheckedIn: false });
});

router.post("/sessions/checkout", async (req, res) => {
  const ip = getClientIp(req);
  const { userId } = req.body as { userId: string };
  const now = Date.now();

  const { rows } = await pool.query(
    "UPDATE work_sessions SET check_out_at=$1 WHERE workspace_id=$2 AND user_id=$3 AND check_out_at IS NULL RETURNING *",
    [now, ip, userId],
  );
  if (rows.length === 0) return res.status(404).json({ error: "No open session" });

  const w = rows[0];
  return res.json({
    id: w.id,
    userId: w.user_id,
    role: w.role,
    checkInAt: Number(w.check_in_at),
    checkOutAt: Number(w.check_out_at),
  });
});

router.get("/sessions/current/:userId", async (req, res) => {
  const ip = getClientIp(req);
  const { rows } = await pool.query(
    "SELECT * FROM work_sessions WHERE workspace_id=$1 AND user_id=$2 AND check_out_at IS NULL LIMIT 1",
    [ip, req.params.userId],
  );
  if (rows.length === 0) return res.json(null);
  const w = rows[0];
  return res.json({
    id: w.id,
    userId: w.user_id,
    role: w.role,
    checkInAt: Number(w.check_in_at),
    checkOutAt: w.check_out_at ? Number(w.check_out_at) : null,
  });
});

router.get("/sessions/today", async (req, res) => {
  const ip = getClientIp(req);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { rows } = await pool.query(
    "SELECT * FROM work_sessions WHERE workspace_id=$1 AND check_in_at >= $2 ORDER BY check_in_at DESC",
    [ip, startOfDay.getTime()],
  );
  return res.json(
    rows.map((w) => ({
      id: w.id,
      userId: w.user_id,
      role: w.role,
      checkInAt: Number(w.check_in_at),
      checkOutAt: w.check_out_at ? Number(w.check_out_at) : null,
    })),
  );
});

export default router;
