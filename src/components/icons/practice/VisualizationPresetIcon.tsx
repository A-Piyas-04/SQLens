import { Icon, type IconProps } from "../Icon";

export function VisualizationPresetIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} className={className} {...props}>
      <rect
        x="3.5"
        y="4.5"
        width="17"
        height="15"
        rx="2"
        fill="#1e1b4b"
        stroke="#a78bfa"
        strokeWidth="1.5"
      />
      <path d="M3.5 17.5h17" stroke="#7c3aed" strokeWidth="1" opacity="0.35" />
      <rect x="6.5" y="12" width="2.5" height="4.5" rx="0.5" fill="#818cf8" />
      <rect x="10.75" y="9.5" width="2.5" height="7" rx="0.5" fill="#a78bfa" />
      <rect x="15" y="11" width="2.5" height="5.5" rx="0.5" fill="#c4b5fd" />
      <path
        d="M6.5 10.5 10.5 8.25 14.25 11 18 7.5"
        stroke="#e9d5ff"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="18" cy="7.5" r="1.35" fill="#f0abfc" stroke="#f5d0fe" strokeWidth="0.75" />
    </Icon>
  );
}
