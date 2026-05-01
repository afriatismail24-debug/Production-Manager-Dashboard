import { Request } from "express";

export function getClientIp(req: Request): string {
  const forwarded =
    (req.headers["x-forwarded-for"] as string) ||
    (req.headers["x-real-ip"] as string) ||
    req.ip ||
    "unknown";
  const ip = forwarded.split(",")[0].trim();
  return ip;
}
