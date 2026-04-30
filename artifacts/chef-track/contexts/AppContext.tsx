import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BossCredentials,
  CallRequest,
  Chef,
  Objective,
  ProblemReport,
  Production,
  ProductionItem,
  Reminder,
  Session,
  WorkSession,
} from "@/types";

const STORAGE_KEY = "@chef_track_state_v1";
const EDIT_WINDOW_MS = 15 * 60 * 1000;

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface AppState {
  boss: BossCredentials | null;
  subscriptionSeen: boolean;
  chefs: Chef[];
  session: Session | null;
  objectives: Objective[];
  workSessions: WorkSession[];
  productions: Production[];
  problems: ProblemReport[];
  reminders: Reminder[];
  calls: CallRequest[];
}

const defaultState: AppState = {
  boss: null,
  subscriptionSeen: false,
  chefs: [],
  session: null,
  objectives: [],
  workSessions: [],
  productions: [],
  problems: [],
  reminders: [],
  calls: [],
};

interface AppContextValue extends AppState {
  loaded: boolean;
  setupBoss: (data: BossCredentials) => Promise<void>;
  markSubscriptionSeen: () => Promise<void>;
  loginBoss: (email: string, password: string) => boolean;
  loginChef: (email: string, password: string) => boolean;
  logout: () => Promise<void>;
  addChef: (name: string, email: string) => Promise<Chef>;
  removeChef: (id: string) => Promise<void>;
  addObjective: (texts: string[]) => Promise<void>;
  removeObjective: (id: string) => Promise<void>;
  todayObjectives: () => Objective[];
  checkIn: (userId: string, role: "boss" | "chef") => Promise<void>;
  checkOut: (userId: string) => Promise<WorkSession | null>;
  currentWorkSession: (userId: string) => WorkSession | null;
  submitProduction: (
    chefId: string,
    chefName: string,
    items: ProductionItem[],
  ) => Promise<void>;
  updateProduction: (id: string, items: ProductionItem[]) => Promise<void>;
  deleteProduction: (id: string) => Promise<void>;
  submitProblem: (
    chefId: string,
    chefName: string,
    data: {
      type: string;
      note: string;
      stoppedAt: number;
      resumedAt: number;
    },
  ) => Promise<void>;
  updateProblem: (
    id: string,
    data: { type: string; note: string; stoppedAt: number; resumedAt: number },
  ) => Promise<void>;
  deleteProblem: (id: string) => Promise<void>;
  sendReminder: (message: string) => Promise<void>;
  markRemindersSeen: (userId: string) => Promise<void>;
  unseenRemindersForChef: (chefId: string) => Reminder[];
  callChef: (chefId: string, chefName: string) => Promise<void>;
  unseenCallForChef: (chefId: string) => CallRequest | null;
  acknowledgeCall: (chefId: string) => Promise<void>;
  productionsForChef: (chefId: string) => Production[];
  problemsForChef: (chefId: string) => ProblemReport[];
  workSessionsForUser: (userId: string) => WorkSession[];
  todayProductionsAll: () => Production[];
  todayProblemsAll: () => ProblemReport[];
  todayWorkSessionsAll: () => WorkSession[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setState({ ...defaultState, ...parsed });
        }
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: AppState) => {
    setState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setupBoss = useCallback(
    async (data: BossCredentials) => {
      const next: AppState = {
        ...state,
        boss: data,
        session: { role: "boss", userId: "boss", startedAt: Date.now() },
      };
      await persist(next);
    },
    [state, persist],
  );

  const markSubscriptionSeen = useCallback(async () => {
    await persist({ ...state, subscriptionSeen: true });
  }, [state, persist]);

  const loginBoss = useCallback(
    (email: string, password: string) => {
      if (!state.boss) return false;
      const ok =
        state.boss.email.trim().toLowerCase() === email.trim().toLowerCase() &&
        state.boss.password === password;
      if (ok) {
        const next: AppState = {
          ...state,
          session: { role: "boss", userId: "boss", startedAt: Date.now() },
        };
        void persist(next);
      }
      return ok;
    },
    [state, persist],
  );

  const loginChef = useCallback(
    (email: string, password: string) => {
      const chef = state.chefs.find(
        (c) =>
          c.email.trim().toLowerCase() === email.trim().toLowerCase() &&
          c.password === password,
      );
      if (!chef) return false;
      const next: AppState = {
        ...state,
        session: { role: "chef", userId: chef.id, startedAt: Date.now() },
      };
      void persist(next);
      return true;
    },
    [state, persist],
  );

  const logout = useCallback(async () => {
    await persist({ ...state, session: null });
  }, [state, persist]);

  const addChef = useCallback(
    async (name: string, email: string) => {
      const order = state.chefs.length + 1;
      const password = String(order).repeat(6);
      const chef: Chef = {
        id: makeId(),
        name: name.trim(),
        email: email.trim(),
        password,
        createdAt: Date.now(),
        order,
      };
      await persist({ ...state, chefs: [...state.chefs, chef] });
      return chef;
    },
    [state, persist],
  );

  const removeChef = useCallback(
    async (id: string) => {
      await persist({
        ...state,
        chefs: state.chefs.filter((c) => c.id !== id),
      });
    },
    [state, persist],
  );

  const addObjective = useCallback(
    async (texts: string[]) => {
      const cleaned = texts.map((t) => t.trim()).filter((t) => t.length > 0);
      if (cleaned.length === 0) return;
      const obj: Objective = {
        id: makeId(),
        texts: cleaned,
        date: todayKey(),
        createdAt: Date.now(),
      };
      await persist({ ...state, objectives: [obj, ...state.objectives] });
    },
    [state, persist],
  );

  const removeObjective = useCallback(
    async (id: string) => {
      await persist({
        ...state,
        objectives: state.objectives.filter((o) => o.id !== id),
      });
    },
    [state, persist],
  );

  const todayObjectives = useCallback(() => {
    const t = todayKey();
    return state.objectives.filter((o) => o.date === t);
  }, [state.objectives]);

  const checkIn = useCallback(
    async (userId: string, role: "boss" | "chef") => {
      const existing = state.workSessions.find(
        (w) => w.userId === userId && w.checkOutAt === null,
      );
      if (existing) return;
      const ws: WorkSession = {
        id: makeId(),
        userId,
        role,
        checkInAt: Date.now(),
        checkOutAt: null,
      };
      await persist({ ...state, workSessions: [ws, ...state.workSessions] });
    },
    [state, persist],
  );

  const checkOut = useCallback(
    async (userId: string) => {
      const open = state.workSessions.find(
        (w) => w.userId === userId && w.checkOutAt === null,
      );
      if (!open) return null;
      const updated: WorkSession = { ...open, checkOutAt: Date.now() };
      const next = state.workSessions.map((w) =>
        w.id === open.id ? updated : w,
      );
      await persist({ ...state, workSessions: next });
      return updated;
    },
    [state, persist],
  );

  const currentWorkSession = useCallback(
    (userId: string) => {
      return (
        state.workSessions.find(
          (w) => w.userId === userId && w.checkOutAt === null,
        ) ?? null
      );
    },
    [state.workSessions],
  );

  const submitProduction = useCallback(
    async (chefId: string, chefName: string, items: ProductionItem[]) => {
      const cleaned = items
        .map((i) => ({
          name: i.name.trim(),
          color: i.color.trim(),
          quantity: i.quantity.trim(),
          note: i.note.trim(),
        }))
        .filter((i) => i.name.length > 0 || i.quantity.length > 0);
      if (cleaned.length === 0) return;
      const now = Date.now();
      const prod: Production = {
        id: makeId(),
        chefId,
        chefName,
        items: cleaned,
        createdAt: now,
        editableUntil: now + EDIT_WINDOW_MS,
      };
      await persist({ ...state, productions: [prod, ...state.productions] });
    },
    [state, persist],
  );

  const updateProduction = useCallback(
    async (id: string, items: ProductionItem[]) => {
      const cleaned = items
        .map((i) => ({
          name: i.name.trim(),
          color: i.color.trim(),
          quantity: i.quantity.trim(),
          note: i.note.trim(),
        }))
        .filter((i) => i.name.length > 0 || i.quantity.length > 0);
      const next = state.productions.map((p) =>
        p.id === id && Date.now() <= p.editableUntil
          ? { ...p, items: cleaned }
          : p,
      );
      await persist({ ...state, productions: next });
    },
    [state, persist],
  );

  const deleteProduction = useCallback(
    async (id: string) => {
      const target = state.productions.find((p) => p.id === id);
      if (!target || Date.now() > target.editableUntil) return;
      await persist({
        ...state,
        productions: state.productions.filter((p) => p.id !== id),
      });
    },
    [state, persist],
  );

  const submitProblem = useCallback(
    async (
      chefId: string,
      chefName: string,
      data: {
        type: string;
        note: string;
        stoppedAt: number;
        resumedAt: number;
      },
    ) => {
      const now = Date.now();
      const p: ProblemReport = {
        id: makeId(),
        chefId,
        chefName,
        type: data.type.trim(),
        note: data.note.trim(),
        stoppedAt: data.stoppedAt,
        resumedAt: data.resumedAt,
        createdAt: now,
        editableUntil: now + EDIT_WINDOW_MS,
      };
      await persist({ ...state, problems: [p, ...state.problems] });
    },
    [state, persist],
  );

  const updateProblem = useCallback(
    async (
      id: string,
      data: {
        type: string;
        note: string;
        stoppedAt: number;
        resumedAt: number;
      },
    ) => {
      const next = state.problems.map((p) =>
        p.id === id && Date.now() <= p.editableUntil
          ? {
              ...p,
              type: data.type.trim(),
              note: data.note.trim(),
              stoppedAt: data.stoppedAt,
              resumedAt: data.resumedAt,
            }
          : p,
      );
      await persist({ ...state, problems: next });
    },
    [state, persist],
  );

  const deleteProblem = useCallback(
    async (id: string) => {
      const target = state.problems.find((p) => p.id === id);
      if (!target || Date.now() > target.editableUntil) return;
      await persist({
        ...state,
        problems: state.problems.filter((p) => p.id !== id),
      });
    },
    [state, persist],
  );

  const sendReminder = useCallback(
    async (message: string) => {
      const r: Reminder = {
        id: makeId(),
        message: message.trim() || "Please submit your production.",
        createdAt: Date.now(),
        seenBy: [],
      };
      await persist({ ...state, reminders: [r, ...state.reminders] });
    },
    [state, persist],
  );

  const markRemindersSeen = useCallback(
    async (userId: string) => {
      const next = state.reminders.map((r) =>
        r.seenBy.includes(userId) ? r : { ...r, seenBy: [...r.seenBy, userId] },
      );
      await persist({ ...state, reminders: next });
    },
    [state, persist],
  );

  const unseenRemindersForChef = useCallback(
    (chefId: string) => {
      return state.reminders.filter((r) => !r.seenBy.includes(chefId));
    },
    [state.reminders],
  );

  const callChef = useCallback(
    async (chefId: string, chefName: string) => {
      const c: CallRequest = {
        id: makeId(),
        chefId,
        chefName,
        createdAt: Date.now(),
        seen: false,
      };
      await persist({ ...state, calls: [c, ...state.calls] });
    },
    [state, persist],
  );

  const unseenCallForChef = useCallback(
    (chefId: string) => {
      return state.calls.find((c) => c.chefId === chefId && !c.seen) ?? null;
    },
    [state.calls],
  );

  const acknowledgeCall = useCallback(
    async (chefId: string) => {
      const next = state.calls.map((c) =>
        c.chefId === chefId && !c.seen ? { ...c, seen: true } : c,
      );
      await persist({ ...state, calls: next });
    },
    [state, persist],
  );

  const productionsForChef = useCallback(
    (chefId: string) =>
      state.productions
        .filter((p) => p.chefId === chefId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [state.productions],
  );

  const problemsForChef = useCallback(
    (chefId: string) =>
      state.problems
        .filter((p) => p.chefId === chefId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [state.problems],
  );

  const workSessionsForUser = useCallback(
    (userId: string) =>
      state.workSessions
        .filter((w) => w.userId === userId)
        .sort((a, b) => b.checkInAt - a.checkInAt),
    [state.workSessions],
  );

  const todayProductionsAll = useCallback(() => {
    const t = todayKey();
    return state.productions.filter((p) => todayKey(new Date(p.createdAt)) === t);
  }, [state.productions]);

  const todayProblemsAll = useCallback(() => {
    const t = todayKey();
    return state.problems.filter((p) => todayKey(new Date(p.createdAt)) === t);
  }, [state.problems]);

  const todayWorkSessionsAll = useCallback(() => {
    const t = todayKey();
    return state.workSessions.filter(
      (w) => todayKey(new Date(w.checkInAt)) === t,
    );
  }, [state.workSessions]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      loaded,
      setupBoss,
      markSubscriptionSeen,
      loginBoss,
      loginChef,
      logout,
      addChef,
      removeChef,
      addObjective,
      removeObjective,
      todayObjectives,
      checkIn,
      checkOut,
      currentWorkSession,
      submitProduction,
      updateProduction,
      deleteProduction,
      submitProblem,
      updateProblem,
      deleteProblem,
      sendReminder,
      markRemindersSeen,
      unseenRemindersForChef,
      callChef,
      unseenCallForChef,
      acknowledgeCall,
      productionsForChef,
      problemsForChef,
      workSessionsForUser,
      todayProductionsAll,
      todayProblemsAll,
      todayWorkSessionsAll,
    }),
    [
      state,
      loaded,
      setupBoss,
      markSubscriptionSeen,
      loginBoss,
      loginChef,
      logout,
      addChef,
      removeChef,
      addObjective,
      removeObjective,
      todayObjectives,
      checkIn,
      checkOut,
      currentWorkSession,
      submitProduction,
      updateProduction,
      deleteProduction,
      submitProblem,
      updateProblem,
      deleteProblem,
      sendReminder,
      markRemindersSeen,
      unseenRemindersForChef,
      callChef,
      unseenCallForChef,
      acknowledgeCall,
      productionsForChef,
      problemsForChef,
      workSessionsForUser,
      todayProductionsAll,
      todayProblemsAll,
      todayWorkSessionsAll,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export { EDIT_WINDOW_MS };
