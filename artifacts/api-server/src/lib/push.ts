/**
 * Expo Push Notification helper.
 * Sends notifications via Expo's free push service — no key required.
 */

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
}

export async function sendPush(messages: PushMessage[]): Promise<void> {
  const valid = messages.filter((m) => m.to.startsWith("ExponentPushToken["));
  if (valid.length === 0) return;

  // Expo allows up to 100 messages per request
  for (let i = 0; i < valid.length; i += 100) {
    const chunk = valid.slice(i, i + 100);
    try {
      await fetch("https://exp.host/--/exponent-push-token/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(chunk),
      });
    } catch {
      // Non-fatal — push failures should never break the main request
    }
  }
}

export async function sendPushOne(msg: PushMessage): Promise<void> {
  return sendPush([msg]);
}
