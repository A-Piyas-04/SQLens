import { Icon, type IconProps } from "./Icon";

/** AI SQL generation — sparkle over code brackets */
export function AiSqlIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} className={className} {...props}>
      <path
        d="M8.5 7.5 6.75 12l-1.75 4.5M15.5 7.5 17.25 12l1.75 4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M10.25 12h3.5M12 10.25v3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M17.75 5.5 18.9 8.35 21.75 9.5 18.9 10.65 17.75 13.5 16.6 10.65 13.75 9.5 16.6 8.35z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
    </Icon>
  );
}
