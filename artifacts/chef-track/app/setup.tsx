import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
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
  const { setupBoss } = useApp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) return setError("Please enter your name.");
    if (!email.trim() || !email.includes("@"))
      return setError("Enter a valid email.");
    if (password.length < 4) return setError("Password must be 4+ characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await setupBoss(name.trim(), email.trim(), password);
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
          <Feather name="award" size={28} color="#f97316" />
        </View>
        <Text style={styles.heroTitle}>Welcome to ChefTrack</Text>
        <Text style={styles.heroSub}>
          Create a workspace for your kitchen. After setup, you'll get a join
          code — share it with your team so they can connect from their devices.
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
            label="Your name"
            placeholder="e.g. Jordan Pierce"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextField
            label="Email"
            placeholder="boss@workshop.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField
            label="Choose a password"
            placeholder="At least 4 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextField
            label="Confirm password"
            placeholder="Re-enter password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            errorText={error ?? undefined}
          />
        </View>

        <Button
          label="Create boss account"
          icon="arrow-right"
          onPress={handleCreate}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: 24 }}
        />

        <Text style={[styles.tip, { color: colors.mutedForeground }]}>
          Tip: chef accounts will be created later from your dashboard with
          auto-generated passwords.
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
    backgroundColor: "rgba(249,115,22,0.15)",
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
  },
});
