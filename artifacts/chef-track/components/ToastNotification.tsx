import { Feather } from "@expo/vector-icons";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ToastOptions {
  title: string;
  message: string;
  type?: "info" | "call" | "reminder";
  duration?: number;
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

interface ToastItem extends ToastOptions {
  id: number;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((opts: ToastOptions) => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev, { ...opts, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, opts.duration ?? 5000);
  }, []);

  React.useEffect(() => {
    const { registerToastListener, unregisterToastListener } = require("@/lib/toastEmitter");
    registerToastListener(showToast);
    return () => unregisterToastListener();
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastLayer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  );
}

function ToastLayer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  const insets = useSafeAreaInsets();
  const webTop = Platform.OS === "web" ? 72 : 0;

  if (toasts.length === 0) return null;

  return (
    <View
      style={[
        styles.layer,
        { top: insets.top + webTop + 8 },
      ]}
      pointerEvents="box-none"
    >
      {toasts.map((t) => (
        <ToastBubble key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </View>
  );
}

function ToastBubble({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const slideY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  const icon = toast.type === "call" ? "phone-incoming" : toast.type === "reminder" ? "bell" : "info";
  const iconColor = toast.type === "call" ? "#f97316" : toast.type === "reminder" ? "#f59e0b" : "#3b82f6";
  const iconBg = toast.type === "call" ? "rgba(249,115,22,0.15)" : toast.type === "reminder" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)";

  return (
    <Animated.View style={[styles.bubble, { transform: [{ translateY: slideY }], opacity }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{toast.title}</Text>
        {toast.message ? <Text style={styles.message} numberOfLines={2}>{toast.message}</Text> : null}
      </View>
      <Pressable onPress={onDismiss} hitSlop={10}>
        <Feather name="x" size={16} color="#94a3b8" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
    gap: 8,
  },
  bubble: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    color: "white",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    letterSpacing: -0.1,
  },
  message: {
    color: "#94a3b8",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
});
