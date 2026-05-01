import { Router } from "express";
import { makeId, pool } from "../lib/db.js";
import { getClientIp } from "../lib/workspace.js";

const router = Router();

router.post("/calls", async (req, res) => {
  const ip = getClientIp(req);
  const { chefId, chefName } = req.body as { chefId: string; chefName: string };
  const id = makeId();
  await pool.query(
    "INSERT INTO call_requests (id, workspace_id, chef_id, chef_name, created_at, seen) VALUES ($1,$2,$3,$4,$5,false)",
    [id, ip, chefId, chefName, Date.now()],
  );
  return res.json({ ok: true, id });
});

router.get("/calls/unseen/:chefId", async (req, res) => {
  const ip = getClientIp(req);
  const { rows } = await pool.query(
    "SELECT * FROM call_requests WHERE workspace_id=$1 AND chef_id=$2 AND seen=false ORDER BY created_at DESC LIMIT 1",
    [ip, req.params.chefId],
  );
  if (rows.length === 0) return res.json(null);
  const c = rows[0];
  return res.json({
    id: c.id,
    chefId: c.chef_id,
    chefName: c.chef_name,
    createdAt: Number(c.created_at),
    seen: c.seen,
  });
});

router.post("/calls/acknowledge/:chefId", async (req, res) => {
  const ip = getClientIp(req);
  await pool.query(
    "UPDATE call_requests SET seen=true WHERE workspace_id=$1 AND chef_id=$2 AND seen=false",
    [ip, req.params.chefId],
  );
  return res.json({ ok: true });
});

export default router;
