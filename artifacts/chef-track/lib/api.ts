import { Platform } from "react-native";

const BASE = (() => {
  // On web (browser), use the current page origin so relative routing works
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  // On native (Android/iOS), use the configured server domain
  const domain = process.env.EXPO_PUBLIC_DOMAIN
    ?? "08e2f69d-a162-43d6-8c47-9a90ca846bc6-00-1r4yis9sa04hg.kirk.replit.dev";
  return `https://${domain}/api`;
})();

let _joinCode: string | null = null;
let _authTokenGetter: (() => Promise<string | null>) | null = null;

export function setApiWorkspaceCode(code: string | null) {
  _joinCode = code;
}

export function getApiWorkspaceCode(): string | null {
  return _joinCode;
}

export function setAuthTokenGetter(getter: (() => Promise<string | null>) | null) {
  _authTokenGetter = getter;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (_joinCode) headers["X-Workspace-Code"] = _joinCode;
  if (_authTokenGetter) {
    try {
      const token = await _authTokenGetter();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch {
      // ignore — proceed without token
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.error ?? msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  notifications: {
    savePushToken: (userId: string, role: string, token: string) =>
      request<{ ok: boolean }>("POST", "/notifications/push-token", { userId, role, token }),
  },
  workspace: {
    byCode: (code: string) =>
      request<WorkspaceInfo>("GET", `/workspace/by-code/${encodeURIComponent(code.trim().toUpperCase())}`),
    setup: (name: string, email: string, password: string) =>
      request<{ ok: boolean; joinCode: string }>("POST", "/workspace/setup", { name, email, password }),
    setupGoogle: (name: string, email?: string) =>
      request<{ ok: boolean; joinCode: string }>("POST", "/workspace/setup-google", { name, email }),
    my: () =>
      request<WorkspaceInfo>("GET", "/workspace/my"),
    subscriptionSeen: () =>
      request<{ ok: boolean }>("POST", "/workspace/subscription-seen"),
    loginBoss: (email: string, password: string) =>
      request<{ ok: boolean; name: string; email: string }>("POST", "/workspace/login-boss", { email, password }),
    loginChef: (email: string, password: string) =>
      request<{ ok: boolean; chefId: string; name: string; email: string }>("POST", "/workspace/login-chef", { email, password }),
    resetRequest: (email: string) =>
      request<{ ok: boolean; emailSent: boolean; emailConfigured: boolean; code?: string }>("POST", "/workspace/reset-request", { email }),
    resetConfirm: (code: string, newPassword: string) =>
      request<{ ok: boolean }>("POST", "/workspace/reset-confirm", { code, newPassword }),
  },
  chefs: {
    list: () => request<ChefData[]>("GET", "/chefs"),
    add: (name: string, email: string, password?: string) => request<ChefData>("POST", "/chefs", { name, email, password }),
    remove: (id: string) => request<{ ok: boolean }>("DELETE", `/chefs/${id}`),
    setTarget: (id: string, target: number | null) => request<{ ok: boolean }>("PUT", `/chefs/${id}/target`, { target }),
  },
  sessions: {
    checkIn: (userId: string, role: string, name?: string) =>
      request<{ id: string }>("POST", "/sessions/checkin", { userId, role, name }),
    checkOut: (userId: string) =>
      request<WorkSessionData>("POST", "/sessions/checkout", { userId }),
    current: (userId: string) =>
      request<WorkSessionData | null>("GET", `/sessions/current/${userId}`),
  },
  productions: {
    list: (opts?: { chefId?: string; today?: boolean }) => {
      const q = new URLSearchParams();
      if (opts?.chefId) q.set("chefId", opts.chefId);
      if (opts?.today) q.set("today", "1");
      return request<ProductionData[]>("GET", `/productions?${q}`);
    },
    submit: (chefId: string, chefName: string, items: ProductionItem[]) =>
      request<ProductionData>("POST", "/productions", { chefId, chefName, items }),
    update: (id: string, items: ProductionItem[]) =>
      request<ProductionData>("PUT", `/productions/${id}`, { items }),
    delete: (id: string) => request<{ ok: boolean }>("DELETE", `/productions/${id}`),
  },
  problems: {
    list: (opts?: { chefId?: string; today?: boolean }) => {
      const q = new URLSearchParams();
      if (opts?.chefId) q.set("chefId", opts.chefId);
      if (opts?.today) q.set("today", "1");
      return request<ProblemData[]>("GET", `/problems?${q}`);
    },
    submit: (chefId: string, chefName: string, data: { type: string; note: string; stoppedAt: number; resumedAt: number }) =>
      request<ProblemData>("POST", "/problems", { chefId, chefName, ...data }),
    update: (id: string, data: { type: string; note: string; stoppedAt: number; resumedAt: number }) =>
      request<ProblemData>("PUT", `/problems/${id}`, data),
    delete: (id: string) => request<{ ok: boolean }>("DELETE", `/problems/${id}`),
  },
  objectives: {
    today: () => request<ObjectiveData[]>("GET", "/objectives/today"),
    add: (texts: string[]) => request<ObjectiveData>("POST", "/objectives", { texts }),
    remove: (id: string) => request<{ ok: boolean }>("DELETE", `/objectives/${id}`),
  },
  reminders: {
    send: (message: string) => request<{ ok: boolean }>("POST", "/reminders", { message }),
    unseen: (chefId: string) => request<ReminderData[]>("GET", `/reminders/unseen/${chefId}`),
    markSeen: (chefId: string) => request<{ ok: boolean }>("POST", "/reminders/mark-seen", { chefId }),
  },
  calls: {
    call: (chefId: string, chefName: string) =>
      request<{ ok: boolean }>("POST", "/calls", { chefId, chefName }),
    unseen: (chefId: string) => request<CallData | null>("GET", `/calls/unseen/${chefId}`),
    acknowledge: (chefId: string) =>
      request<{ ok: boolean }>("POST", `/calls/acknowledge/${chefId}`),
  },
  invites: {
    generate: () =>
      request<{ token: string }>("POST", "/invites/generate"),
    current: () =>
      request<{ token: string | null }>("GET", "/invites/current"),
    use: (token: string) =>
      request<{ ok: boolean; joinCode: string }>("POST", "/invites/use", { token }),
  },
  sync: (today = true) =>
    request<SyncData>("GET", `/sync?today=${today ? "1" : "0"}`),
};

export interface WorkspaceInfo {
  exists: boolean;
  joinCode: string;
  bossName?: string;
  bossEmail?: string;
  subscriptionSeen?: boolean;
}

export interface ChefData {
  id: string;
  name: string;
  email: string;
  password: string;
  order: number;
  dailyTarget: number | null;
  createdAt: number;
}

export interface WorkSessionData {
  id: string;
  userId: string;
  role: string;
  checkInAt: number;
  checkOutAt: number | null;
}

export interface ProductionItem {
  name: string;
  color: string;
  quantity: string;
  note: string;
}

export interface ProductionData {
  id: string;
  chefId: string;
  chefName: string;
  items: ProductionItem[];
  createdAt: number;
  editableUntil: number;
}

export interface ProblemData {
  id: string;
  chefId: string;
  chefName: string;
  type: string;
  note: string;
  stoppedAt: number;
  resumedAt: number;
  createdAt: number;
  editableUntil: number;
}

export interface ObjectiveData {
  id: string;
  texts: string[];
  date: string;
  createdAt: number;
}

export interface ReminderData {
  id: string;
  message: string;
  createdAt: number;
}

export interface CallData {
  id: string;
  chefId: string;
  chefName: string;
  createdAt: number;
  seen: boolean;
}

export interface SyncData {
  chefs: ChefData[];
  workSessions: WorkSessionData[];
  productions: ProductionData[];
  problems: ProblemData[];
  objectives: ObjectiveData[];
  reminders: Array<{ id: string; message: string; createdAt: number; seenBy: string[] }>;
  calls: CallData[];
}
