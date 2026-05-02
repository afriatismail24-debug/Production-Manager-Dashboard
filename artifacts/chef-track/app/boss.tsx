import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ShareCodeModal } from "@/components/ShareCodeModal";
import { SectionHeader } from "@/components/SectionHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { fmtDateTime, fmtDuration, fmtTime } from "@/lib/format";
import { generateAndSharePdf } from "@/lib/pdf";

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export default function BossDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();
  const now = useNow(1000);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const handleCopyCode = async () => {
    if (!app.joinCode) return;
    await Clipboard.setStringAsync(app.joinCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const bossWs = app.currentWorkSession("boss");
  const todayObjectives = app.todayObjectives();
  const todayProductions = app.todayProductionsAll();
  const todayProblems = app.todayProblemsAll();
  const todayWorkSessions = app.todayWorkSessionsAll();

  const totalQty = useMemo(() => {
    return todayProductions.reduce((acc, p) => {
      return (
        acc +
        p.items.reduce((s, it) => {
          const n = parseFloat(it.quantity);
          return s + (isNaN(n) ? 0 : n);
        }, 0)
      );
    }, 0);
  }, [todayProductions]);

  const activeChefIds = new Set(
    app.workSessions
      .filter((w) => w.checkOutAt === null && w.role === "chef")
      .map((w) => w.userId),
  );

  const handleCheckIn = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    try { await app.checkIn("boss", "boss"); } finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      await app.checkOut("boss");
      const date = new Date();
      const allChefs = app.chefs;
      try {
        await generateAndSharePdf({
          bossName: app.boss?.name ?? "Boss",
          date,
          chefs: allChefs,
          objectives: app.todayObjectives(),
          workSessions: app.todayWorkSessionsAll(),
          productions: app.todayProductionsAll(),
          problems: app.todayProblemsAll(),
          bossSession: app.workSessions.find(
            (w) => w.userId === "boss" && w.checkOutAt !== null,
          ) ?? null,
        });
      } catch (err) {
        Alert.alert("Could not export PDF", String(err));
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleLogout = async () => {
    await app.logout();
    router.replace("/login");
  };

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      <LinearGradient
        colors={["#1e293b", "#0f172a"]}
        style={{ paddingTop: insets.top + webTop + 12, paddingBottom: 24 }}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.bossName}>{app.boss?.name ?? "Boss"}</Text>
          </View>
          <Pressable
            onPress={handleLogout}
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Feather name="log-out" size={18} color="#cbd5e1" />
          </Pressable>
        </View>

        {app.joinCode ? (
          <>
            <Pressable
              onPress={handleCopyCode}
              style={styles.codeBar}
            >
              <Feather name="users" size={13} color="#7c3aed" />
              <Text style={styles.codeBarLabel}>Join code:</Text>
              <Text style={styles.codeBarValue}>{app.joinCode}</Text>
              <Feather
                name={codeCopied ? "check" : "copy"}
                size={13}
                color={codeCopied ? "#4ade80" : "#94a3b8"}
              />
              <Pressable
                onPress={() => setShowShare(true)}
                hitSlop={8}
                style={styles.shareBtn}
              >
                <Feather name="share-2" size={13} color="#7c3aed" />
                <Text style={{ color: "#7c3aed", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
                  Share
                </Text>
              </Pressable>
            </Pressable>
            <ShareCodeModal
              visible={showShare}
              joinCode={app.joinCode}
              onClose={() => setShowShare(false)}
            />
          </>
        ) : null}

        <View style={styles.shiftCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shiftLabel}>YOUR SHIFT</Text>
            <Text style={styles.shiftValue}>
              {bossWs
                ? `Active · ${fmtDuration(now - bossWs.checkInAt)}`
                : "Not checked in"}
            </Text>
            {bossWs ? (
              <Text style={styles.shiftSub}>
                Started {fmtTime(bossWs.checkInAt)}
              </Text>
            ) : null}
          </View>
          {bossWs ? (
            <Button
              label={checkingIn ? "Saving…" : "Check out"}
              icon="log-out"
              variant="destructive"
              onPress={handleCheckOut}
              disabled={checkingIn}
            />
          ) : (
            <Button
              label={checkingIn ? "Checking in…" : "Check in"}
              icon="log-in"
              onPress={handleCheckIn}
              disabled={checkingIn}
            />
          )}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{
          padding: 18,
          paddingBottom: insets.bottom + webBottom + 24,
          gap: 14,
        }}
      >
        <View style={styles.statsRow}>
          <Card style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              OPERATORS ON SHIFT
            </Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {activeChefIds.size}
              <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>
                {" "}/ {app.chefs.length}
              </Text>
            </Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              TOTAL QTY TODAY
            </Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {totalQty}
            </Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              PROBLEMS
            </Text>
            <Text style={[styles.statValue, { color: colors.destructive }]}>
              {todayProblems.length}
            </Text>
          </Card>
        </View>

        <View style={styles.actionRow}>
          <Button
            label="Objectives"
            icon="target"
            variant="secondary"
            onPress={() => router.push("/objectives")}
            style={{ flex: 1 }}
          />
          <Button
            label="Reminder"
            icon="bell"
            variant="outline"
            onPress={() => router.push("/reminder")}
            style={{ flex: 1 }}
          />
        </View>
        <Button
          label="Manage operators"
          icon="users"
          onPress={() => router.push("/chefs")}
          fullWidth
          variant="primary"
        />
        <Button
          label="Download today's PDF"
          icon="download"
          variant="outline"
          fullWidth
          onPress={async () => {
            try {
              await generateAndSharePdf({
                bossName: app.boss?.name ?? "Boss",
                date: new Date(),
                chefs: app.chefs,
                objectives: app.todayObjectives(),
                workSessions: app.todayWorkSessionsAll(),
                productions: app.todayProductionsAll(),
                problems: app.todayProblemsAll(),
                bossSession:
                  app.workSessions.find((w) => w.userId === "boss") ?? null,
              });
            } catch (err) {
              Alert.alert("Could not export PDF", String(err));
            }
          }}
        />

        <Card>
          <SectionHeader
            title="Today's objectives"
            icon="target"
            subtitle={`${todayObjectives.flatMap((o) => o.texts).length} items`}
          />
          <View style={{ marginTop: 12, gap: 8 }}>
            {todayObjectives.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                No objectives yet. Tap "Objectives" to add your goals for the day.
              </Text>
            ) : (
              todayObjectives.flatMap((o) =>
                o.texts.map((t, i) => (
                  <View key={`${o.id}-${i}`} style={styles.objectiveRow}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_500Medium",
                        flex: 1,
                        fontSize: 14,
                      }}
                    >
                      {t}
                    </Text>
                  </View>
                )),
              )
            )}
          </View>
        </Card>

        <Card>
          <SectionHeader
            title="Team activity"
            icon="users"
            subtitle="Live status of every operator"
          />
          <View style={{ marginTop: 12, gap: 10 }}>
            {app.chefs.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                No operators yet. Add your first operator from "Manage operators".
              </Text>
            ) : (
              app.chefs.map((chef) => {
                const ws = app.currentWorkSession(chef.id);
                const todayProd = todayProductions.filter(
                  (p) => p.chefId === chef.id,
                );
                const todayProb = todayProblems.filter(
                  (p) => p.chefId === chef.id,
                );
                const qty = todayProd.reduce(
                  (acc, p) =>
                    acc +
                    p.items.reduce((s, it) => {
                      const n = parseFloat(it.quantity);
                      return s + (isNaN(n) ? 0 : n);
                    }, 0),
                  0,
                );
                return (
                  <View
                    key={chef.id}
                    style={[
                      styles.chefRow,
                      {
                        borderColor: colors.border,
                        borderRadius: colors.radius,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "Inter_600SemiBold",
                            color: colors.foreground,
                            fontSize: 15,
                          }}
                        >
                          {chef.name}
                        </Text>
                        <Badge
                          tone={ws ? "success" : "muted"}
                          label={ws ? "On shift" : "Off"}
                        />
                      </View>
                      <Text
                        style={{
                          color: colors.mutedForeground,
                          fontFamily: "Inter_400Regular",
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {todayProd.length} submission{todayProd.length === 1 ? "" : "s"} ·
                        {" "}{qty} pcs · {todayProb.length} problem
                        {todayProb.length === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => app.callChef(chef.id, chef.name)}
                      style={[
                        styles.callBtn,
                        { backgroundColor: colors.primary },
                      ]}
                      hitSlop={6}
                    >
                      <Feather name="phone-call" size={14} color="white" />
                      <Text style={styles.callText}>Call</Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        </Card>

        <Card>
          <SectionHeader
            title="Production submissions"
            icon="layers"
            subtitle={`${todayProductions.length} today`}
          />
          <View style={{ marginTop: 12, gap: 10 }}>
            {todayProductions.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                No production submitted yet today.
              </Text>
            ) : (
              todayProductions.map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.submissionCard,
                    {
                      backgroundColor: colors.muted,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <View style={styles.submissionHead}>
                    <Text
                      style={{
                        fontFamily: "Inter_600SemiBold",
                        color: colors.foreground,
                        fontSize: 14,
                      }}
                    >
                      {p.chefName}
                    </Text>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: 12,
                        fontFamily: "Inter_500Medium",
                      }}
                    >
                      {fmtTime(p.createdAt)}
                    </Text>
                  </View>
                  {p.items.map((it, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Text
                        style={{
                          fontFamily: "Inter_500Medium",
                          color: colors.foreground,
                          fontSize: 13,
                          flex: 1,
                        }}
                      >
                        {it.name}
                        {it.color ? (
                          <Text style={{ color: colors.mutedForeground }}>
                            {" · "}{it.color}
                          </Text>
                        ) : null}
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter_700Bold",
                          color: colors.primary,
                          fontSize: 14,
                        }}
                      >
                        {it.quantity}
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        </Card>

        <Card>
          <SectionHeader
            title="Problems reported"
            icon="alert-triangle"
            subtitle={`${todayProblems.length} today`}
          />
          <View style={{ marginTop: 12, gap: 10 }}>
            {todayProblems.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                No problems reported. Smooth sailing.
              </Text>
            ) : (
              todayProblems.map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.submissionCard,
                    {
                      backgroundColor: "#fef2f2",
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <View style={styles.submissionHead}>
                    <Text
                      style={{
                        fontFamily: "Inter_600SemiBold",
                        color: colors.foreground,
                        fontSize: 14,
                      }}
                    >
                      {p.chefName}
                    </Text>
                    <Badge tone="destructive" label={p.type} />
                  </View>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    Stopped {fmtTime(p.stoppedAt)} · Resumed {fmtTime(p.resumedAt)}
                    {" · "}
                    {fmtDuration(p.resumedAt - p.stoppedAt)} downtime
                  </Text>
                  {p.note ? (
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_400Regular",
                        fontSize: 13,
                        marginTop: 6,
                        fontStyle: "italic",
                      }}
                    >
                      "{p.note}"
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </Card>

        <Card>
          <SectionHeader
            title="Check-in history"
            icon="clock"
            subtitle="Today's shifts"
          />
          <View style={{ marginTop: 12, gap: 8 }}>
            {todayWorkSessions.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                No check-ins recorded today.
              </Text>
            ) : (
              todayWorkSessions.map((w) => {
                const userName =
                  w.userId === "boss"
                    ? `${app.boss?.name ?? "Boss"} (you)`
                    : app.chefs.find((c) => c.id === w.userId)?.name ??
                      "Removed chef";
                return (
                  <View key={w.id} style={styles.sessionRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "Inter_500Medium",
                          color: colors.foreground,
                          fontSize: 13,
                        }}
                      >
                        {userName}
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter_400Regular",
                          color: colors.mutedForeground,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {fmtDateTime(w.checkInAt)}
                        {" → "}
                        {w.checkOutAt ? fmtTime(w.checkOutAt) : "active"}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: w.checkOutAt
                          ? colors.mutedForeground
                          : colors.success,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 12,
                      }}
                    >
                      {fmtDuration(
                        (w.checkOutAt ?? now) - w.checkInAt,
                      )}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  greeting: {
    color: "#94a3b8",
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.4,
  },
  bossName: {
    color: "white",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  codeBar: {
    marginTop: 16,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(249,115,22,0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.2)",
  },
  codeBarLabel: {
    color: "#94a3b8",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  codeBarValue: {
    color: "white",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    letterSpacing: 2,
    flex: 1,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(249,115,22,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 4,
  },
  shiftCard: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shiftLabel: {
    color: "#94a3b8",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  shiftValue: {
    color: "white",
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginTop: 4,
  },
  shiftSub: {
    color: "#cbd5e1",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  stat: {
    flex: 1,
    padding: 14,
  },
  statLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 0.6,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  objectiveRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderWidth: 1,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  callText: {
    color: "white",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  submissionCard: {
    padding: 12,
    gap: 4,
  },
  submissionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
});
