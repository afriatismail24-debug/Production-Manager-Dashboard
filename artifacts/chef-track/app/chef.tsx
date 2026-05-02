import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import { SectionHeader } from "@/components/SectionHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { fmtCountdown, fmtDuration, fmtTime } from "@/lib/format";

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export default function ChefDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();
  const now = useNow(1000);
  const [checkingIn, setCheckingIn] = useState(false);

  const chef = app.chefs.find((c) => c.id === app.session?.userId);
  const ws = chef ? app.currentWorkSession(chef.id) : null;
  const productions = chef ? app.productionsForChef(chef.id) : [];
  const problems = chef ? app.problemsForChef(chef.id) : [];
  const todayObjectives = app.todayObjectives();
  const reminders = chef ? app.unseenRemindersForChef(chef.id) : [];
  const call = chef ? app.unseenCallForChef(chef.id) : null;

  useFocusEffect(
    useCallback(() => {
      if (chef && reminders.length > 0) {
        // mark seen on focus to clear inbox after viewing
        const t = setTimeout(() => {
          app.markRemindersSeen(chef.id);
        }, 4000);
        return () => clearTimeout(t);
      }
    }, [chef, reminders.length, app]),
  );

  if (!chef) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.mutedForeground }}>Loading…</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    await app.logout();
    router.replace("/login");
  };

  const handleCheckIn = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      await app.checkIn(chef.id, "chef");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      await app.checkOut(chef.id);
    } finally {
      setCheckingIn(false);
    }
  };

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
      <LinearGradient
        colors={["#7c3aed", "#6d28d9"]}
        style={{ paddingTop: insets.top + webTop + 12, paddingBottom: 24 }}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Welcome,</Text>
            <Text style={styles.chefName}>{chef.name}</Text>
          </View>
          <Pressable onPress={handleLogout} hitSlop={10} style={styles.iconBtn}>
            <Feather name="log-out" size={18} color="white" />
          </Pressable>
        </View>

        <View style={styles.shiftCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shiftLabel}>YOUR SHIFT</Text>
            <Text style={styles.shiftValue}>
              {ws
                ? `Active · ${fmtDuration(now - ws.checkInAt)}`
                : "Tap check in to start"}
            </Text>
            {ws ? (
              <Text style={styles.shiftSub}>
                Started {fmtTime(ws.checkInAt)}
              </Text>
            ) : null}
          </View>
          {ws ? (
            <Button
              label={checkingIn ? "Saving…" : "Check out"}
              icon="log-out"
              variant="secondary"
              onPress={handleCheckOut}
              disabled={checkingIn}
            />
          ) : (
            <Button
              label={checkingIn ? "Checking in…" : "Check in"}
              icon="log-in"
              variant="secondary"
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
        {call ? (
          <Card
            style={{
              backgroundColor: colors.secondary,
              borderColor: colors.secondary,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={[
                  styles.callIcon,
                  { backgroundColor: "rgba(124,58,237,0.2)" },
                ]}
              >
                <Feather name="phone-incoming" size={20} color="#a78bfa" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "white",
                    fontFamily: "Inter_700Bold",
                    fontSize: 15,
                  }}
                >
                  The manager is calling you
                </Text>
                <Text
                  style={{
                    color: "#cbd5e1",
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  Please go to the office now.
                </Text>
              </View>
              <Pressable
                onPress={() => app.acknowledgeCall(chef.id)}
                style={[
                  styles.dismissBtn,
                  { borderColor: "rgba(255,255,255,0.2)" },
                ]}
                hitSlop={8}
              >
                <Text style={{ color: "white", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
                  On my way
                </Text>
              </Pressable>
            </View>
          </Card>
        ) : null}

        {reminders.length > 0 ? (
          <Card style={{ backgroundColor: colors.accent, borderColor: colors.accent }}>
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}
            >
              <Feather name="bell" size={18} color={colors.accentForeground} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.accentForeground,
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                  }}
                >
                  Reminder from manager
                </Text>
                {reminders.map((r) => (
                  <Text
                    key={r.id}
                    style={{
                      color: colors.accentForeground,
                      fontFamily: "Inter_500Medium",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {r.message}
                  </Text>
                ))}
              </View>
            </View>
          </Card>
        ) : null}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            label="Submit production"
            icon="plus-circle"
            onPress={() => router.push("/production")}
            disabled={!ws}
            style={{ flex: 1 }}
            size="lg"
          />
          <Button
            label="Report problem"
            icon="alert-triangle"
            variant="destructive"
            onPress={() => router.push("/problem")}
            disabled={!ws}
            style={{ flex: 1 }}
            size="lg"
          />
        </View>
        {!ws ? (
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 12,
              fontFamily: "Inter_500Medium",
              textAlign: "center",
            }}
          >
            Check in first to enable submissions.
          </Text>
        ) : null}

        <Card>
          <SectionHeader
            title="Today's objectives"
            icon="target"
            subtitle="Set by the boss"
          />
          <View style={{ marginTop: 12, gap: 8 }}>
            {todayObjectives.flatMap((o) => o.texts).length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                No objectives set yet.
              </Text>
            ) : (
              todayObjectives.flatMap((o) =>
                o.texts.map((t, i) => (
                  <View key={`${o.id}-${i}`} style={styles.objectiveRow}>
                    <View
                      style={[styles.dot, { backgroundColor: colors.primary }]}
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
            title="My production"
            icon="layers"
            subtitle={`${productions.length} total`}
          />
          <View style={{ marginTop: 12, gap: 10 }}>
            {productions.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                No submissions yet.
              </Text>
            ) : (
              productions.slice(0, 8).map((p) => {
                const editable = now <= p.editableUntil;
                const remaining = Math.max(0, p.editableUntil - now);
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.subCard,
                      {
                        backgroundColor: colors.muted,
                        borderRadius: colors.radius,
                      },
                    ]}
                  >
                    <View style={styles.subHead}>
                      <Text
                        style={{
                          color: colors.mutedForeground,
                          fontSize: 12,
                          fontFamily: "Inter_500Medium",
                        }}
                      >
                        {fmtTime(p.createdAt)}
                      </Text>
                      {editable ? (
                        <Badge
                          tone="warning"
                          label={`Editable · ${fmtCountdown(remaining)}`}
                        />
                      ) : null}
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
                    {editable ? (
                      <View style={styles.editRow}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: "/production",
                              params: { editId: p.id },
                            })
                          }
                          style={[
                            styles.smallBtn,
                            { backgroundColor: colors.card },
                          ]}
                        >
                          <Feather
                            name="edit-2"
                            size={12}
                            color={colors.foreground}
                          />
                          <Text style={[styles.smallBtnText, { color: colors.foreground }]}>
                            Edit
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            Alert.alert(
                              "Delete submission?",
                              "This action cannot be undone.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: () => app.deleteProduction(p.id),
                                },
                              ],
                            );
                          }}
                          style={[
                            styles.smallBtn,
                            { backgroundColor: "#fee2e2" },
                          ]}
                        >
                          <Feather
                            name="trash-2"
                            size={12}
                            color={colors.destructive}
                          />
                          <Text
                            style={[
                              styles.smallBtnText,
                              { color: colors.destructive },
                            ]}
                          >
                            Delete
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        </Card>

        <Card>
          <SectionHeader
            title="My problems"
            icon="alert-triangle"
            subtitle={`${problems.length} total`}
          />
          <View style={{ marginTop: 12, gap: 10 }}>
            {problems.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                No problems reported.
              </Text>
            ) : (
              problems.slice(0, 6).map((p) => {
                const editable = now <= p.editableUntil;
                const remaining = Math.max(0, p.editableUntil - now);
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.subCard,
                      { backgroundColor: "#fef2f2", borderRadius: colors.radius },
                    ]}
                  >
                    <View style={styles.subHead}>
                      <Badge tone="destructive" label={p.type} />
                      {editable ? (
                        <Badge
                          tone="warning"
                          label={`Editable · ${fmtCountdown(remaining)}`}
                        />
                      ) : null}
                    </View>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: 12,
                        marginTop: 6,
                        fontFamily: "Inter_500Medium",
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
                          fontSize: 13,
                          marginTop: 6,
                          fontStyle: "italic",
                        }}
                      >
                        "{p.note}"
                      </Text>
                    ) : null}
                    {editable ? (
                      <View style={styles.editRow}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: "/problem",
                              params: { editId: p.id },
                            })
                          }
                          style={[
                            styles.smallBtn,
                            { backgroundColor: colors.card },
                          ]}
                        >
                          <Feather
                            name="edit-2"
                            size={12}
                            color={colors.foreground}
                          />
                          <Text style={[styles.smallBtnText, { color: colors.foreground }]}>
                            Edit
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            Alert.alert("Delete problem report?", "", [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => app.deleteProblem(p.id),
                              },
                            ]);
                          }}
                          style={[
                            styles.smallBtn,
                            { backgroundColor: "#fee2e2" },
                          ]}
                        >
                          <Feather
                            name="trash-2"
                            size={12}
                            color={colors.destructive}
                          />
                          <Text
                            style={[
                              styles.smallBtnText,
                              { color: colors.destructive },
                            ]}
                          >
                            Delete
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}
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
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.4,
  },
  chefName: {
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
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  shiftCard: {
    marginTop: 22,
    marginHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shiftLabel: {
    color: "rgba(255,255,255,0.7)",
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
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  callIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
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
  subCard: {
    padding: 12,
  },
  subHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  editRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  smallBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
});
