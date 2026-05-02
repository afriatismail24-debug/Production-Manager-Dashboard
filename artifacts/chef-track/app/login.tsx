import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
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

type Mode = "boss" | "chef";

export default function Login() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loginBoss, loginChef } = useApp();

  const [mode, setMode] = useState<Mode>("boss");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const ok =
        mode === "boss"
          ? await loginBoss(email, password)
          : await loginChef(email, password);
      if (!ok) return setError("Email or password is incorrect.");
      router.replace(mode === "boss" ? "/boss" : "/chef");
    } finally {
      setLoading(false);
    }
  };

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 24,
          paddingTop: insets.top + webTop + 24,
          paddingBottom: insets.bottom + webBottom + 24,
          flexGrow: 1,
          justifyContent: "center",
        }}
      >
        <View style={styles.brandRow}>
          <View style={[styles.brandIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="scissors" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.brand, { color: colors.foreground }]}>
            Stitch<Text style={{ color: colors.primary }}>Track</Text>
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Welcome back
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Sign in to your workshop
        </Text>

        <View
          style={[
            styles.tabs,
            { backgroundColor: colors.muted, borderRadius: colors.radius },
          ]}
        >
          {(["boss", "chef"] as const).map((m) => {
            const active = m === mode;
            return (
              <Pressable
                key={m}
                onPress={() => {
                  setMode(m);
                  setError(null);
                }}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? colors.card : "transparent",
                    borderRadius: colors.radius - 2,
                    shadowOpacity: active ? 0.06 : 0,
                  },
                ]}
              >
                <Feather
                  name={m === "boss" ? "briefcase" : "scissors"}
                  size={14}
                  color={active ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    color: active ? colors.foreground : colors.mutedForeground,
                    fontSize: 13,
                  }}
                >
                  {m === "boss" ? "Manager" : "Operator"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: 14, marginTop: 24 }}>
          <TextField
            label="Email"
            placeholder="you@workshop.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            placeholder="••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            errorText={error ?? undefined}
          />
        </View>

        <Button
          label="Sign in"
          icon="log-in"
          onPress={handleLogin}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: 22 }}
        />

        {mode === "boss" ? (
          <Pressable
            onPress={() => router.push("/reset")}
            hitSlop={10}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              Forgot password?
            </Text>
          </Pressable>
        ) : (
          <Text
            style={{
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              textAlign: "center",
              marginTop: 16,
              lineHeight: 18,
            }}
          >
            Your password was assigned by the manager when your account was created.
            Ask them if you don't remember it.
          </Text>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.6,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  tabs: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    shadowColor: "#0f172a",
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
});
