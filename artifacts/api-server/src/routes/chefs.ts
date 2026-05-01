import { Router } from "express";
import { makeId, pool } from "../lib/db.js";
import { getClientIp } from "../lib/workspace.js";

const router = Router();

router.get("/chefs", async (req, res) => {
  const ip = getClientIp(req);
  const { rows } = await pool.query(
    "SELECT id, name, email, password, chef_order, created_at FROM chefs WHERE workspace_id = $1 ORDER BY chef_order ASC",
    [ip],
  );
  return res.json(
    rows.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      password: c.password,
      order: c.chef_order,
      createdAt: Number(c.created_at),
    })),
  );
});

router.post("/chefs", async (req, res) => {
  const ip = getClientIp(req);
  const { name, email } = req.body as { name: string; email: string };
  if (!name || !email) return res.status(400).json({ error: "Missing fields" });

  const { rows: existing } = await pool.query(
    "SELECT id FROM chefs WHERE workspace_id = $1 AND email = $2",
    [ip, email.trim().toLowerCase()],
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: "Chef with this email already exists" });
  }

  const { rows: countRows } = await pool.query(
    "SELECT COUNT(*) as cnt FROM chefs WHERE workspace_id = $1",
    [ip],
  );
  const order = parseInt(countRows[0].cnt, 10) + 1;
  const password = String(order).repeat(6);
  const id = makeId();

  await pool.query(
    "INSERT INTO chefs (id, workspace_id, name, email, password, chef_order, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [id, ip, name.trim(), email.trim().toLowerCase(), password, order, Date.now()],
  );

  return res.json({ id, name: name.trim(), email: email.trim().toLowerCase(), password, order, createdAt: Date.now() });
});

router.delete("/chefs/:id", async (req, res) => {
  const ip = getClientIp(req);
  await pool.query(
    "DELETE FROM chefs WHERE id = $1 AND workspace_id = $2",
    [req.params.id, ip],
  );
  return res.json({ ok: true });
});

export default router;
