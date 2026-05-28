import { Icon, type IconProps } from "../Icon";

export function SqlSnippetIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} className={className} {...props}>
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2"
        fill="#1c1917"
        stroke="#f59e0b"
        strokeWidth="1.5"
      />
      <path d="M4 9h16" stroke="#f59e0b" strokeWidth="1.25" opacity="0.6" />
      <circle cx="6.25" cy="7" r="0.75" fill="#f87171" />
      <circle cx="8.25" cy="7" r="0.75" fill="#fbbf24" />
      <circle cx="10.25" cy="7" r="0.75" fill="#34d399" />
      <path
        d="M7.5 13.5 9.75 12 7.5 10.5M16.5 13.5 14.25 12 16.5 10.5"
        stroke="#fcd34d"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.25 15.25h1.5l1-2.5 1 2.5h1.5"
        stroke="#fde68a"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}
