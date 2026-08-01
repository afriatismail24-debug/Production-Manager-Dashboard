import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function Setup() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setupBossGoogle } = useApp();
  const { t, lang } = useLang();
  const { user } = useUser();

  const googleName = user?.fullName ?? user?.firstName ?? "";
  const googleEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  const [workshopName, setWorkshopName] = useState("");
  const [managerName, setManagerName] = useState(googleName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRtl = lang === "ar";

  useEffect(() => {
    if (googleName && !managerName) setManagerName(googleName);
  }, [googleName]);

  const handleCreate = async () => {
    setError(null);
    if (!workshopName.trim()) return setError(t("workshopNameLabel") + " ?");
    if (!managerName.trim()) return setError(t("yourName") + " ?");
    setLoading(true);
    try {
      await setupBossGoogle(workshopName.trim(), managerName.trim(), googleEmail);
      router.replace("/subscription");
    } catch (err: unknown) {
      setError((err as Error).message ?? t("error"));
    } finally {
      setLoading(false);
    }
  };

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#1e293b", "#0f172a"]}
        style={[styles.hero, { paddingTop: insets.top + webTop + 24 }]}
      >
        <View style={styles.heroIcon}>
          <Feather name="scissors" size={28} color="#7c3aed" />
        </View>
        <Text style={[styles.heroTitle, { textAlign: isRtl ? "right" : "left" }]}>
          {t("setUpWorkspace")}
        </Text>
        <Text style={[styles.heroSub, { textAlign: isRtl ? "right" : "left" }]}>
          {googleEmail ? (
            <>
              {isRtl ? "" : ""}
              <Text style={{ color: "#f97316", fontFamily: "Inter_600SemiBold" }}>
                {googleEmail}
              </Text>
            </>
          ) : null}
        </Text>
      </LinearGradient>

      <KeyboardAwareScrollView
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.form,
          { paddingBottom: insets.bottom + webBottom + 24 },
        ]}
      >
        <View style={{ gap: 14 }}>
          <TextField
            label={t("workshopNameLabel")}
            placeholder={t("workshopNamePlaceholder")}
            value={workshopName}
            onChangeText={setWorkshopName}
            autoCapitalize="words"
          />
          <TextField
            label={t("yourName")}
            placeholder={t("yourNamePlaceholder")}
            value={managerName}
            onChangeText={setManagerName}
            autoCapitalize="words"
            errorText={error ?? undefined}
          />
        </View>

        <Button
          label={t("createWorkspaceBtn")}
          icon="arrow-right"
          onPress={handleCreate}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: 24 }}
        />

        <Text style={[styles.tip, { color: colors.mutedForeground, textAlign: isRtl ? "right" : "center" }]}>
          {t("setupTip")}
        </Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(124,58,237,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    color: "white",
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    letterSpacing: -0.5,
  },
  heroSub: {
    color: "#cbd5e1",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  form: {
    padding: 24,
  },
  tip: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 16,
    lineHeight: 18,
  },
});
