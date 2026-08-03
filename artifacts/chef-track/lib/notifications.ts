import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Configure how notifications are displayed when the app is in the foreground.
 * Call this once at app startup (outside any component).
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request permission and return the Expo push token string, or null if
 * permission was denied or the platform doesn't support push (e.g. web).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications are not supported on web
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  try {
    const result = await Notifications.getExpoPushTokenAsync();
    return result.data;
  } catch {
    return null;
  }
}
