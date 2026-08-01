import { Router } from "express";
import { getAuth } from "@clerk/express";
import { isEmailConfigured, sendPasswordReset } from "../lib/email.js";
import { makeId, pool } from "../lib/db.js";
import { generateJoinCode, getJoinCode } from "../lib/workspace.js";

const router = Router();

// Middleware: require a valid Clerk JWT (used for Google-authenticated boss routes)
function requireClerkAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.clerkUserId = auth.userId;
  next();
}

// ─── Google-auth boss routes ────────────────────────────────────────────────

// GET /workspace/my — look up workspace tied to the authenticated Google account
router.get("/workspace/my", requireClerkAuth, async (req: any, res) => {
  const { rows } = await pool.query(
    "SELECT join_code, boss_name, boss_email, subscription_seen FROM workspaces WHERE clerk_user_id = $1",
    [req.clerkUserId],
  );
  if (rows.length === 0) return res.status(404).json({ error: "No workspace found for this account" });
  const w = rows[0];
  return res.json({
    exists: true,
    joinCode: w.join_code,
    bossName: w.boss_name,
    bossEmail: w.boss_email,
    subscriptionSeen: w.subscription_seen,
  });
});

// POST /workspace/setup-google — create workspace for a Google-signed-in manager
router.post("/workspace/setup-google", requireClerkAuth, async (req: any, res) => {
  const { name, email } = req.body as { name: string; email?: string };
  if (!name?.trim()) return res.status(400).json({ error: "Workshop name is required" });

  // Idempotent — return existing workspace if already set up
  const { rows: existing } = await pool.query(
    "SELECT join_code FROM workspaces WHERE clerk_user_id = $1",
    [req.clerkUserId],
  );
  if (existing.length > 0) {
    return res.json({ ok: true, joinCode: existing[0].join_code });
  }

  const joinCode = generateJoinCode();
  const workspaceId = `ws_${joinCode}`;
  const bossEmail = email?.trim().toLowerCase() || `${req.clerkUserId}@google.auth`;

  await pool.query(
    `INSERT INTO workspaces (id, join_code, boss_name, boss_email, boss_password, clerk_user_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [workspaceId, joinCode, name.trim(), bossEmail, "", req.clerkUserId, Date.now()],
  );
  return res.json({ ok: true, joinCode });
});

// ─── Existing workspace routes (unchanged) ──────────────────────────────────

router.get("/workspace/by-code/:code", async (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const { rows } = await pool.query(
    "SELECT join_code, boss_name, boss_email, subscription_seen, created_at FROM workspaces WHERE join_code = $1",
    [code],
  );
  if (rows.length === 0) return res.status(404).json({ error: "Workspace not found" });
  const w = rows[0];
  return res.json({
    exists: true,
    joinCode: w.join_code,
    bossName: w.boss_name,
    bossEmail: w.boss_email,
    subscriptionSeen: w.subscription_seen,
    createdAt: Number(w.created_at),
  });
});

router.post("/workspace/setup", async (req, res) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const existingCode = getJoinCode(req);
  let joinCode = existingCode;

  if (!joinCode) {
    joinCode = generateJoinCode();
    const { rows: existing } = await pool.query(
      "SELECT join_code FROM workspaces WHERE join_code = $1",
      [joinCode],
    );
    if (existing.length > 0) joinCode = generateJoinCode();
  }

  const workspaceId = `ws_${joinCode}`;
  await pool.query(
    `INSERT INTO workspaces (id, join_code, boss_name, boss_email, boss_password, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (join_code) DO UPDATE SET boss_name=$3, boss_email=$4, boss_password=$5`,
    [workspaceId, joinCode, name.trim(), email.trim().toLowerCase(), password, Date.now()],
  );
  return res.json({ ok: true, joinCode });
});

router.post("/workspace/subscription-seen", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  await pool.query(
    "UPDATE workspaces SET subscription_seen = true WHERE join_code = $1",
    [code],
  );
  return res.json({ ok: true });
});

router.post("/workspace/login-boss", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { email, password } = req.body as { email: string; password: string };
  const { rows } = await pool.query(
    "SELECT boss_name, boss_email, boss_password FROM workspaces WHERE join_code = $1",
    [code],
  );
  if (rows.length === 0) return res.status(404).json({ error: "Workspace not found" });
  const w = rows[0];
  const ok = w.boss_email === email.trim().toLowerCase() && w.boss_password === password;
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  return res.json({ ok: true, name: w.boss_name, email: w.boss_email });
});

router.post("/workspace/login-chef", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { email, password } = req.body as { email: string; password: string };
  const { rows } = await pool.query(
    "SELECT id, name, email FROM chefs WHERE join_code = $1 AND email = $2 AND password = $3",
    [code, email.trim().toLowerCase(), password],
  );
  if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
  return res.json({ ok: true, chefId: rows[0].id, name: rows[0].name, email: rows[0].email });
});

router.post("/workspace/reset-request", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { email } = req.body as { email: string };
  const { rows } = await pool.query(
    "SELECT id, boss_name, boss_email FROM workspaces WHERE join_code = $1 AND boss_email = $2",
    [code, email.trim().toLowerCase()],
  );
  if (rows.length === 0) return res.status(404).json({ error: "Email not found" });
  const boss = rows[0];
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000;
  await pool.query(
    `INSERT INTO password_resets (id, workspace_id, join_code, code, expires_at) VALUES ($1,$2,$3,$4,$5)`,
    [makeId(), boss.id, code, resetCode, expiresAt],
  );
  const emailSent = await sendPasswordReset(boss.boss_email, resetCode, boss.boss_name);
  return res.json({
    ok: true,
    emailSent,
    emailConfigured: isEmailConfigured(),
    code: !emailSent ? resetCode : undefined,
  });
});

router.post("/workspace/reset-confirm", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });
  const { code: resetCode, newPassword } = req.body as { code: string; newPassword: string };
  const { rows } = await pool.query(
    "SELECT id FROM password_resets WHERE join_code = $1 AND code = $2 AND expires_at > $3 ORDER BY expires_at DESC LIMIT 1",
    [code, resetCode, Date.now()],
  );
  if (rows.length === 0) return res.status(400).json({ error: "Invalid or expired code" });
  await pool.query("UPDATE workspaces SET boss_password=$1 WHERE join_code=$2", [newPassword, code]);
  await pool.query("DELETE FROM password_resets WHERE join_code=$1", [code]);
  return res.json({ ok: true });
});

export default router;
