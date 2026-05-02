import { Router } from "express";
import { pool } from "../lib/db.js";
import { getJoinCode } from "../lib/workspace.js";

const router = Router();

router.get("/sync", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { today } = req.query as { today?: string };
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const startTs = start.getTime();
  const dateKey = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,"0")}-${String(start.getDate()).padStart(2,"0")}`;

  const [chefs, sessions, productions, problems, objectives, reminders, calls] = await Promise.all([
    pool.query("SELECT id, name, email, password, chef_order, created_at FROM chefs WHERE join_code=$1 ORDER BY chef_order ASC", [code]),
    pool.query(
      today === "1"
        ? "SELECT * FROM work_sessions WHERE join_code=$1 AND (check_in_at >= $2 OR check_out_at IS NULL) ORDER BY check_in_at DESC"
        : "SELECT * FROM work_sessions WHERE join_code=$1 ORDER BY check_in_at DESC LIMIT 200",
      today === "1" ? [code, startTs] : [code],
    ),
    pool.query(
      today === "1"
        ? "SELECT * FROM productions WHERE join_code=$1 AND created_at >= $2 ORDER BY created_at DESC"
        : "SELECT * FROM productions WHERE join_code=$1 ORDER BY created_at DESC LIMIT 200",
      today === "1" ? [code, startTs] : [code],
    ),
    pool.query(
      today === "1"
        ? "SELECT * FROM problems WHERE join_code=$1 AND created_at >= $2 ORDER BY created_at DESC"
        : "SELECT * FROM problems WHERE join_code=$1 ORDER BY created_at DESC LIMIT 200",
      today === "1" ? [code, startTs] : [code],
    ),
    pool.query("SELECT * FROM objectives WHERE join_code=$1 AND date=$2 ORDER BY created_at ASC", [code, dateKey]),
    pool.query("SELECT * FROM reminders WHERE join_code=$1 ORDER BY created_at DESC LIMIT 50", [code]),
    pool.query("SELECT * FROM call_requests WHERE join_code=$1 AND seen=false ORDER BY created_at DESC", [code]),
  ]);

  return res.json({
    chefs: chefs.rows.map((c) => ({ id: c.id, name: c.name, email: c.email, password: c.password, order: c.chef_order, createdAt: Number(c.created_at) })),
    workSessions: sessions.rows.map((w) => ({ id: w.id, userId: w.user_id, role: w.role, checkInAt: Number(w.check_in_at), checkOutAt: w.check_out_at ? Number(w.check_out_at) : null })),
    productions: productions.rows.map((p) => ({ id: p.id, chefId: p.chef_id, chefName: p.chef_name, items: p.items, createdAt: Number(p.created_at), editableUntil: Number(p.editable_until) })),
    problems: problems.rows.map((p) => ({ id: p.id, chefId: p.chef_id, chefName: p.chef_name, type: p.type, note: p.note, stoppedAt: Number(p.stopped_at), resumedAt: Number(p.resumed_at), createdAt: Number(p.created_at), editableUntil: Number(p.editable_until) })),
    objectives: objectives.rows.map((o) => ({ id: o.id, texts: o.texts, date: o.date, createdAt: Number(o.created_at) })),
    reminders: reminders.rows.map((r) => ({ id: r.id, message: r.message, createdAt: Number(r.created_at), seenBy: r.seen_by })),
    calls: calls.rows.map((c) => ({ id: c.id, chefId: c.chef_id, chefName: c.chef_name, createdAt: Number(c.created_at), seen: c.seen })),
  });
});

export default router;
