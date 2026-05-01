import { Router } from "express";
import { isEmailConfigured, sendPasswordReset } from "../lib/email.js";
import { makeId, pool } from "../lib/db.js";
import { getClientIp } from "../lib/workspace.js";

const router = Router();

router.get("/workspace", async (req, res) => {
  const ip = getClientIp(req);
  const { rows } = await pool.query(
    "SELECT id, boss_name, boss_email, subscription_seen, created_at FROM workspaces WHERE id = $1",
    [ip],
  );
  if (rows.length === 0) {
    return res.json({ exists: false, networkId: ip });
  }
  const w = rows[0];
  return res.json({
    exists: true,
    networkId: ip,
    bossName: w.boss_name,
    bossEmail: w.boss_email,
    subscriptionSeen: w.subscription_seen,
    createdAt: Number(w.created_at),
  });
});

router.post("/workspace/setup", async (req, res) => {
  const ip = getClientIp(req);
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }
  await pool.query(
    `INSERT INTO workspaces (id, boss_name, boss_email, boss_password, created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET boss_name=$2, boss_email=$3, boss_password=$4`,
    [ip, name.trim(), email.trim().toLowerCase(), password, Date.now()],
  );
  return res.json({ ok: true, networkId: ip });
});

router.post("/workspace/subscription-seen", async (req, res) => {
  const ip = getClientIp(req);
  await pool.query(
    "UPDATE workspaces SET subscription_seen = true WHERE id = $1",
    [ip],
  );
  return res.json({ ok: true });
});

router.post("/workspace/login-boss", async (req, res) => {
  const ip = getClientIp(req);
  const { email, password } = req.body as { email: string; password: string };
  const { rows } = await pool.query(
    "SELECT boss_name, boss_email, boss_password FROM workspaces WHERE id = $1",
    [ip],
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: "No workspace on this network" });
  }
  const w = rows[0];
  const ok =
    w.boss_email === email.trim().toLowerCase() && w.boss_password === password;
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  return res.json({ ok: true, name: w.boss_name, email: w.boss_email });
});

router.post("/workspace/login-chef", async (req, res) => {
  const ip = getClientIp(req);
  const { email, password } = req.body as { email: string; password: string };
  const { rows } = await pool.query(
    "SELECT id, name, email FROM chefs WHERE workspace_id = $1 AND email = $2 AND password = $3",
    [ip, email.trim().toLowerCase(), password],
  );
  if (rows.length === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const chef = rows[0];
  return res.json({ ok: true, chefId: chef.id, name: chef.name, email: chef.email });
});

router.post("/workspace/reset-request", async (req, res) => {
  const ip = getClientIp(req);
  const { email } = req.body as { email: string };
  const { rows } = await pool.query(
    "SELECT boss_name, boss_email FROM workspaces WHERE id = $1 AND boss_email = $2",
    [ip, email.trim().toLowerCase()],
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: "Email not found for this network" });
  }
  const boss = rows[0];
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000;
  await pool.query(
    `INSERT INTO password_resets (id, workspace_id, code, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [makeId(), ip, code, expiresAt],
  );

  const emailSent = await sendPasswordReset(boss.boss_email, code, boss.boss_name);

  return res.json({
    ok: true,
    emailSent,
    emailConfigured: isEmailConfigured(),
    code: !emailSent ? code : undefined,
  });
});

router.post("/workspace/reset-confirm", async (req, res) => {
  const ip = getClientIp(req);
  const { code, newPassword } = req.body as { code: string; newPassword: string };
  const { rows } = await pool.query(
    "SELECT id FROM password_resets WHERE workspace_id = $1 AND code = $2 AND expires_at > $3 ORDER BY expires_at DESC LIMIT 1",
    [ip, code, Date.now()],
  );
  if (rows.length === 0) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }
  await pool.query(
    "UPDATE workspaces SET boss_password = $1 WHERE id = $2",
    [newPassword, ip],
  );
  await pool.query(
    "DELETE FROM password_resets WHERE workspace_id = $1",
    [ip],
  );
  return res.json({ ok: true });
});

export default router;
