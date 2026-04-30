import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import {
  Chef,
  Objective,
  ProblemReport,
  Production,
  WorkSession,
} from "@/types";

function fmt(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function durationMin(ms: number): string {
  if (ms <= 0) return "0m";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  return `${h}h ${rem}m`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface ReportPayload {
  bossName: string;
  date: Date;
  chefs: Chef[];
  objectives: Objective[];
  workSessions: WorkSession[];
  productions: Production[];
  problems: ProblemReport[];
  bossSession: WorkSession | null;
}

export function buildReportHtml(payload: ReportPayload): string {
  const { bossName, date, chefs, objectives, workSessions, productions, problems, bossSession } = payload;

  const dateStr = date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const chefRows = chefs
    .map((chef) => {
      const chefProductions = productions.filter((p) => p.chefId === chef.id);
      const chefProblems = problems.filter((p) => p.chefId === chef.id);
      const chefSessions = workSessions.filter((w) => w.userId === chef.id);

      const totalQty = chefProductions.reduce((acc, p) => {
        return (
          acc +
          p.items.reduce((s, it) => {
            const n = parseFloat(it.quantity);
            return s + (isNaN(n) ? 0 : n);
          }, 0)
        );
      }, 0);

      const sessionsHtml = chefSessions.length
        ? chefSessions
            .map(
              (w) =>
                `<tr><td>${fmt(w.checkInAt)}</td><td>${fmt(w.checkOutAt)}</td><td>${
                  w.checkOutAt ? durationMin(w.checkOutAt - w.checkInAt) : "active"
                }</td></tr>`,
            )
            .join("")
        : `<tr><td colspan="3" class="empty">No check-ins recorded.</td></tr>`;

      const prodsHtml = chefProductions.length
        ? chefProductions
            .map((p) => {
              const itemsHtml = p.items
                .map(
                  (it) =>
                    `<tr><td>${escapeHtml(it.name)}</td><td>${escapeHtml(
                      it.color,
                    )}</td><td>${escapeHtml(it.quantity)}</td><td>${escapeHtml(
                      it.note || "—",
                    )}</td></tr>`,
                )
                .join("");
              return `
                <div class="sub">
                  <div class="sub-meta">Submitted ${fmt(p.createdAt)}</div>
                  <table class="inner">
                    <thead><tr><th>Trouser</th><th>Color</th><th>Qty</th><th>Note</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                  </table>
                </div>`;
            })
            .join("")
        : `<div class="empty-block">No production submitted.</div>`;

      const probsHtml = chefProblems.length
        ? chefProblems
            .map(
              (p) => `
              <div class="sub">
                <div class="sub-meta"><strong>${escapeHtml(p.type)}</strong> · ${fmt(p.createdAt)}</div>
                <div class="kv"><span>Stopped</span><b>${fmt(p.stoppedAt)}</b></div>
                <div class="kv"><span>Resumed</span><b>${fmt(p.resumedAt)}</b></div>
                <div class="kv"><span>Downtime</span><b>${durationMin(p.resumedAt - p.stoppedAt)}</b></div>
                ${p.note ? `<div class="note">${escapeHtml(p.note)}</div>` : ""}
              </div>`,
            )
            .join("")
        : `<div class="empty-block">No problems reported.</div>`;

      return `
        <section class="chef">
          <div class="chef-head">
            <div>
              <div class="chef-name">${escapeHtml(chef.name)}</div>
              <div class="chef-email">${escapeHtml(chef.email)}</div>
            </div>
            <div class="totals">
              <div class="stat"><span>Productions</span><b>${chefProductions.length}</b></div>
              <div class="stat"><span>Total qty</span><b>${totalQty}</b></div>
              <div class="stat"><span>Problems</span><b>${chefProblems.length}</b></div>
            </div>
          </div>

          <div class="block-title">Check-ins</div>
          <table class="inner">
            <thead><tr><th>Check-in</th><th>Check-out</th><th>Duration</th></tr></thead>
            <tbody>${sessionsHtml}</tbody>
          </table>

          <div class="block-title">Production</div>
          ${prodsHtml}

          <div class="block-title">Problems</div>
          ${probsHtml}
        </section>
      `;
    })
    .join("");

  const objectivesHtml = objectives.length
    ? `<ul class="objectives">${objectives
        .flatMap((o) => o.texts)
        .map((t) => `<li>${escapeHtml(t)}</li>`)
        .join("")}</ul>`
    : `<div class="empty-block">No objectives set for today.</div>`;

  const totalProductions = productions.length;
  const totalProblems = problems.length;
  const activeChefs = new Set(productions.map((p) => p.chefId)).size;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 32px; margin: 0; background: #fafaf9; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 16px; border-bottom: 3px solid #f97316; margin-bottom: 24px; }
  .brand { font-size: 24px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
  .brand span { color: #f97316; }
  .meta { text-align: right; font-size: 13px; color: #64748b; }
  .meta b { color: #0f172a; display: block; font-size: 14px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .summary .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
  .summary .card span { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.6px; font-weight: 600; }
  .summary .card b { display: block; font-size: 22px; color: #0f172a; margin-top: 4px; }
  h2 { font-size: 16px; margin: 28px 0 12px; color: #1e293b; letter-spacing: -0.2px; }
  .objectives { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 16px 16px 32px; margin: 0; }
  .objectives li { margin-bottom: 6px; font-size: 13px; }
  .chef { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 18px; page-break-inside: avoid; }
  .chef-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
  .chef-name { font-size: 17px; font-weight: 700; color: #0f172a; }
  .chef-email { font-size: 12px; color: #64748b; margin-top: 2px; }
  .totals { display: flex; gap: 16px; }
  .stat span { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; font-weight: 600; }
  .stat b { font-size: 18px; color: #f97316; }
  .block-title { font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.6px; font-weight: 700; margin: 14px 0 6px; }
  table.inner { width: 100%; border-collapse: collapse; font-size: 12px; }
  table.inner th { text-align: left; padding: 8px 10px; background: #f8fafc; color: #475569; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
  table.inner td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #0f172a; }
  td.empty { color: #94a3b8; font-style: italic; text-align: center; padding: 12px; }
  .empty-block { padding: 12px; color: #94a3b8; font-style: italic; font-size: 13px; background: #f8fafc; border-radius: 8px; }
  .sub { background: #f8fafc; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
  .sub-meta { font-size: 11px; color: #64748b; margin-bottom: 6px; }
  .kv { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
  .kv span { color: #64748b; }
  .note { font-size: 12px; color: #475569; font-style: italic; margin-top: 4px; padding-top: 6px; border-top: 1px dashed #e2e8f0; }
  .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
</style>
</head><body>
  <div class="header">
    <div>
      <div class="brand">Chef<span>Track</span></div>
      <div style="font-size:13px;color:#64748b;margin-top:4px;">Daily Production Report</div>
    </div>
    <div class="meta">
      <b>${escapeHtml(bossName)}</b>
      ${escapeHtml(dateStr)}<br/>
      ${
        bossSession
          ? `Boss shift: ${fmt(bossSession.checkInAt)} → ${fmt(bossSession.checkOutAt)}`
          : ""
      }
    </div>
  </div>

  <div class="summary">
    <div class="card"><span>Active chefs</span><b>${activeChefs} / ${chefs.length}</b></div>
    <div class="card"><span>Productions</span><b>${totalProductions}</b></div>
    <div class="card"><span>Problems</span><b>${totalProblems}</b></div>
    <div class="card"><span>Objectives</span><b>${objectives.flatMap((o) => o.texts).length}</b></div>
  </div>

  <h2>Today's objectives</h2>
  ${objectivesHtml}

  <h2>Per-chef breakdown</h2>
  ${
    chefRows ||
    `<div class="empty-block">No chefs registered yet.</div>`
  }

  <div class="footer">Generated ${new Date().toLocaleString()} · ChefTrack</div>
</body></html>`;
}

export async function generateAndSharePdf(payload: ReportPayload): Promise<void> {
  const html = buildReportHtml(payload);

  if (Platform.OS === "web") {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        try {
          win.print();
        } catch {
          // ignore
        }
      }, 400);
    }
    return;
  }

  const file = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: "Save daily report",
    });
  }
}
