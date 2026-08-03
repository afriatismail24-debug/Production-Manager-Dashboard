import { Router } from "express";
import { pool } from "../lib/db.js";
import { getJoinCode } from "../lib/workspace.js";

const router = Router();

/**
 * POST /notifications/push-token
 * Body: { userId, role, token }
 * Saves (or updates) the Expo push token for a user.
 */
router.post("/notifications/push-token", async (req, res) => {
  const code = getJoinCode(req);
  if (!code) return res.status(400).json({ error: "Missing workspace code" });

  const { userId, role, token } = req.body as {
    userId: string;
    role: string;
    token: string;
  };

  if (!userId || !role || !token) {
    return res.status(400).json({ error: "userId, role and token are required" });
  }

  const { rows: ws } = await pool.query(
    "SELECT id FROM workspaces WHERE join_code=$1",
    [code],
  );
  if (ws.length === 0) return res.status(404).json({ error: "Workspace not found" });

  await pool.query(
    `INSERT INTO push_tokens (user_id, join_code, workspace_id, role, token, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, join_code)
     DO UPDATE SET token=$5, role=$4, updated_at=$6`,
    [userId, code, ws[0].id, role, token, Date.now()],
  );

  return res.json({ ok: true });
});

export default router;
