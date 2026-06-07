import { Router } from "express";
import { makeId, pool } from "../lib/db.js";
import { getJoinCode } from "../lib/workspace.js";

const router = Router();

function makeToken(): string {
  return [makeId(), makeId()].join("-");
}

router.post("/invites/generate", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });

  await pool.query(
    "UPDATE invite_tokens SET used=true WHERE join_code=$1 AND used=false",
    [code],
  );

  const token = makeToken();
  await pool.query(
    "INSERT INTO invite_tokens (token, join_code, created_at) VALUES ($1, $2, $3)",
    [token, code, Date.now()],
  );

  return res.json({ token });
});

router.get("/invites/current", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });

  const { rows } = await pool.query(
    "SELECT token FROM invite_tokens WHERE join_code=$1 AND used=false ORDER BY created_at DESC LIMIT 1",
    [code],
  );

  return res.json({ token: rows[0]?.token ?? null });
});

router.post("/invites/use", async (req, res) => {
  const { token } = req.body as { token: string };
  if (!token) return res.status(400).json({ error: "Missing token" });

  const { rows } = await pool.query(
    "SELECT join_code FROM invite_tokens WHERE token=$1 AND used=false",
    [token],
  );

  if (rows.length === 0)
    return res.status(400).json({ error: "Invalid or already used invite link. Ask your manager for a new one." });

  const { join_code } = rows[0];

  await pool.query("UPDATE invite_tokens SET used=true WHERE token=$1", [token]);

  const newToken = makeToken();
  await pool.query(
    "INSERT INTO invite_tokens (token, join_code, created_at) VALUES ($1, $2, $3)",
    [newToken, join_code, Date.now()],
  );

  return res.json({ ok: true, joinCode: join_code });
});

export default router;
