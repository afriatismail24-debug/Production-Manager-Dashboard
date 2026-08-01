import { useSSO } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

// Preload the browser on Android to reduce OAuth round-trip latency
function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
}

WebBrowser.maybeCompleteAuthSession();

type Mode = "boss" | "chef";

export default function Login() {
  useWarmUpBrowser();

  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loginChef, loginWithGoogle } = useApp();
  const { startSSOFlow } = useSSO();

  const [mode, setMode] = useState<Mode>("boss");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // Token is now set via ClerkTokenSync — look up (or prompt to create) workspace
        const result = await loginWithGoogle();
        if (result === "no_workspace") {
          router.replace("/setup");
        } else {
          router.replace("/boss");
        }
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "Google sign-in failed. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow, loginWithGoogle, router]);

  const handleChefLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const ok = await loginChef(email, password);
      if (!ok) return setError("Email or password is incorrect.");
      router.replace("/chef");
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

        {/* Tab switcher */}
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

        {/* ── Manager tab: Google SSO ── */}
        {mode === "boss" ? (
          <View style={{ marginTop: 28, gap: 16 }}>
            <Pressable
              onPress={handleGoogleSignIn}
              disabled={loading}
              style={[
                styles.googleBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  {/* Google "G" logo in brand colours */}
                  <View style={styles.googleLogo}>
                    <Text style={styles.googleLogoText}>G</Text>
                  </View>
                  <Text style={[styles.googleBtnText, { color: colors.foreground }]}>
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            {error ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            ) : null}

            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Each company uses their own Google account. Your workspace and all
              production data are tied to that account.
            </Text>
          </View>
        ) : (
          /* ── Operator tab: email + password ── */
          <View style={{ marginTop: 24, gap: 14 }}>
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

            <Button
              label="Sign in"
              icon="log-in"
              onPress={handleChefLogin}
              loading={loading}
              fullWidth
              size="lg"
            />

            <Text
              style={{
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              Your password was assigned by the manager when your account was
              created. Ask them if you don't remember it.
            </Text>
          </View>
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
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 52,
  },
  googleLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  googleLogoText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#4285F4",
  },
  googleBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
