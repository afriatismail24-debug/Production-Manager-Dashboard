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
import { useColors } from "@/hooks/useColors";

export default function Setup() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setupBossGoogle } = useApp();
  const { user } = useUser();

  // Pre-fill manager name from Google profile
  const googleName = user?.fullName ?? user?.firstName ?? "";
  const googleEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  const [workshopName, setWorkshopName] = useState("");
  const [managerName, setManagerName] = useState(googleName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync name once user profile loads
  useEffect(() => {
    if (googleName && !managerName) setManagerName(googleName);
  }, [googleName]);

  const handleCreate = async () => {
    setError(null);
    if (!workshopName.trim()) return setError("Please enter your workshop or company name.");
    if (!managerName.trim()) return setError("Please enter your name.");
    setLoading(true);
    try {
      await setupBossGoogle(workshopName.trim(), managerName.trim(), googleEmail);
      router.replace("/subscription");
    } catch (err: unknown) {
      setError((err as Error).message ?? "Setup failed. Try again.");
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
        <Text style={styles.heroTitle}>Set up your workspace</Text>
        <Text style={styles.heroSub}>
          You're signed in with Google as{" "}
          <Text style={{ color: "#f97316", fontFamily: "Inter_600SemiBold" }}>
            {googleEmail || "your Google account"}
          </Text>
          . Give your workshop a name and your operators can join with a code.
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
            label="Workshop / company name"
            placeholder="e.g. Sunrise Garments"
            value={workshopName}
            onChangeText={setWorkshopName}
            autoCapitalize="words"
          />
          <TextField
            label="Your name"
            placeholder="e.g. Jordan Pierce"
            value={managerName}
            onChangeText={setManagerName}
            autoCapitalize="words"
            errorText={error ?? undefined}
          />
        </View>

        <Button
          label="Create workspace"
          icon="arrow-right"
          onPress={handleCreate}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: 24 }}
        />

        <Text style={[styles.tip, { color: colors.mutedForeground }]}>
          Your workspace is linked to your Google account. Only you can sign in
          as manager — operators join via the 6-letter code you'll share with them.
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
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
});
