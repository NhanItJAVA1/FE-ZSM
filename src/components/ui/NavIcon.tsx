import type { SVGProps } from "react";

export type NavIconName =
    | "home"
    | "submit"
    | "records"
    | "admin"
    | "logout";

interface NavIconProps extends SVGProps<SVGSVGElement> {
    name: NavIconName;
}

export default function NavIcon({ name, ...props }: NavIconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {name === "home" && (
                <>
                    <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H14v-5h-4v5H5.5A1.5 1.5 0 0 1 4 19v-8.5Z" />
                    <path d="M9 20.5V12h6v8.5" />
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
        </svg>
    );
}
