import { Icon, type IconProps } from "./Icon";

/** Guided tour / help — route with numbered stops */
export function HelpTourIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} className={className} {...props}>
      <path
        d="M5.5 18.5c2.2-3.8 4.8-5.8 8-6.2 2.4-.3 4.6.6 6.5 2.7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx="5.5"
        cy="18.5"
        r="2"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle
        cx="13.5"
        cy="12.25"
        r="2"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle
        cx="20"
        cy="15"
        r="2"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M7 17.2l2.2-2.1M15.2 12.8l2.5 1"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.6"
      />
    </Icon>
  );
}
