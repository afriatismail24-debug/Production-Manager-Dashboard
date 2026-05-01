import { Router } from "express";
import { makeId, pool } from "../lib/db.js";
import { getClientIp } from "../lib/workspace.js";

const router = Router();

router.post("/reminders", async (req, res) => {
  const ip = getClientIp(req);
  const { message } = req.body as { message: string };
  const id = makeId();
  const now = Date.now();
  await pool.query(
    "INSERT INTO reminders (id, workspace_id, message, created_at, seen_by) VALUES ($1,$2,$3,$4,'[]')",
    [id, ip, message || "Please submit your production.", now],
  );
  return res.json({ id, message, createdAt: now });
});

router.get("/reminders/unseen/:chefId", async (req, res) => {
  const ip = getClientIp(req);
  const chefId = req.params.chefId;
  const { rows } = await pool.query(
    "SELECT * FROM reminders WHERE workspace_id=$1 AND NOT (seen_by @> $2::jsonb) ORDER BY created_at DESC",
    [ip, JSON.stringify([chefId])],
  );
  return res.json(
    rows.map((r) => ({
      id: r.id,
      message: r.message,
      createdAt: Number(r.created_at),
    })),
  );
});

router.post("/reminders/mark-seen", async (req, res) => {
  const ip = getClientIp(req);
  const { chefId } = req.body as { chefId: string };
  await pool.query(
    `UPDATE reminders SET seen_by = (
       SELECT jsonb_agg(DISTINCT elem) FROM (
         SELECT jsonb_array_elements(seen_by) AS elem
         UNION SELECT $1::jsonb AS elem
       ) sub
     ) WHERE workspace_id=$2 AND NOT (seen_by @> $3::jsonb)`,
    [JSON.stringify(chefId), ip, JSON.stringify([chefId])],
  );
  return res.json({ ok: true });
});

export default router;
