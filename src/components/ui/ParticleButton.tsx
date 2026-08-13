import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { spawnParticleBurstFromElement } from "./particleBurst.js";

interface ParticleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
}

export default function ParticleButton({
    children,
    onClick,
    ...props
}: ParticleButtonProps) {
    function handleClick(event: MouseEvent<HTMLButtonElement>) {
        if (!props.disabled) {
            spawnParticleBurstFromElement(
                event.currentTarget,
                event.clientX,
                event.clientY
            );
        }

        onClick?.(event);
    }

    return (
        <button {...props} onClick={handleClick}>
            {children}
        </button>
    );
}
