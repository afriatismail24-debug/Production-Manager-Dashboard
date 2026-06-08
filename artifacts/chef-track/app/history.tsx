import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { ModalShell } from "@/components/ModalShell";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { api, CallData, ProblemData, ProductionData, SyncData, WorkSessionData } from "@/lib/api";
import { generateAndSharePdf } from "@/lib/pdf";

type DateSummary = {
  dateKey: string;
  dateLabel: string;
  chefCount: number;
  totalQty: number;
  problemCount: number;
  sessions: WorkSessionData[];
  productions: ProductionData[];
  problems: ProblemData[];
  calls: CallData[];
};

function toDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const app = useApp();

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<SyncData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.sync(false);
        setHistoryData(data);
      } catch {
        setError("Could not load history. Check your connection.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dateSummaries = useCallback((): DateSummary[] => {
    if (!historyData) return [];

    const dateKeySet = new Set<string>();
    for (const s of historyData.workSessions) {
      dateKeySet.add(toDateKey(s.checkInAt));
    }

    const summaries: DateSummary[] = [];
    for (const key of Array.from(dateKeySet).sort().reverse()) {
      const sessions = historyData.workSessions.filter(
        (s) => toDateKey(s.checkInAt) === key,
      );
      const productions = historyData.productions.filter(
        (p) => toDateKey(p.createdAt) === key,
      );
      const problems = historyData.problems.filter(
        (p) => toDateKey(p.createdAt) === key,
      );
      const calls = (historyData.calls ?? []).filter(
        (c) => toDateKey(c.createdAt) === key,
      );
      const chefSessions = sessions.filter((s) => s.role === "chef");
      const chefCount = new Set(chefSessions.map((s) => s.userId)).size;
      const totalQty = productions.reduce(
        (acc, p) =>
          acc +
          p.items.reduce((s, it) => {
            const n = parseFloat(it.quantity);
            return s + (isNaN(n) ? 0 : n);
          }, 0),
        0,
      );

      summaries.push({
        dateKey: key,
        dateLabel: new Date(key + "T12:00:00").toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        chefCount,
        totalQty,
        problemCount: problems.length,
        sessions,
        productions,
        problems,
        calls,
      });
    }
    return summaries;
  }, [historyData]);

  const handleGeneratePdf = async (summary: DateSummary) => {
    setGeneratingPdf(summary.dateKey);
    try {
      const bossSession =
        summary.sessions.find(
          (w) => w.userId === "boss" && w.checkOutAt !== null,
        ) ?? null;

      const knownChefIds = new Set(
        summary.sessions.filter((s) => s.role === "chef").map((s) => s.userId),
      );
      const historicChefs = Array.from(knownChefIds).map((id) => {
        const known = app.chefs.find((c) => c.id === id);
        const anyProd = summary.productions.find((p) => p.chefId === id);
        return {
          id,
          name: known?.name ?? anyProd?.chefName ?? "Removed operator",
          email: known?.email ?? "",
          password: "",
          order: known?.order ?? 0,
          dailyTarget: null,
          createdAt: 0,
        };
      });

      const objectives =
        historyData?.objectives.filter((o) => o.date === summary.dateKey) ?? [];

      await generateAndSharePdf({
        bossName: app.boss?.name ?? "Manager",
        date: new Date(summary.dateKey + "T12:00:00"),
        chefs: historicChefs,
        objectives,
        workSessions: summary.sessions,
        productions: summary.productions,
        problems: summary.problems,
        bossSession,
        calls: summary.calls,
      });
    } catch (err) {
      Alert.alert("Could not export PDF", String(err));
    } finally {
      setGeneratingPdf(null);
    }
  };

  const webBottom = Platform.OS === "web" ? 34 : 0;
  const summaries = dateSummaries();

  return (
    <ModalShell title="Past shifts" subtitle="Tap the PDF button to download any day's report">
      <ScrollView
        contentContainerStyle={{
          padding: 18,
          paddingBottom: insets.bottom + webBottom + 24,
          gap: 12,
        }}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={{
                color: colors.mutedForeground,
                marginTop: 12,
                fontFamily: "Inter_400Regular",
              }}
            >
              Loading history…
            </Text>
          </View>
        ) : error ? (
          <Card>
            <Text
              style={{
                color: colors.destructive,
                fontFamily: "Inter_500Medium",
              }}
            >
              {error}
            </Text>
          </Card>
        ) : summaries.length === 0 ? (
          <Card>
            <Text
              style={{
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                fontSize: 14,
              }}
            >
              No past shift records found yet.
            </Text>
          </Card>
        ) : (
          summaries.map((summary) => (
            <Card key={summary.dateKey}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dateLabel, { color: colors.foreground }]}>
                    {summary.dateLabel}
                  </Text>
                  <Text
                    style={[styles.dateMeta, { color: colors.mutedForeground }]}
                  >
                    {summary.chefCount} operator
                    {summary.chefCount !== 1 ? "s" : ""} · {summary.totalQty}{" "}
                    pcs · {summary.problemCount} problem
                    {summary.problemCount !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleGeneratePdf(summary)}
                  disabled={generatingPdf === summary.dateKey}
                  style={[
                    styles.pdfBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: generatingPdf === summary.dateKey ? 0.6 : 1,
                    },
                  ]}
                >
                  {generatingPdf === summary.dateKey ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Feather name="file-text" size={16} color="white" />
                  )}
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  dateMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  pdfBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
