import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ModalShell } from "@/components/ModalShell";
import { TextField } from "@/components/TextField";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function OperatorsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { chefs, addChef, removeChef, callChef, currentWorkSession, setChefTarget } = useApp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  // Per-chef target editing state
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [editingTargetValue, setEditingTargetValue] = useState("");
  const [savingTargetId, setSavingTargetId] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError("Name is required.");
    if (!email.trim() || !email.includes("@"))
      return setError("Please enter a valid email.");
    if (
      chefs.some(
        (c) => c.email.trim().toLowerCase() === email.trim().toLowerCase(),
      )
    )
      return setError("An operator with this email already exists.");

    const pw = password.trim() || undefined;
    const chef = await addChef(name, email, pw);
    if (newTarget.trim()) {
      const t = parseInt(newTarget.trim(), 10);
      if (!isNaN(t) && t > 0) {
        await setChefTarget(chef.id, t);
      }
    }
    setLastCreated({ name: chef.name, email: chef.email, password: chef.password });
    setName("");
    setEmail("");
    setPassword("");
    setNewTarget("");
  };

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Password copied to clipboard.");
  };

  const startEditTarget = (chef: { id: string; dailyTarget: number | null }) => {
    setEditingTargetId(chef.id);
    setEditingTargetValue(chef.dailyTarget != null ? String(chef.dailyTarget) : "");
  };

  const saveTarget = async (chefId: string) => {
    setSavingTargetId(chefId);
    try {
      const raw = editingTargetValue.trim();
      const t = raw ? parseInt(raw, 10) : null;
      await setChefTarget(chefId, isNaN(t as number) ? null : t);
    } finally {
      setSavingTargetId(null);
      setEditingTargetId(null);
    }
  };

  const webBottom = Platform.OS === "web" ? 34 : 0;
  const autoPass = String(chefs.length + 1).repeat(6);

  return (
    <ModalShell
      title="Manage operators"
      subtitle="Add or remove team members and set daily targets."
    >
      <KeyboardAwareScrollView
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 18,
          paddingBottom: insets.bottom + webBottom + 24,
          gap: 14,
        }}
      >
        <Card>
          <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 15 }}>
            Add an operator
          </Text>

          <View style={{ marginTop: 14, gap: 10 }}>
            <TextField
              label="Operator name"
              placeholder="e.g. Maya Lopez"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextField
              label="Email"
              placeholder="operator@workshop.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              errorText={error ?? undefined}
            />
            <TextField
              label={`Password (leave blank for auto: ${autoPass})`}
              placeholder={`Auto: ${autoPass}`}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              secureTextEntry={false}
            />
            <TextField
              label="Daily target (pieces, optional)"
              placeholder="e.g. 80"
              value={newTarget}
              onChangeText={setNewTarget}
              keyboardType="numeric"
            />
          </View>

          <Button
            label="Create operator account"
            icon="user-plus"
            onPress={submit}
            fullWidth
            style={{ marginTop: 14 }}
          />
        </Card>

        {lastCreated ? (
          <Card
            style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
          >
            <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
              <Feather name="check-circle" size={18} color={colors.accentForeground} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.accentForeground, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                  Operator created — share these credentials
                </Text>
                <Text style={{ color: colors.accentForeground, fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 6 }}>
                  {lastCreated.name} · {lastCreated.email}
                </Text>
                <Pressable
                  onPress={() => copy(lastCreated.password)}
                  style={[styles.passBox, { backgroundColor: "rgba(255,255,255,0.6)" }]}
                >
                  <Text style={styles.passText}>{lastCreated.password}</Text>
                  <Feather name="copy" size={14} color={colors.accentForeground} />
                </Pressable>
              </View>
            </View>
          </Card>
        ) : null}

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 15 }}>
              Team
            </Text>
            <Badge tone="primary" label={`${chefs.length} operators`} />
          </View>

          {chefs.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 12 }}>
              No operators yet.
            </Text>
          ) : (
            <View style={{ marginTop: 12, gap: 10 }}>
              {chefs.map((chef) => {
                const ws = currentWorkSession(chef.id);
                const isEditingTarget = editingTargetId === chef.id;
                return (
                  <View
                    key={chef.id}
                    style={[
                      styles.row,
                      { borderColor: colors.border, borderRadius: colors.radius },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", color: colors.foreground, fontSize: 14 }}>
                          {chef.name}
                        </Text>
                        <Badge tone={ws ? "success" : "muted"} label={ws ? "On shift" : "Off"} />
                      </View>
                      <Text style={{ fontFamily: "Inter_400Regular", color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                        {chef.email}
                      </Text>
                      <Pressable
                        onPress={() => copy(chef.password)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}
                      >
                        <Feather name="key" size={11} color={colors.mutedForeground} />
                        <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground, fontSize: 12, letterSpacing: 1 }}>
                          {chef.password}
                        </Text>
                        <Feather name="copy" size={11} color={colors.mutedForeground} />
                      </Pressable>

                      {/* Daily target row */}
                      {isEditingTarget ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                          <Feather name="target" size={12} color={colors.primary} />
                          <TextInput
                            value={editingTargetValue}
                            onChangeText={setEditingTargetValue}
                            keyboardType="numeric"
                            placeholder="pcs/day"
                            placeholderTextColor={colors.mutedForeground}
                            style={{
                              flex: 1,
                              borderWidth: 1,
                              borderColor: colors.primary,
                              borderRadius: 8,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              fontFamily: "Inter_500Medium",
                              fontSize: 13,
                              color: colors.foreground,
                            }}
                            autoFocus
                          />
                          <Pressable
                            onPress={() => saveTarget(chef.id)}
                            disabled={savingTargetId === chef.id}
                            style={[styles.smallBtn, { backgroundColor: colors.primary }]}
                          >
                            <Feather name="check" size={13} color="white" />
                          </Pressable>
                          <Pressable
                            onPress={() => setEditingTargetId(null)}
                            style={[styles.smallBtn, { backgroundColor: colors.muted }]}
                          >
                            <Feather name="x" size={13} color={colors.mutedForeground} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => startEditTarget(chef)}
                          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}
                        >
                          <Feather name="target" size={11} color={colors.primary} />
                          <Text style={{ fontFamily: "Inter_500Medium", color: chef.dailyTarget ? colors.primary : colors.mutedForeground, fontSize: 12 }}>
                            {chef.dailyTarget ? `Target: ${chef.dailyTarget} pcs/day` : "Set daily target"}
                          </Text>
                          <Feather name="edit-2" size={10} color={colors.mutedForeground} />
                        </Pressable>
                      )}
                    </View>
                    <View style={{ gap: 6 }}>
                      <Pressable
                        onPress={() => callChef(chef.id, chef.name)}
                        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      >
                        <Feather name="phone-call" size={14} color="white" />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Alert.alert(
                            "Remove operator?",
                            `${chef.name} will lose access immediately.`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Remove",
                                style: "destructive",
                                onPress: () => removeChef(chef.id),
                              },
                            ],
                          );
                        }}
                        style={[styles.actionBtn, { backgroundColor: "#fee2e2" }]}
                      >
                        <Feather name="user-minus" size={14} color={colors.destructive} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      </KeyboardAwareScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 12,
    borderWidth: 1,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  passBox: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  passText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: 4,
    color: "#4c1d95",
  },
});
