import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Feather } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkBanner } from "@/components/NetworkBanner";
import { ToastProvider } from "@/components/ToastNotification";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { api, setAuthTokenGetter } from "@/lib/api";
import { configureNotifications, registerForPushNotificationsAsync } from "@/lib/notifications";

SplashScreen.preventAutoHideAsync();

// Configure how notifications appear when the app is in the foreground.
// Must be called before any component mounts.
if (Platform.OS !== "web") {
  configureNotifications();
}

const queryClient = new QueryClient();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

// Keeps the Clerk bearer token wired into every API request whenever the
// manager is signed in. Called inside ClerkLoaded so the auth hooks are safe.
function ClerkTokenSync() {
  const { isSignedIn, getToken } = useAuth();
  useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(() => getToken());
    } else {
      setAuthTokenGetter(null);
    }
  }, [isSignedIn, getToken]);
  return null;
}

// Registers the device for push notifications once the user is logged in
// and keeps the token fresh on the server.
function PushTokenSync() {
  const { session } = useApp();
  const registeredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session || Platform.OS === "web") return;

    registerForPushNotificationsAsync().then((token) => {
      if (!token) return;
      if (registeredRef.current === token) return; // already sent this token
      registeredRef.current = token;

      const userId = session.chefId ?? "boss";
      const role = session.role;
      api.notifications.savePushToken(userId, role, token).catch(() => {/* non-fatal */});
    });
  }, [session]);

  // Listen for incoming notifications while the app is in the foreground
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationReceivedListener((_notification) => {
      // Notification is already displayed by the handler set in configureNotifications.
      // Additional in-app handling can be added here if needed.
    });
    return () => sub.remove();
  }, []);

  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#fafaf9" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="setup" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="login" />
      <Stack.Screen name="boss" />
      <Stack.Screen name="chef" />
      <Stack.Screen
        name="objectives"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="chefs"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="production"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="problem"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="reminder"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen name="language" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="join" />
      <Stack.Screen name="reset" />
      <Stack.Screen
        name="history"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    ...Feather.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} proxyUrl={proxyUrl}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <LanguageProvider>
                    <ClerkTokenSync />
                    <AppProvider>
                      <ToastProvider>
                        <PushTokenSync />
                        <View style={{ flex: 1 }}>
                          <NetworkBanner />
                          <RootLayoutNav />
                        </View>
                      </ToastProvider>
                    </AppProvider>
                  </LanguageProvider>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </QueryClientProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
