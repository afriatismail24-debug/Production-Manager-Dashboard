import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function NetworkChangedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { acceptNetworkChange } = useApp();
  const [loading, setLoading] = useState(false);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  const handleContinue = async () => {
    setLoading(true);
    await acceptNetworkChange();
    router.replace("/");
  };

  return (
    <LinearGradient colors={["#1e293b", "#0f172a"]} style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 28,
          paddingTop: insets.top + webTop + 40,
          paddingBottom: insets.bottom + webBottom + 28,
          justifyContent: "space-between",
        }}
      >
        <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          <View style={styles.iconWrap}>
            <Feather name="wifi-off" size={36} color="#f97316" />
          </View>
          <Text style={styles.title}>New network detected</Text>
          <Text style={styles.body}>
            You're connected to a different WiFi network than last time. Each
            workshop has its own data — this one starts fresh with a new boss
            account.
          </Text>
          <View style={[styles.infoBox, { backgroundColor: "rgba(249,115,22,0.1)", borderColor: "rgba(249,115,22,0.3)" }]}>
            <Feather name="info" size={14} color="#f97316" />
            <Text style={styles.infoText}>
              Data from your previous network is still safely stored there and
              will reappear when you reconnect to it.
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Button
            label="Set up this network"
            icon="arrow-right"
            onPress={handleContinue}
            fullWidth
            size="lg"
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(249,115,22,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    color: "white",
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  body: {
    color: "#94a3b8",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  infoText: {
    color: "#f97316",
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
