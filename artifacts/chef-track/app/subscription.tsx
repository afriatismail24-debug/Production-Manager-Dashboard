import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const PERKS: { icon: keyof typeof Feather.glyphMap; title: string; desc: string }[] = [
  {
    icon: "users",
    title: "Manage your whole team",
    desc: "Add or remove chefs in seconds. Passwords are auto-generated for you.",
  },
  {
    icon: "trending-up",
    title: "See production in real time",
    desc: "Every submission lands on your dashboard the moment a chef hits send.",
  },
  {
    icon: "file-text",
    title: "One-tap PDF reports",
    desc: "Check out and a clean daily report downloads automatically.",
  },
  {
    icon: "bell",
    title: "Reminders & callbacks",
    desc: "Nudge a chef to submit, or call any of them straight to your office.",
  },
];

export default function Subscription() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { markSubscriptionSeen } = useApp();

  const handleStart = async () => {
    await markSubscriptionSeen();
    router.replace("/boss");
  };

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <LinearGradient
      colors={["#fafaf9", "#fff7ed"]}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + webTop + 12,
          paddingBottom: insets.bottom + webBottom + 24,
          paddingHorizontal: 24,
          justifyContent: "space-between",
        }}
      >
        <View>
          <View style={styles.badge}>
            <Feather name="star" size={12} color="#92400e" />
            <Text style={styles.badgeText}>FREE PREVIEW</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Run your workshop{"\n"}with confidence.
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Everything you need to track production, problems and people — all in one
            place. Start free, upgrade whenever you're ready.
          </Text>

          <View style={{ marginTop: 28, gap: 14 }}>
            {PERKS.map((p) => (
              <View key={p.title} style={styles.perk}>
                <View
                  style={[
                    styles.perkIcon,
                    { backgroundColor: colors.accent, borderRadius: colors.radius },
                  ]}
                >
                  <Feather name={p.icon} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      color: colors.foreground,
                      fontSize: 15,
                    }}
                  >
                    {p.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      color: colors.mutedForeground,
                      fontSize: 13,
                      lineHeight: 18,
                      marginTop: 2,
                    }}
                  >
                    {p.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Button
            label="Get started"
            icon="arrow-right"
            onPress={handleStart}
            size="lg"
            fullWidth
          />
          <Text
            style={{
              textAlign: "center",
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 11,
            }}
          >
            No payment required. Subscription unlocks advanced reporting later.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#92400e",
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: -0.8,
    lineHeight: 38,
    marginTop: 18,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  perk: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  perkIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
