import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Tone = "primary" | "success" | "warning" | "destructive" | "muted";

interface Props {
  label: string;
  tone?: Tone;
}

export function Badge({ label, tone = "muted" }: Props) {
  const colors = useColors();
  const palette = (() => {
    switch (tone) {
      case "primary":
        return { bg: colors.accent, fg: colors.accentForeground };
      case "success":
        return { bg: "#dcfce7", fg: "#15803d" };
      case "warning":
        return { bg: "#fef9c3", fg: "#854d0e" };
      case "destructive":
        return { bg: "#fee2e2", fg: "#b91c1c" };
      default:
        return { bg: colors.muted, fg: colors.mutedForeground };
    }
  })();
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.bg, borderRadius: 999 },
      ]}
    >
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
