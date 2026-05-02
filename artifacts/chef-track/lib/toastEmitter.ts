import type { ToastOptions } from "@/components/ToastNotification";

type ToastListener = (opts: ToastOptions) => void;
let _listener: ToastListener | null = null;

export function registerToastListener(fn: ToastListener) {
  _listener = fn;
}

export function unregisterToastListener() {
  _listener = null;
}

export function emitToast(opts: ToastOptions) {
  _listener?.(opts);
}
