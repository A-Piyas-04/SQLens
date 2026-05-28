import { Icon, type IconProps } from "./Icon";

/** Practice toolkit hub — layered cards with bookmark */
export function PracticeHubIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} className={className} {...props}>
      <rect
        x="4.5"
        y="6"
        width="11"
        height="13"
        rx="2"
        fill="#1e3a5f"
        stroke="#60a5fa"
        strokeWidth="1.5"
      />
      <rect
        x="8.5"
        y="4"
        width="11"
        height="13"
        rx="2"
        fill="#0f172a"
        stroke="#38bdf8"
        strokeWidth="1.5"
      />
      <path d="M11.5 7.5h5M11.5 10h4M11.5 12.5h3" stroke="#7dd3fc" strokeWidth="1.25" strokeLinecap="round" />
      <path
        d="M17.5 16.5V11.5l1.75-1 1.75 1v5"
        fill="#38bdf8"
        fillOpacity="0.2"
        stroke="#7dd3fc"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Icon>
  );
}
