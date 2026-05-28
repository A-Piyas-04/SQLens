import { Icon, type IconProps } from "./Icon";

/** AI SQL generation — sparkle over code brackets */
export function AiSqlIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} className={className} {...props}>
      <path
        d="M8.5 7.5 6.75 12l-1.75 4.5M15.5 7.5 17.25 12l1.75 4.5"
        stroke="#a78bfa"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.25 12h3.5M12 10.25v3.5"
        stroke="#c4b5fd"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M17.75 5.5 18.9 8.35 21.75 9.5 18.9 10.65 17.75 13.5 16.6 10.65 13.75 9.5 16.6 8.35z"
        fill="#fbbf24"
        stroke="#fde68a"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 5.25 7.1 6.85 8.7 7.45 7.1 8.05 6.5 9.65 5.9 8.05 4.3 7.45 5.9 6.85z"
        fill="#38bdf8"
        stroke="#7dd3fc"
        strokeWidth="0.5"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </Icon>
  );
}
