# Chef Production Tracker

Cross-platform Expo app (iOS, Android, web for Mac/Windows) that lets a workshop boss track chefs' daily production in real time, with auto-generated PDF reports.

## Architecture

- Single artifact: `artifacts/chef-track` — Expo Router app
- All state is local-first via `@react-native-async-storage/async-storage`
- No backend, no third-party auth (per user request: boss credentials are auto-saved on first launch)
- PDF generation via `expo-print` on native; window.print fallback on web

## Key flows

1. **First launch** → `app/setup.tsx` boss creates account → `app/subscription.tsx` welcome screen → `app/boss.tsx` dashboard.
2. **Boss dashboard** (`app/boss.tsx`):
   - Check in / Check out (check-out automatically triggers PDF download)
   - Manage chefs (`app/chefs.tsx`) — passwords are `String(order).repeat(6)` so 1st chef = `111111`, 2nd = `222222`, etc.
   - Set workday objectives (`app/objectives.tsx`) with multi-item add-row UI
   - Send reminder to all chefs (`app/reminder.tsx`)
   - "Call to office" any specific chef
   - Live view of every chef's submissions, problems, and check-in history
3. **Chef dashboard** (`app/chef.tsx`):
   - Login from `app/login.tsx` (boss/chef tabs)
   - Check in/out
   - Submit production (`app/production.tsx`) — multi-item: trouser name, color, quantity, note
   - Report a problem (`app/problem.tsx`) — type, note, stoppedAt, resumedAt
   - Both submissions are editable / deletable for 15 minutes (gated by `editableUntil` timestamp)
   - Receives objectives, reminder banner, and "boss is calling" callout in real time

## State

`contexts/AppContext.tsx` is the single source of truth, persisted under `@chef_track_state_v1`. It exposes CRUD for boss credentials, chefs, sessions, work sessions, productions, problems, objectives, reminders, and call requests, plus `EDIT_WINDOW_MS = 15 * 60 * 1000`.

## PDF

`lib/pdf.ts` builds a styled HTML report (orange/navy theme matching the icon) including:
- summary stats (active chefs, total qty, problems, objectives)
- today's objectives
- per-chef breakdown with check-ins, production items, and problems

On native it uses `expo-print` + `expo-sharing`; on web it opens a new window and triggers print.

## Design

Warm orange (`#f97316`) + deep navy (`#1e293b`) palette in `constants/colors.ts`. All UI uses Inter via `@expo-google-fonts/inter`.
