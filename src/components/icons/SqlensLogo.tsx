import { useId } from "react";

import { Icon, type IconProps } from "./Icon";

/** Brand mark: aperture lens framing a database cylinder */
export function SqlensLogo({ className, size = 24, ...props }: IconProps) {
  const uid = useId().replace(/:/g, "");
  const lensId = `sqlens-logo-lens-${uid}`;
  const dbId = `sqlens-logo-db-${uid}`;

  return (
    <Icon size={size} className={className} {...props}>
      <defs>
        <linearGradient id={lensId} x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id={dbId} x1="12" y1="9" x2="12" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke={`url(#${lensId})`}
        strokeWidth="1.5"
        strokeDasharray="3.2 2.4"
        strokeLinecap="round"
      />
      <path
        d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M5.8 18.2l1.4-1.4M16.8 7.2l1.4-1.4"
        stroke="#60a5fa"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.55"
      />
      <ellipse cx="12" cy="10.5" rx="4.25" ry="1.35" fill={`url(#${dbId})`} opacity="0.95" />
      <path
        d="M7.75 10.5v4.25c0 2.35 1.9 2.75 4.25 2.75s4.25-.4 4.25-2.75v-4.25"
        stroke={`url(#${dbId})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <ellipse cx="12" cy="14.75" rx="4.25" ry="1.35" stroke="#93c5fd" strokeWidth="1.25" />
      <circle cx="12" cy="12" r="1.1" fill="#e0f2fe" opacity="0.9" />
    </Icon>
  );
}
