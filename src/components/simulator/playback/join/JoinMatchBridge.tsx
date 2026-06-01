import type { ActiveBridgeLink } from "./joinPlaybackModel";

type Props = {
  link: ActiveBridgeLink | null;
};

/** Center lane between tables; arrows render in JoinArrowOverlay. */
export default function JoinMatchBridge({ link }: Props) {
  return (
    <div
      className="relative mx-auto w-full min-w-[88px] max-w-[160px] self-stretch"
      aria-hidden
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-line to-transparent" />

      {link && link.pairCount > 1 && (
        <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-sm border border-join-matched-border bg-join-matched-bg px-2 py-0.5 text-[9px] font-medium text-accent-ink">
          {link.pairIndex + 1} / {link.pairCount}
        </div>
      )}
    </div>
  );
}
