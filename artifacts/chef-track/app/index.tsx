import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function Index() {
  const { loaded, joinCode, boss, subscriptionSeen, session } = useApp();
  const { langLoaded, langSelected } = useLang();
  const colors = useColors();

  if (!loaded || !langLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // First-ever launch — pick a language before anything else
  if (!langSelected) return <Redirect href="/language" />;

  if (!joinCode) return <Redirect href="/welcome" />;
  if (!boss) return <Redirect href="/setup" />;
  if (!subscriptionSeen) return <Redirect href="/subscription" />;
  if (!session) return <Redirect href="/login" />;
  if (session.role === "boss") return <Redirect href="/boss" />;
  return <Redirect href="/chef" />;
}
