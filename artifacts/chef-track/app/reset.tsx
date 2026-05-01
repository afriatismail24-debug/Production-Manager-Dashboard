import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { api } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

type Step = "email" | "code";

export default function ResetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [inlineCode, setInlineCode] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  const handleRequest = async () => {
    setError(null);
    if (!email.trim() || !email.includes("@")) {
      return setError("Enter a valid email.");
    }
    setLoading(true);
    try {
      const r = await api.workspace.resetRequest(email.trim().toLowerCase());
      if (r.emailSent) {
        setEmailSent(true);
      } else {
        setInlineCode(r.code ?? null);
      }
      setStep("code");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setError(null);
    if (code.trim().length !== 6) return setError("Enter the 6-digit code.");
    if (newPassword.length < 4) return setError("Password must be 4+ characters.");
    if (newPassword !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    try {
      await api.workspace.resetConfirm(code.trim(), newPassword);
      setDone(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingTop: insets.top + webTop + 16,
          paddingBottom: insets.bottom + webBottom + 24,
        }}
      >
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={10}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
            Back to login
          </Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Reset password
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {step === "email"
            ? "Enter your boss email to receive a reset code."
            : "Enter the code you received and choose a new password."}
        </Text>

        {done ? (
          <Card style={{ marginTop: 24, gap: 16 }}>
            <View style={{ alignItems: "center", gap: 12 }}>
              <View style={[styles.iconCircle, { backgroundColor: "#dcfce7" }]}>
                <Feather name="check-circle" size={28} color="#16a34a" />
              </View>
              <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" }}>
                Password updated!
              </Text>
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" }}>
                Use your new password to sign in.
              </Text>
            </View>
            <Button label="Back to sign in" icon="log-in" onPress={() => router.replace("/login")} fullWidth />
          </Card>
        ) : step === "email" ? (
          <Card style={{ marginTop: 24, gap: 14 }}>
            <TextField
              label="Boss email"
              placeholder="boss@workshop.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              errorText={error ?? undefined}
            />
            <Button
              label="Send reset code"
              icon="send"
              onPress={handleRequest}
              loading={loading}
              fullWidth
            />
          </Card>
        ) : (
          <Card style={{ marginTop: 24, gap: 14 }}>
            {emailSent ? (
              <View style={[styles.infoBanner, { backgroundColor: colors.accent }]}>
                <Feather name="mail" size={16} color={colors.accentForeground} />
                <Text style={{ color: colors.accentForeground, fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 }}>
                  Reset code sent to {email}
                </Text>
              </View>
            ) : inlineCode ? (
              <View style={[styles.infoBanner, { backgroundColor: "#fef9c3", borderColor: "#fef08a" }]}>
                <Feather name="alert-circle" size={16} color="#854d0e" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#854d0e", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                    Email not configured — your code is:
                  </Text>
                  <Text style={{ color: "#854d0e", fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: 4, marginTop: 4 }}>
                    {inlineCode}
                  </Text>
                </View>
              </View>
            ) : null}

            <TextField
              label="Reset code"
              placeholder="000000"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TextField
              label="New password"
              placeholder="At least 4 characters"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextField
              label="Confirm new password"
              placeholder="Re-enter password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              errorText={error ?? undefined}
            />
            <Button
              label="Reset password"
              icon="check"
              onPress={handleConfirm}
              loading={loading}
              fullWidth
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBanner: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
});
