import { Icon, type IconProps } from "../Icon";

export function SampleDatabaseIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} className={className} {...props}>
      <ellipse cx="12" cy="7.5" rx="5.5" ry="2" fill="#22d3ee" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="1.5" />
      <path
        d="M6.5 7.5v4c0 3.04 2.46 3.5 5.5 3.5s5.5-.46 5.5-3.5v-4"
        stroke="#22d3ee"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <ellipse cx="12" cy="11.5" rx="5.5" ry="2" stroke="#67e8f9" strokeWidth="1.25" />
      <path
        d="M6.5 11.5v3.5c0 3.04 2.46 3.5 5.5 3.5s5.5-.46 5.5-3.5v-3.5"
        stroke="#06b6d4"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <ellipse cx="12" cy="15" rx="5.5" ry="2" stroke="#a5f3fc" strokeWidth="1.25" />
      <path
        d="M16.5 18.5 18.5 20.5 21 18"
        stroke="#34d399"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18.75" cy="17.25" r="2.75" fill="#10b981" fillOpacity="0.2" stroke="#34d399" strokeWidth="1.5" />
      <path d="M17.6 17.25h2.3M18.75 16.1v2.3" stroke="#6ee7b7" strokeWidth="1.25" strokeLinecap="round" />
    </Icon>
  );
}
