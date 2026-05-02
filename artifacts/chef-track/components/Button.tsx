import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  size?: "sm" | "md" | "lg";
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  fullWidth,
  style,
  size = "md",
  testID,
}: Props) {
  const colors = useColors();

  const palette = (() => {
    switch (variant) {
      case "primary":
        return { bg: colors.primary, fg: colors.primaryForeground, border: colors.primary, ripple: "rgba(255,255,255,0.25)" };
      case "secondary":
        return { bg: colors.secondary, fg: colors.secondaryForeground, border: colors.secondary, ripple: "rgba(255,255,255,0.2)" };
      case "outline":
        return { bg: "transparent", fg: colors.foreground, border: colors.border, ripple: "rgba(0,0,0,0.08)" };
      case "ghost":
        return { bg: "transparent", fg: colors.foreground, border: "transparent", ripple: "rgba(0,0,0,0.06)" };
      case "destructive":
        return { bg: colors.destructive, fg: colors.destructiveForeground, border: colors.destructive, ripple: "rgba(255,255,255,0.25)" };
    }
  })();

  const padV = size === "sm" ? 9 : size === "lg" ? 16 : 13;
  const padH = size === "sm" ? 14 : size === "lg" ? 22 : 18;
  const fontSize = size === "sm" ? 13 : size === "lg" ? 16 : 15;
  const iconSize = size === "sm" ? 15 : size === "lg" ? 20 : 17;

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled || loading}
      android_ripple={
        Platform.OS === "android"
          ? { color: palette.ripple, borderless: false }
          : undefined
      }
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingVertical: padV,
          paddingHorizontal: padH,
          borderRadius: colors.radius,
          opacity: disabled ? 0.5 : (pressed && Platform.OS !== "android") ? 0.82 : 1,
          transform: pressed && Platform.OS !== "android" ? [{ scale: 0.97 }] : [],
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? (
            <Feather name={icon} size={iconSize} color={palette.fg} />
          ) : null}
          <Text style={[styles.label, { color: palette.fg, fontSize }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
