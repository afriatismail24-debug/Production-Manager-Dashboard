import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ModalShell } from "@/components/ModalShell";
import { TextField } from "@/components/TextField";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { fmtTime } from "@/lib/format";

const PROBLEM_TYPES = [
  "Machine breakdown",
  "Material shortage",
  "Power outage",
  "Quality issue",
  "Supplier delay",
  "Other",
];

export default function ProblemScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string }>();
  const editId = params.editId;
  const app = useApp();

  const editing = useMemo(
    () => (editId ? app.problems.find((p) => p.id === editId) ?? null : null),
    [editId, app.problems],
  );

  const chef = app.chefs.find((c) => c.id === app.session?.userId);

  const [type, setType] = useState<string>(editing?.type ?? PROBLEM_TYPES[0]);
  const [customType, setCustomType] = useState<string>(
    editing && !PROBLEM_TYPES.includes(editing.type) ? editing.type : "",
  );
  const [note, setNote] = useState(editing?.note ?? "");
  const [stoppedAt, setStoppedAt] = useState<number>(
    editing?.stoppedAt ?? Date.now() - 30 * 60 * 1000,
  );
  const [resumedAt, setResumedAt] = useState<number>(
    editing?.resumedAt ?? Date.now(),
  );

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setNote(editing.note);
      setStoppedAt(editing.stoppedAt);
      setResumedAt(editing.resumedAt);
      if (!PROBLEM_TYPES.includes(editing.type)) {
        setCustomType(editing.type);
        setType("Other");
      }
    }
  }, [editing]);

  const submit = async () => {
    if (!chef) return;
    const finalType = type === "Other" ? customType.trim() || "Other" : type;
    if (resumedAt < stoppedAt) {
      Alert.alert("Resume time must be after stop time.");
      return;
    }
    const data = { type: finalType, note, stoppedAt, resumedAt };
    if (editing) {
      await app.updateProblem(editing.id, data);
    } else {
      await app.submitProblem(chef.id, chef.name, data);
    }
    router.back();
  };

  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <ModalShell
      title={editing ? "Edit problem" : "Report a problem"}
      subtitle="Log when work stopped and when you got back to it."
    >
      <KeyboardAwareScrollView
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 18,
          paddingBottom: insets.bottom + webBottom + 24,
          gap: 12,
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
            Problem type
          </Text>
          <View style={styles.chips}>
            {PROBLEM_TYPES.map((t) => {
              const active = type === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.secondary : colors.muted,
                      borderRadius: 999,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? "white" : colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 12,
                    }}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {type === "Other" ? (
            <TextField
              label="Describe the problem type"
              placeholder="e.g. Sewing thread broke"
              value={customType}
              onChangeText={setCustomType}
              containerStyle={{ marginTop: 12 }}
            />
          ) : null}
        </Card>

        <Card>
          <Text
            style={{
              color: colors.foreground,
              fontFamily: "Inter_700Bold",
              fontSize: 15,
            }}
          >
            Timing
          </Text>
          <View style={{ marginTop: 12, gap: 10 }}>
            <TimePicker
              label="When did you stop?"
              value={stoppedAt}
              onChange={setStoppedAt}
            />
            <TimePicker
              label="When did you resume?"
              value={resumedAt}
              onChange={setResumedAt}
              min={stoppedAt}
            />
          </View>
        </Card>

        <Card>
          <TextField
            label="Note"
            placeholder="What happened? How was it solved?"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            style={{ minHeight: 90, textAlignVertical: "top" }}
          />
        </Card>

        <Button
          label={editing ? "Save changes" : "Submit report"}
          icon="check"
          onPress={submit}
          fullWidth
          size="lg"
        />
      </KeyboardAwareScrollView>
    </ModalShell>
  );
}

function TimePicker({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  const colors = useColors();

  const adjust = (deltaMin: number) => {
    let next = value + deltaMin * 60_000;
    if (min !== undefined && next < min) next = min;
    onChange(next);
  };

  return (
    <View>
      <Text
        style={{
          fontFamily: "Inter_500Medium",
          color: colors.mutedForeground,
          fontSize: 13,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <View
        style={[
          styles.timeRow,
          { borderColor: colors.border, borderRadius: colors.radius, backgroundColor: colors.card },
        ]}
      >
        <Pressable onPress={() => adjust(-15)} style={styles.timeBtn}>
          <Text style={[styles.timeBtnText, { color: colors.foreground }]}>
            −15m
          </Text>
        </Pressable>
        <Pressable onPress={() => adjust(-5)} style={styles.timeBtn}>
          <Text style={[styles.timeBtnText, { color: colors.foreground }]}>
            −5m
          </Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 18,
              color: colors.foreground,
            }}
          >
            {fmtTime(value)}
          </Text>
        </View>
        <Pressable onPress={() => adjust(5)} style={styles.timeBtn}>
          <Text style={[styles.timeBtnText, { color: colors.foreground }]}>
            +5m
          </Text>
        </Pressable>
        <Pressable onPress={() => adjust(15)} style={styles.timeBtn}>
          <Text style={[styles.timeBtnText, { color: colors.foreground }]}>
            +15m
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => onChange(Date.now())}
        style={{ marginTop: 6, alignSelf: "flex-end" }}
      >
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            color: colors.primary,
            fontSize: 12,
          }}
        >
          Set to now
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  timeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  timeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
});
