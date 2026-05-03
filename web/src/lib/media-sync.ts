/** Cross-tab + same-window signal so Media library refetches after menu export and similar. */
export const MEDIA_LIBRARY_REFRESH_CHANNEL = "kemisdisplay-media-refresh";

export function broadcastMediaLibraryRefresh(): void {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const ch = new BroadcastChannel(MEDIA_LIBRARY_REFRESH_CHANNEL);
    ch.postMessage("refresh");
    ch.close();
  } catch {
    // ignore
  }
}
