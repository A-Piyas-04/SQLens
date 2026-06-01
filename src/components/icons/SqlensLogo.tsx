import { Icon, type IconProps } from "./Icon";

/** Brand mark: aperture lens framing a database cylinder */
export function SqlensLogo({ className, size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} className={className} {...props}>
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeDasharray="3.2 2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M5.8 18.2l1.4-1.4M16.8 7.2l1.4-1.4"
        stroke="var(--color-line-strong)"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <ellipse cx="12" cy="10.5" rx="4.25" ry="1.35" fill="var(--color-accent-muted)" />
      <path
        d="M7.75 10.5v4.25c0 2.35 1.9 2.75 4.25 2.75s4.25-.4 4.25-2.75v-4.25"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <ellipse
        cx="12"
        cy="14.75"
        rx="4.25"
        ry="1.35"
        stroke="var(--color-accent-ink)"
        strokeWidth="1.25"
        fill="none"
      />
      <circle cx="12" cy="12" r="1.1" fill="var(--color-accent)" />
    </Icon>
  );
}
