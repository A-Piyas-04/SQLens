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
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-slate-600/30 to-transparent" />

      {link && link.pairCount > 1 && (
        <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-medium text-emerald-300">
          {link.pairIndex + 1} / {link.pairCount}
        </div>
      )}
    </div>
  );
}
