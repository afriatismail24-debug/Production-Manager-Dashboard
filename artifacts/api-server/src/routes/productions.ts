import { Router } from "express";
import { makeId, pool } from "../lib/db.js";
import { getJoinCode } from "../lib/workspace.js";

const EDIT_WINDOW = 15 * 60 * 1000;
const router = Router();

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id, chefId: r.chef_id, chefName: r.chef_name, items: r.items,
    createdAt: Number(r.created_at), editableUntil: Number(r.editable_until),
  };
}

router.get("/productions", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { chefId, today } = req.query as { chefId?: string; today?: string };
  let query = "SELECT * FROM productions WHERE join_code=$1";
  const params: (string | number)[] = [code];
  if (chefId) { params.push(chefId); query += ` AND chef_id=$${params.length}`; }
  if (today === "1") { const s = new Date(); s.setHours(0,0,0,0); params.push(s.getTime()); query += ` AND created_at >= $${params.length}`; }
  query += " ORDER BY created_at DESC";
  const { rows } = await pool.query(query, params);
  return res.json(rows.map(mapRow));
});

router.post("/productions", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { chefId, chefName, items } = req.body as { chefId: string; chefName: string; items: unknown[] };
  const { rows: ws } = await pool.query("SELECT id FROM workspaces WHERE join_code=$1", [code]);
  if (ws.length === 0) return res.status(404).json({ error: "Workspace not found" });
  const now = Date.now();
  const id = makeId();
  await pool.query(
    "INSERT INTO productions (id, workspace_id, join_code, chef_id, chef_name, items, created_at, editable_until) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [id, ws[0].id, code, chefId, chefName, JSON.stringify(items), now, now + EDIT_WINDOW],
  );
  const { rows } = await pool.query("SELECT * FROM productions WHERE id=$1", [id]);
  return res.json(mapRow(rows[0]));
});

router.put("/productions/:id", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { items } = req.body as { items: unknown[] };
  const now = Date.now();
  const { rows } = await pool.query(
    "UPDATE productions SET items=$1 WHERE id=$2 AND join_code=$3 AND editable_until > $4 RETURNING *",
    [JSON.stringify(items), req.params.id, code, now],
  );
  if (rows.length === 0) return res.status(403).json({ error: "Not editable" });
  return res.json(mapRow(rows[0]));
});

router.delete("/productions/:id", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { rowCount } = await pool.query(
    "DELETE FROM productions WHERE id=$1 AND join_code=$2 AND editable_until > $3",
    [req.params.id, code, Date.now()],
  );
  if (!rowCount) return res.status(403).json({ error: "Not deletable" });
  return res.json({ ok: true });
});

export default router;
