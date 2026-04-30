import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
  errorText?: string;
}

export function TextField({
  label,
  containerStyle,
  errorText,
  style,
  ...rest
}: Props) {
  const colors = useColors();
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? (
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            color: colors.mutedForeground,
            fontSize: 13,
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            borderColor: errorText ? colors.destructive : colors.input,
            backgroundColor: colors.card,
            color: colors.foreground,
            borderRadius: colors.radius,
          },
          style,
        ]}
        {...rest}
      />
      {errorText ? (
        <Text
          style={{
            color: colors.destructive,
            fontFamily: "Inter_500Medium",
            fontSize: 12,
          }}
        >
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
});
