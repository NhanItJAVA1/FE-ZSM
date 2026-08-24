import type { SVGProps } from "react";

export type NavIconName =
    | "apps"
    | "home"
    | "todo"
    | "submit"
    | "records"
    | "admin"
    | "logout"
    | "search"
    | "map"
    | "car"
    | "close";

interface NavIconProps extends SVGProps<SVGSVGElement> {
    name: NavIconName;
}

export default function NavIcon({ name, ...props }: NavIconProps) {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {name === "apps" && (
                <>
                    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
                    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
                    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
                    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
                </>
            )}
            {name === "home" && (
                <>
                    <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H14v-5h-4v5H5.5A1.5 1.5 0 0 1 4 19v-8.5Z" />
                    <path d="M9 20.5V12h6v8.5" />
                </>
            )}
            {name === "todo" && (
                <>
                    <rect x="4" y="4" width="16" height="16" rx="3" />
                    <path d="m8 9 1.4 1.4L12 7.8" />
                    <path d="M14 9h3" />
                    <path d="m8 15 1.4 1.4L12 13.8" />
                    <path d="M14 15h3" />
                </>
            )}
            {name === "submit" && (
                <>
                    <path d="M12 16V6" />
                    <path d="m8 10 4-4 4 4" />
                    <path d="M5 18h14" />
                </>
            )}
            {name === "records" && (
                <>
                    <rect x="5" y="4" width="14" height="16" rx="2" />
                    <path d="M9 9h6" />
                    <path d="M9 12h6" />
                    <path d="M9 15h4" />
                </>
            )}
            {name === "admin" && (
                <>
                    <path d="M12 3 4 7v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V7l-8-4Z" />
                    <path d="m9.5 12 1.8 1.8L15 10.1" />
                </>
            )}
            {name === "logout" && (
                <>
                    <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
                    <path d="M14 16l4-4-4-4" />
                    <path d="M18 12H9" />
                </>
            )}
            {name === "search" && (
                <>
                    <circle cx="9" cy="9" r="3" />
                    <path d="m13.5 13.5-1.5-1.5" />
                </>
            )}
            {name === "map" && (
                <>
                    <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" />
                    <path d="M9 4v14" />
                    <path d="M15 6v14" />
                </>
            )}
            {name === "car" && (
                <>
                    <path d="M4 16v-3.5l1.8-4.2A2 2 0 0 1 7.6 7h8.8a2 2 0 0 1 1.8 1.3L20 12.5V16" />
                    <path d="M4 16h16" />
                    <path d="M5 16v2M19 16v2" />
                    <path d="M6.5 12.5h11" />
                    <circle cx="8" cy="16" r="1.4" />
                    <circle cx="16" cy="16" r="1.4" />
                </>
            )}
            {name === "close" && (
                <>
                    <path d="M6 6l12 12" />
                    <path d="M18 6 6 18" />
                </>
            )}
        </svg>
    );
}
