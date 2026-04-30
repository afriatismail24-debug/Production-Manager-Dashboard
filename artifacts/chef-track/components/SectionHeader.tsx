import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  icon?: keyof typeof Feather.glyphMap;
  subtitle?: string;
  right?: React.ReactNode;
}

export function SectionHeader({ title, icon, subtitle, right }: Props) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {icon ? (
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.accent, borderRadius: colors.radius },
            ]}
          >
            <Feather name={icon} size={16} color={colors.accentForeground} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              color: colors.foreground,
              fontSize: 17,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                color: colors.mutedForeground,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
