import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { useLang } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { Lang, LANGUAGE_FLAGS, LANGUAGE_NAMES, LANGS } from "@/lib/i18n";

export default function LanguageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang: currentLang, setLang, t } = useLang();

  const [selected, setSelected] = useState<Lang>(currentLang);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  const handleContinue = async () => {
    await setLang(selected);
    router.replace("/welcome");
  };

  const isArabic = selected === "ar";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#1e293b", "#0f172a"]}
        style={[styles.hero, { paddingTop: insets.top + webTop + 40 }]}
      >
        <View style={styles.iconWrap}>
          <Feather name="scissors" size={28} color="#7c3aed" />
        </View>
        <Text style={styles.heroTitle}>
          Stitch<Text style={{ color: "#7c3aed" }}>Track</Text>
        </Text>
      </LinearGradient>

      <View
        style={[
          styles.body,
          { paddingBottom: insets.bottom + webBottom + 24 },
        ]}
      >
        {/* Title — updates live as selection changes */}
        <Text
          style={[
            styles.title,
            { color: colors.foreground, textAlign: isArabic ? "right" : "center" },
          ]}
        >
          {t("chooseLanguage")}
        </Text>
        <Text
          style={[
            styles.sub,
            { color: colors.mutedForeground, textAlign: isArabic ? "right" : "center" },
          ]}
        >
          {t("chooseLanguageSub")}
        </Text>

        {/* Language cards */}
        <View style={styles.grid}>
          {LANGS.map((l) => {
            const active = selected === l;
            return (
              <Pressable
                key={l}
                onPress={() => setSelected(l)}
                style={[
                  styles.card,
                  {
                    backgroundColor: active ? "#7c3aed" : colors.card,
                    borderColor: active ? "#7c3aed" : colors.border,
                  },
                ]}
              >
                <Text style={styles.flag}>{LANGUAGE_FLAGS[l]}</Text>
                <Text
                  style={[
                    styles.langName,
                    { color: active ? "#fff" : colors.foreground },
                  ]}
                >
                  {LANGUAGE_NAMES[l]}
                </Text>
                {active && (
                  <View style={styles.checkBadge}>
                    <Feather name="check" size={12} color="#7c3aed" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <Button
          label={t("continueBtn")}
          icon="arrow-right"
          onPress={handleContinue}
          fullWidth
          size="lg"
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 28,
    paddingBottom: 32,
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(124,58,237,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    color: "white",
    fontFamily: "Inter_800ExtraBold",
    fontSize: 32,
    letterSpacing: -1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 6,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  card: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  flag: {
    fontSize: 34,
  },
  langName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    textAlign: "center",
  },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
