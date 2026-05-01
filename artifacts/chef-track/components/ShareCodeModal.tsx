import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  joinCode: string;
  onClose: () => void;
}

function getJoinUrl(code: string): string {
  const domain =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;
  return `${domain}/join?code=${code}`;
}

export function ShareCodeModal({ visible, joinCode, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  const joinUrl = getJoinUrl(joinCode);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + webBottom + 24 }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>Share workspace code</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Your team scans this QR code or enters the code manually. They only need to do it once.
          </Text>

          <View style={[styles.qrWrap, { backgroundColor: "white", borderColor: colors.border }]}>
            <QRCode
              value={joinUrl}
              size={200}
              color="#0f172a"
              backgroundColor="white"
            />
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
                {copied ? "Copied!" : "Copy"}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.steps, { backgroundColor: colors.muted, borderRadius: 14, padding: 14 }]}>
            {[
              "Open ChefTrack on their phone or device",
              'Tap "Join a workspace" on the welcome screen',
              "Scan this QR code or type the code above",
              "Then sign in with their chef credentials",
            ].map((s, i) => (
              <View key={i} style={styles.step}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: "white", fontFamily: "Inter_700Bold", fontSize: 11 }}>{i + 1}</Text>
                </View>
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 18 }}>{s}</Text>
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
  qrWrap: {
    alignSelf: "center",
    padding: 16,
    borderRadius: 20,
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
