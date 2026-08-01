import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { useLang } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function Welcome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang } = useLang();

  const isRtl = lang === "ar";
  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#1e293b", "#0f172a"]} style={[styles.hero, { paddingTop: insets.top + webTop + 32 }]}>
        <View style={styles.iconWrap}>
          <Feather name="scissors" size={32} color="#7c3aed" />
        </View>
        <Text style={styles.title}>Stitch<Text style={{ color: "#7c3aed" }}>Track</Text></Text>
        <Text style={[styles.sub, { textAlign: isRtl ? "right" : "center" }]}>{t("tagline")}</Text>
      </LinearGradient>

      <View style={[styles.body, { paddingBottom: insets.bottom + webBottom + 32 }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.cardIcon, { backgroundColor: "rgba(124,58,237,0.1)" }]}>
            <Feather name="briefcase" size={22} color="#7c3aed" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground, textAlign: isRtl ? "right" : "left" }]}>{t("imTheManager")}</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground, textAlign: isRtl ? "right" : "left" }]}>
            {t("managerDesc")}
          </Text>
          <Button
            label={t("createWorkspace")}
            icon="arrow-right"
            onPress={() => router.push("/login")}
            fullWidth
            size="lg"
            style={{ marginTop: 16 }}
          />
        </View>

        <View style={[styles.divider, { borderColor: colors.border }]}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>{t("or")}</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.cardIcon, { backgroundColor: "rgba(59,130,246,0.1)" }]}>
            <Feather name="log-in" size={22} color="#3b82f6" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground, textAlign: isRtl ? "right" : "left" }]}>{t("joinWorkspace")}</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground, textAlign: isRtl ? "right" : "left" }]}>
            {t("joinDesc")}
          </Text>
          <Button
            label={t("enterCode")}
            icon="log-in"
            onPress={() => router.push("/join")}
            fullWidth
            size="lg"
            variant="secondary"
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 28,
    paddingBottom: 36,
    alignItems: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(124,58,237,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: "white",
    fontFamily: "Inter_800ExtraBold",
    fontSize: 36,
    letterSpacing: -1,
  },
  sub: {
    color: "#94a3b8",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginTop: 6,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 4,
    justifyContent: "center",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: "Inter_500Medium", fontSize: 12 },
});
