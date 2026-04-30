import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function Index() {
  const { loaded, boss, subscriptionSeen, session } = useApp();
  const colors = useColors();

  if (!loaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!boss) return <Redirect href="/setup" />;
  if (!subscriptionSeen) return <Redirect href="/subscription" />;
  if (!session) return <Redirect href="/login" />;
  if (session.role === "boss") return <Redirect href="/boss" />;
  return <Redirect href="/chef" />;
}
