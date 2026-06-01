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
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <rect
        x="8.5"
        y="4"
        width="11"
        height="13"
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M11.5 7.5h5M11.5 10h4M11.5 12.5h3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M17.5 16.5V11.5l1.75-1 1.75 1v5"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </Icon>
  );
}
