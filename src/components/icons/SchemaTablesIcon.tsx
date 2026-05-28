import { Icon, type IconProps } from "./Icon";

/** Database schema — table grid with highlighted header row */
export function SchemaTablesIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} className={className} {...props}>
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4 9.25h16"
        stroke="#38bdf8"
        strokeWidth="1.5"
      />
      <rect x="4" y="5" width="16" height="4.25" rx="2" fill="#38bdf8" fillOpacity="0.2" />
      <path d="M10 9.25v9.75M15 9.25v9.75" stroke="currentColor" strokeWidth="1.25" opacity="0.55" />
      <circle cx="7.25" cy="12.25" r="0.9" fill="#7dd3fc" />
      <circle cx="7.25" cy="15.25" r="0.9" fill="currentColor" opacity="0.45" />
      <path d="M12.25 12h5.5M12.25 15h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.7" />
    </Icon>
  );
}
