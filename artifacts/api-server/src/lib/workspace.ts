import { Request } from "express";

export function getJoinCode(req: Request): string | null {
  const code = (req.headers["x-workspace-code"] as string) || "";
  return code.trim().toUpperCase() || null;
}

export function requireJoinCode(req: Request): string {
  const code = getJoinCode(req);
  if (!code) throw new Error("Missing workspace code");
  return code;
}

export function generateJoinCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  let code = "";
  for (let i = 0; i < 3; i++) code += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 3; i++) code += digits[Math.floor(Math.random() * digits.length)];
  return code;
}
