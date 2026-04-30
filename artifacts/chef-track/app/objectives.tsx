import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
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
import { fmtTime } from "@/lib/format";

export default function ObjectivesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addObjective, removeObjective, todayObjectives } = useApp();

  const [items, setItems] = useState<string[]>([""]);

  const update = (i: number, v: string) => {
    setItems((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  };

  const addRow = () => setItems((p) => [...p, ""]);
  const removeRow = (i: number) =>
    setItems((p) => (p.length === 1 ? [""] : p.filter((_, idx) => idx !== i)));

  const submit = async () => {
    const cleaned = items.map((s) => s.trim()).filter((s) => s.length > 0);
    if (cleaned.length === 0) {
      Alert.alert("Add at least one objective.");
      return;
    }
    await addObjective(cleaned);
    setItems([""]);
  };

  const today = todayObjectives();
  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <ModalShell
      title="Workday objectives"
      subtitle="Set today's goals — visible on every chef's dashboard"
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
          <Text
            style={{
              color: colors.foreground,
              fontFamily: "Inter_700Bold",
              fontSize: 15,
            }}
          >
            New objective set
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Tap "Add item" to include more than one in the same set.
          </Text>

          <View style={{ marginTop: 14, gap: 10 }}>
            {items.map((v, i) => (
              <View
                key={i}
                style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}
              >
                <View
                  style={[
                    styles.numCircle,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Text
                    style={{
                      color: colors.accentForeground,
                      fontFamily: "Inter_700Bold",
                      fontSize: 12,
                    }}
                  >
                    {i + 1}
                  </Text>
                </View>
                <TextField
                  value={v}
                  onChangeText={(t) => update(i, t)}
                  placeholder="e.g. Finish 80 black trousers"
                  containerStyle={{ flex: 1 }}
                />
                <Pressable
                  onPress={() => removeRow(i)}
                  style={[
                    styles.numCircle,
                    { backgroundColor: colors.muted },
                  ]}
                  hitSlop={8}
                >
                  <Feather name="minus" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable
            onPress={addRow}
            style={[
              styles.addRow,
              { borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <Feather name="plus" size={16} color={colors.primary} />
            <Text
              style={{
                color: colors.primary,
                fontFamily: "Inter_600SemiBold",
                fontSize: 13,
              }}
            >
              Add item
            </Text>
          </Pressable>

          <Button
            label="Save objectives"
            icon="check"
            onPress={submit}
            style={{ marginTop: 16 }}
            fullWidth
          />
        </Card>

        <Card>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 15,
              }}
            >
              Today's list
            </Text>
            <Badge
              tone="primary"
              label={`${today.flatMap((o) => o.texts).length} items`}
            />
          </View>

          {today.length === 0 ? (
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 13,
                marginTop: 12,
              }}
            >
              No objectives saved yet today.
            </Text>
          ) : (
            <View style={{ marginTop: 12, gap: 12 }}>
              {today.map((o) => (
                <View
                  key={o.id}
                  style={[
                    styles.setBlock,
                    {
                      backgroundColor: colors.muted,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <View style={styles.setHead}>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontFamily: "Inter_500Medium",
                        fontSize: 11,
                        letterSpacing: 0.5,
                      }}
                    >
                      ADDED {fmtTime(o.createdAt).toUpperCase()}
                    </Text>
                    <Pressable
                      onPress={() => removeObjective(o.id)}
                      hitSlop={8}
                    >
                      <Feather
                        name="trash-2"
                        size={14}
                        color={colors.destructive}
                      />
                    </Pressable>
                  </View>
                  {o.texts.map((t, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        paddingVertical: 4,
                      }}
                    >
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
                          fontSize: 14,
                          flex: 1,
                        }}
                      >
                        {t}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </Card>
      </KeyboardAwareScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  numCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  addRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  setBlock: {
    padding: 12,
  },
  setHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
