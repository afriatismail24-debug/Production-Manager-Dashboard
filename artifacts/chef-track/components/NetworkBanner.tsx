import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

import { useApp } from "@/contexts/AppContext";

export function NetworkBanner() {
  const { isOnline } = useApp();
  if (isOnline) return null;
  return (
    <View
      style={{
        backgroundColor: "#ef4444",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
      }}
    >
      <Feather name="wifi-off" size={13} color="white" />
      <Text
        style={{
          color: "white",
          fontFamily: "Inter_600SemiBold",
          fontSize: 12,
        }}
      >
        You're offline — reconnect to sync
      </Text>
    </View>
  );
}
