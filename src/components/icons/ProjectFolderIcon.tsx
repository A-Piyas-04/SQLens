import { Icon, type IconProps } from "./Icon";

/** Workspace project — folder with database badge */
export function ProjectFolderIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} className={className} {...props}>
      <path
        d="M4 8.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9.5a2 2 0 0 0-2-2h-5.2L9.6 5.5H6a2 2 0 0 0-2 2.5z"
        fill="#0f2744"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <ellipse cx="15.5" cy="14" rx="2.75" ry="0.9" fill="#38bdf8" />
      <path
        d="M12.75 14v3.1c0 1.5 1.2 1.75 2.75 1.75s2.75-.25 2.75-1.75V14"
        stroke="#7dd3fc"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <ellipse cx="15.5" cy="17.1" rx="2.75" ry="0.9" stroke="#93c5fd" strokeWidth="1" />
    </Icon>
  );
}
