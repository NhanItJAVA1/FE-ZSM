import { useEffect } from "react";
import {
    PARTICLE_CLICK_SELECTOR,
    spawnParticleBurstFromElement,
} from "./particleBurst.js";
import "./ParticleBurst.css";

export default function ParticleBurstLayer() {
    useEffect(() => {
        function handleClick(event: MouseEvent) {
            const target = event.target;

            if (!(target instanceof Element)) {
                return;
            }

            const interactive = target.closest(PARTICLE_CLICK_SELECTOR);

            if (!(interactive instanceof HTMLElement)) {
                return;
            }

            if (interactive.closest("[data-no-particle]")) {
                return;
            }

            spawnParticleBurstFromElement(
                interactive,
                event.clientX,
                event.clientY
            );
        }

        document.addEventListener("click", handleClick);

        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, []);

    return null;
}
