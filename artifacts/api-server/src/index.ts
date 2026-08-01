import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "./lib/db.js";

// Run safe schema migrations on startup
async function migrate() {
  try {
    await pool.query(`ALTER TABLE chefs ADD COLUMN IF NOT EXISTS daily_target INTEGER DEFAULT NULL`);
    await pool.query(`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS clerk_user_id TEXT DEFAULT NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS workspaces_clerk_user_id_idx ON workspaces (clerk_user_id)`);
    logger.info("DB migrations applied");
  } catch (err) {
    logger.warn({ err }, "Migration warning (non-fatal)");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

migrate().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
});
