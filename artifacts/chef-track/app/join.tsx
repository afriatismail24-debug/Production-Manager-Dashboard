import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function JoinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { joinWorkspace } = useApp();
  const params = useLocalSearchParams<{ code?: string }>();

  const [code, setCode] = useState((params.code ?? "").toUpperCase());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  useEffect(() => {
    if (params.code) {
      handleJoin(params.code.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = async (overrideCode?: string) => {
    const target = (overrideCode ?? code).trim().toUpperCase();
    if (target.length < 4) {
      return setError("Enter your workspace code.");
    }
    setError(null);
    setLoading(true);
    try {
      const result = await joinWorkspace(target);
      if (result.ok) {
        router.replace("/login");
      } else {
        setError(result.error ?? "Workspace not found. Check the code and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 24,
          paddingTop: insets.top + webTop + 16,
          paddingBottom: insets.bottom + webBottom + 24,
          flexGrow: 1,
          justifyContent: "center",
        }}
      >
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={10}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
            Back
          </Text>
        </Pressable>

        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View style={[styles.iconWrap, { backgroundColor: "rgba(124,58,237,0.1)" }]}>
            <Feather name="users" size={28} color="#7c3aed" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Join your workshop</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Ask your manager for the workspace code and enter it below.
          </Text>
        </View>

        <View style={[styles.codeBox, { backgroundColor: colors.card, borderColor: error ? "#ef4444" : colors.border }]}>
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(v) => {
              setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
              setError(null);
            }}
            placeholder="e.g. ABC123"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            style={[styles.codeInput, { color: colors.foreground }]}
            returnKeyType="go"
            onSubmitEditing={() => handleJoin()}
          />
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={13} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          label="Join workspace"
          icon="arrow-right"
          onPress={() => handleJoin()}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: 20 }}
        />

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          The code is shown on the manager's dashboard. It looks like ABC123.
        </Text>
      </KeyboardAwareScrollView>
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
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 280,
  },
  codeBox: {
    borderWidth: 2,
    borderRadius: 16,
    height: 68,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  codeInput: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: 6,
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    color: "#ef4444",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
});
