import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import { Platform } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  joinCode: string;
  onClose: () => void;
}

function getBaseUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  return domain ? `https://${domain}` : "http://localhost:8080";
}

export function ShareCodeModal({ visible, joinCode, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [justUsed, setJustUsed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTokenRef = useRef<string | null>(null);

  const generateToken = useCallback(async () => {
    setTokenLoading(true);
    try {
      const { token } = await api.invites.generate();
      setInviteToken(token);
      lastTokenRef.current = token;
    } catch {
      // ignore
    } finally {
      setTokenLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    generateToken();

    pollRef.current = setInterval(async () => {
      try {
        const { token } = await api.invites.current();
        if (token && token !== lastTokenRef.current) {
          setJustUsed(true);
          setInviteToken(token);
          lastTokenRef.current = token;
          setTimeout(() => setJustUsed(false), 3000);
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [visible, generateToken]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteUrl = inviteToken
    ? `${getBaseUrl()}/join?invite=${inviteToken}`
    : `${getBaseUrl()}/join?code=${joinCode}`;

  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + webBottom + 24 }]}
          onPress={() => {}}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>Invite an operator</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Each QR code is single-use. After one operator scans it, a new one appears here automatically.
          </Text>

          {justUsed && (
            <View style={[styles.usedBanner, { backgroundColor: "#dcfce7", borderColor: "#86efac" }]}>
              <Feather name="check-circle" size={14} color="#16a34a" />
              <Text style={{ color: "#16a34a", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                Someone just joined! New QR code is ready.
              </Text>
            </View>
          )}

          <View style={[styles.qrWrap, { backgroundColor: "white", borderColor: colors.border }]}>
            {tokenLoading ? (
              <View style={{ width: 200, height: 200, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator color="#7c3aed" size="large" />
              </View>
            ) : (
              <QRCode value={inviteUrl} size={200} color="#0f172a" backgroundColor="white" />
            )}
          </View>

          <View style={styles.refreshRow}>
            <Pressable
              onPress={generateToken}
              style={[styles.refreshBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
              hitSlop={8}
            >
              <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                Regenerate QR
              </Text>
            </Pressable>
          </View>

          <View style={[styles.codeRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.codeText, { color: colors.foreground }]}>{joinCode}</Text>
            <Pressable
              onPress={handleCopy}
              style={[styles.copyBtn, { backgroundColor: copied ? "#dcfce7" : colors.card }]}
              hitSlop={8}
            >
              <Feather name={copied ? "check" : "copy"} size={16} color={copied ? "#16a34a" : colors.mutedForeground} />
              <Text style={{ color: copied ? "#16a34a" : colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                {copied ? "Copied!" : "Copy code"}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.steps, { backgroundColor: colors.muted, borderRadius: 14, padding: 14 }]}>
            {[
              "Open StitchTrack on their phone or device",
              'Tap "Join a workspace" on the welcome screen',
              "Scan this QR — it's one-time use and auto-refreshes after each join",
              "Or type the 6-character code above manually",
            ].map((s, i) => (
              <View key={i} style={styles.step}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: "white", fontFamily: "Inter_700Bold", fontSize: 11 }}>{i + 1}</Text>
                </View>
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 18 }}>
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    marginTop: -4,
  },
  usedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  qrWrap: {
    alignSelf: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  refreshRow: {
    alignItems: "center",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  codeText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    letterSpacing: 6,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  steps: { gap: 10 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
});
