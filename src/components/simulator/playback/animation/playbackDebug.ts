export type PlaybackDebugEvent =
  | "stage enter"
  | "phase start"
  | "phase complete"
  | "animation count"
  | "animation duration"
  | "stage complete"
  | "autoplay advance"
  | "navigation interruption"
  | "navigate"
  | "cancel"
  | "pause"
  | "resume"
  | "speed"
  | "skip"
  | "replay"
  | "reverse";

export function now(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

export function isPlaybackDebugEnabled(): boolean {
  try {
    return (
      typeof localStorage !== "undefined" &&
      localStorage.getItem("simulator:debug") === "1"
    );
  } catch {
    return false;
  }
}

/** Logs a timestamped playback event when localStorage "simulator:debug" === "1". */
export function playbackDebug(event: PlaybackDebugEvent, data?: Record<string, unknown>): void {
  if (!isPlaybackDebugEnabled()) return;
  console.log(`[Simulator Playback] ${now().toFixed(1)}ms ${event}`, data ?? "");
}
