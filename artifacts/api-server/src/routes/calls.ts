import { Router } from "express";
import { makeId, pool } from "../lib/db.js";
import { getJoinCode } from "../lib/workspace.js";
import { sendPushOne } from "../lib/push.js";

const router = Router();

router.post("/calls", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { chefId, chefName } = req.body as { chefId: string; chefName: string };
  const { rows: ws } = await pool.query("SELECT id FROM workspaces WHERE join_code=$1", [code]);
  if (ws.length === 0) return res.status(404).json({ error: "Workspace not found" });
  const id = makeId();
  await pool.query(
    "INSERT INTO call_requests (id, workspace_id, join_code, chef_id, chef_name, created_at, seen) VALUES ($1,$2,$3,$4,$5,$6,false)",
    [id, ws[0].id, code, chefId, chefName, Date.now()],
  );

  // Push notification to the specific operator being called (fire-and-forget)
  pool.query(
    "SELECT token FROM push_tokens WHERE join_code=$1 AND user_id=$2 LIMIT 1",
    [code, chefId],
  ).then(({ rows: tokens }) => {
    if (tokens.length > 0) {
      sendPushOne({
        to: tokens[0].token,
        title: "📞 Manager is calling you!",
        body: "Please come to the office now.",
        data: { screen: "chef", type: "call" },
        sound: "default",
      });
    }
  }).catch(() => {/* non-fatal */});

  return res.json({ ok: true, id });
});

router.get("/calls/unseen/:chefId", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { rows } = await pool.query(
    "SELECT * FROM call_requests WHERE join_code=$1 AND chef_id=$2 AND seen=false ORDER BY created_at DESC LIMIT 1",
    [code, req.params.chefId],
  );
  if (rows.length === 0) return res.json(null);
  const c = rows[0];
  return res.json({ id: c.id, chefId: c.chef_id, chefName: c.chef_name, createdAt: Number(c.created_at), seen: c.seen });
});

router.post("/calls/acknowledge/:chefId", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  await pool.query(
    "UPDATE call_requests SET seen=true WHERE join_code=$1 AND chef_id=$2 AND seen=false",
    [code, req.params.chefId],
  );
  return res.json({ ok: true });
});

export default router;
