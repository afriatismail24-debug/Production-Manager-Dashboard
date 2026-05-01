import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  api,
  CallData,
  ChefData,
  ObjectiveData,
  ProblemData,
  ProductionData,
  ProductionItem,
  ReminderData,
  SyncData,
  WorkSessionData,
} from "@/lib/api";

const SESSION_KEY = "@chef_session_v2";
const NETWORK_KEY = "@chef_network_v2";
const POLL_INTERVAL = 5000;

export const EDIT_WINDOW_MS = 15 * 60 * 1000;

export type Role = "boss" | "chef";

export interface Session {
  role: Role;
  userId: string;
  chefId?: string;
  chefName?: string;
  bossName?: string;
  bossEmail?: string;
}

interface AppContextValue {
  loaded: boolean;
  networkId: string | null;
  networkChanged: boolean;

  boss: { name: string; email: string } | null;
  subscriptionSeen: boolean;
  session: Session | null;

  chefs: ChefData[];
  workSessions: WorkSessionData[];
  productions: ProductionData[];
  problems: ProblemData[];
  objectives: ObjectiveData[];
  reminders: Array<ReminderData & { seenBy: string[] }>;
  calls: CallData[];

  setupBoss: (name: string, email: string, password: string) => Promise<void>;
  markSubscriptionSeen: () => Promise<void>;
  loginBoss: (email: string, password: string) => Promise<boolean>;
  loginChef: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  acceptNetworkChange: () => Promise<void>;

  addChef: (name: string, email: string) => Promise<ChefData>;
  removeChef: (id: string) => Promise<void>;

  addObjective: (texts: string[]) => Promise<void>;
  removeObjective: (id: string) => Promise<void>;

  checkIn: (userId: string, role: Role) => Promise<void>;
  checkOut: (userId: string) => Promise<WorkSessionData | null>;
  currentWorkSession: (userId: string) => WorkSessionData | null;

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
    data: { type: string; note: string; stoppedAt: number; resumedAt: number },
  ) => Promise<void>;
  updateProblem: (
    id: string,
    data: { type: string; note: string; stoppedAt: number; resumedAt: number },
  ) => Promise<void>;
  deleteProblem: (id: string) => Promise<void>;

  sendReminder: (message: string) => Promise<void>;
  markRemindersSeen: (chefId: string) => Promise<void>;
  unseenRemindersForChef: (chefId: string) => ReminderData[];
  callChef: (chefId: string, chefName: string) => Promise<void>;
  unseenCallForChef: (chefId: string) => CallData | null;
  acknowledgeCall: (chefId: string) => Promise<void>;

  productionsForChef: (chefId: string) => ProductionData[];
  problemsForChef: (chefId: string) => ProblemData[];

  todayObjectives: () => ObjectiveData[];
  todayProductionsAll: () => ProductionData[];
  todayProblemsAll: () => ProblemData[];
  todayWorkSessionsAll: () => WorkSessionData[];

  refetch: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [networkId, setNetworkId] = useState<string | null>(null);
  const [networkChanged, setNetworkChanged] = useState(false);
  const [boss, setBoss] = useState<{ name: string; email: string } | null>(null);
  const [subscriptionSeen, setSubscriptionSeen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [syncData, setSyncData] = useState<SyncData>({
    chefs: [],
    workSessions: [],
    productions: [],
    problems: [],
    objectives: [],
    reminders: [],
    calls: [],
  });

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const doSync = useCallback(async () => {
    try {
      const data = await api.sync(true);
      setSyncData(data);
    } catch {
      // silently ignore poll errors
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimer.current) return;
    pollTimer.current = setInterval(doSync, POLL_INTERVAL);
  }, [doSync]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [savedSession, savedNetwork] = await Promise.all([
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(NETWORK_KEY),
        ]);

        const info = await api.workspace.get();
        const currentNetworkId = info.networkId;

        if (savedNetwork && savedNetwork !== currentNetworkId) {
          await AsyncStorage.removeItem(SESSION_KEY);
          setNetworkChanged(true);
          setNetworkId(currentNetworkId);
          setLoaded(true);
          return;
        }

        await AsyncStorage.setItem(NETWORK_KEY, currentNetworkId);
        setNetworkId(currentNetworkId);

        if (info.exists) {
          setBoss({ name: info.bossName!, email: info.bossEmail! });
          setSubscriptionSeen(info.subscriptionSeen ?? false);
        }

        if (savedSession) {
          const s: Session = JSON.parse(savedSession);
          setSession(s);
          startPolling();
          await doSync();
        }
      } catch {
        // offline or server down — load minimal state
      } finally {
        setLoaded(true);
      }
    })();

    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (session) {
      startPolling();
      doSync();
    } else {
      stopPolling();
    }
  }, [session]);

  const setupBoss = useCallback(async (name: string, email: string, password: string) => {
    const r = await api.workspace.setup(name, email, password);
    await AsyncStorage.setItem(NETWORK_KEY, r.networkId);
    setNetworkId(r.networkId);
    setBoss({ name, email });
    const s: Session = { role: "boss", userId: "boss", bossName: name, bossEmail: email };
    setSession(s);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }, []);

  const markSubscriptionSeen = useCallback(async () => {
    await api.workspace.subscriptionSeen();
    setSubscriptionSeen(true);
  }, []);

  const loginBoss = useCallback(async (email: string, password: string) => {
    try {
      const r = await api.workspace.loginBoss(email, password);
      const s: Session = { role: "boss", userId: "boss", bossName: r.name, bossEmail: r.email };
      setSession(s);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
      setBoss({ name: r.name, email: r.email });
      return true;
    } catch {
      return false;
    }
  }, []);

  const loginChef = useCallback(async (email: string, password: string) => {
    try {
      const r = await api.workspace.loginChef(email, password);
      const s: Session = { role: "chef", userId: r.chefId, chefId: r.chefId, chefName: r.name };
      setSession(s);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const acceptNetworkChange = useCallback(async () => {
    try {
      const info = await api.workspace.get();
      await AsyncStorage.setItem(NETWORK_KEY, info.networkId);
      setNetworkId(info.networkId);
      setNetworkChanged(false);
      setSession(null);
      setBoss(null);
      setSubscriptionSeen(false);
      setSyncData({ chefs: [], workSessions: [], productions: [], problems: [], objectives: [], reminders: [], calls: [] });
    } catch {
      setNetworkChanged(false);
    }
  }, []);

  const addChef = useCallback(async (name: string, email: string) => {
    const chef = await api.chefs.add(name, email);
    await doSync();
    return chef;
  }, [doSync]);

  const removeChef = useCallback(async (id: string) => {
    await api.chefs.remove(id);
    await doSync();
  }, [doSync]);

  const addObjective = useCallback(async (texts: string[]) => {
    await api.objectives.add(texts);
    await doSync();
  }, [doSync]);

  const removeObjective = useCallback(async (id: string) => {
    await api.objectives.remove(id);
    await doSync();
  }, [doSync]);

  const checkIn = useCallback(async (userId: string, role: Role) => {
    await api.sessions.checkIn(userId, role);
    await doSync();
  }, [doSync]);

  const checkOut = useCallback(async (userId: string) => {
    try {
      const ws = await api.sessions.checkOut(userId);
      await doSync();
      return ws;
    } catch {
      return null;
    }
  }, [doSync]);

  const currentWorkSession = useCallback(
    (userId: string) => {
      return syncData.workSessions.find((w) => w.userId === userId && w.checkOutAt === null) ?? null;
    },
    [syncData.workSessions],
  );

  const submitProduction = useCallback(async (chefId: string, chefName: string, items: ProductionItem[]) => {
    await api.productions.submit(chefId, chefName, items);
    await doSync();
  }, [doSync]);

  const updateProduction = useCallback(async (id: string, items: ProductionItem[]) => {
    await api.productions.update(id, items);
    await doSync();
  }, [doSync]);

  const deleteProduction = useCallback(async (id: string) => {
    await api.productions.delete(id);
    await doSync();
  }, [doSync]);

  const submitProblem = useCallback(async (
    chefId: string,
    chefName: string,
    data: { type: string; note: string; stoppedAt: number; resumedAt: number },
  ) => {
    await api.problems.submit(chefId, chefName, data);
    await doSync();
  }, [doSync]);

  const updateProblem = useCallback(async (
    id: string,
    data: { type: string; note: string; stoppedAt: number; resumedAt: number },
  ) => {
    await api.problems.update(id, data);
    await doSync();
  }, [doSync]);

  const deleteProblem = useCallback(async (id: string) => {
    await api.problems.delete(id);
    await doSync();
  }, [doSync]);

  const sendReminder = useCallback(async (message: string) => {
    await api.reminders.send(message);
    await doSync();
  }, [doSync]);

  const markRemindersSeen = useCallback(async (chefId: string) => {
    await api.reminders.markSeen(chefId);
    setSyncData((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) =>
        r.seenBy.includes(chefId) ? r : { ...r, seenBy: [...r.seenBy, chefId] },
      ),
    }));
  }, []);

  const unseenRemindersForChef = useCallback(
    (chefId: string) => {
      return syncData.reminders.filter((r) => !r.seenBy.includes(chefId));
    },
    [syncData.reminders],
  );

  const callChef = useCallback(async (chefId: string, chefName: string) => {
    await api.calls.call(chefId, chefName);
    await doSync();
  }, [doSync]);

  const unseenCallForChef = useCallback(
    (chefId: string) => {
      return syncData.calls.find((c) => c.chefId === chefId && !c.seen) ?? null;
    },
    [syncData.calls],
  );

  const acknowledgeCall = useCallback(async (chefId: string) => {
    await api.calls.acknowledge(chefId);
    setSyncData((prev) => ({
      ...prev,
      calls: prev.calls.map((c) =>
        c.chefId === chefId && !c.seen ? { ...c, seen: true } : c,
      ),
    }));
  }, []);

  const productionsForChef = useCallback(
    (chefId: string) => syncData.productions.filter((p) => p.chefId === chefId),
    [syncData.productions],
  );

  const problemsForChef = useCallback(
    (chefId: string) => syncData.problems.filter((p) => p.chefId === chefId),
    [syncData.problems],
  );

  const todayObjectives = useCallback(() => syncData.objectives, [syncData.objectives]);

  const todayProductionsAll = useCallback(() => syncData.productions, [syncData.productions]);

  const todayProblemsAll = useCallback(() => syncData.problems, [syncData.problems]);

  const todayWorkSessionsAll = useCallback(() => syncData.workSessions, [syncData.workSessions]);

  const value = useMemo<AppContextValue>(
    () => ({
      loaded,
      networkId,
      networkChanged,
      boss,
      subscriptionSeen,
      session,
      chefs: syncData.chefs,
      workSessions: syncData.workSessions,
      productions: syncData.productions,
      problems: syncData.problems,
      objectives: syncData.objectives,
      reminders: syncData.reminders,
      calls: syncData.calls,
      setupBoss,
      markSubscriptionSeen,
      loginBoss,
      loginChef,
      logout,
      acceptNetworkChange,
      addChef,
      removeChef,
      addObjective,
      removeObjective,
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
      todayObjectives,
      todayProductionsAll,
      todayProblemsAll,
      todayWorkSessionsAll,
      refetch: doSync,
    }),
    [
      loaded, networkId, networkChanged, boss, subscriptionSeen, session, syncData,
      setupBoss, markSubscriptionSeen, loginBoss, loginChef, logout, acceptNetworkChange,
      addChef, removeChef, addObjective, removeObjective, checkIn, checkOut,
      currentWorkSession, submitProduction, updateProduction, deleteProduction,
      submitProblem, updateProblem, deleteProblem, sendReminder, markRemindersSeen,
      unseenRemindersForChef, callChef, unseenCallForChef, acknowledgeCall,
      productionsForChef, problemsForChef, todayObjectives, todayProductionsAll,
      todayProblemsAll, todayWorkSessionsAll, doSync,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
