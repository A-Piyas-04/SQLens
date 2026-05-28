import { Icon, type IconProps } from "../Icon";

export function QueryTemplateIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} className={className} {...props}>
      <path
        d="M7 4.5h7.2L18 8.3V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V6A1.5 1.5 0 0 1 7 4.5z"
        fill="#172554"
        stroke="#60a5fa"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14.2 4.5V8.3H18" stroke="#93c5fd" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.25 11.5h7.5M8.25 14h5.5M8.25 16.5h6" stroke="#93c5fd" strokeWidth="1.35" strokeLinecap="round" />
      <circle cx="16.75" cy="16.75" r="3.75" fill="#2563eb" fillOpacity="0.35" stroke="#3b82f6" strokeWidth="1.5" />
      <path
        d="M15.4 16.75 16.75 18.1 18.5 15.9"
        stroke="#bfdbfe"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}
