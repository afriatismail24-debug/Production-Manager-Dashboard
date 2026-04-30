import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

const PRESETS = [
  "Please submit your production now.",
  "Don't forget to log any problems from this morning.",
  "End of shift — submit before checking out.",
];

export default function ReminderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sendReminder, chefs } = useApp();
  const [message, setMessage] = useState(PRESETS[0]);
  const [sent, setSent] = useState(false);

  const send = async () => {
    await sendReminder(message);
    setSent(true);
    setTimeout(() => router.back(), 900);
  };

  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <ModalShell
      title="Send a reminder"
      subtitle={`Notifies all ${chefs.length} chef${chefs.length === 1 ? "" : "s"} on their dashboard.`}
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
            Quick presets
          </Text>
          <View style={{ marginTop: 12, gap: 8 }}>
            {PRESETS.map((p) => {
              const active = message === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setMessage(p)}
                  style={[
                    styles.preset,
                    {
                      backgroundColor: active ? colors.accent : colors.muted,
                      borderRadius: colors.radius,
                      borderColor: active ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <Feather
                    name={active ? "check-circle" : "circle"}
                    size={14}
                    color={active ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: "Inter_500Medium",
                      color: colors.foreground,
                      fontSize: 13,
                    }}
                  >
                    {p}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <TextField
            label="Custom message"
            placeholder="Type a custom message…"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
        </Card>

        <Button
          label={sent ? "Reminder sent" : "Send reminder"}
          icon={sent ? "check" : "send"}
          onPress={send}
          disabled={sent || message.trim().length === 0}
          fullWidth
          size="lg"
        />
      </KeyboardAwareScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  preset: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
  },
});
