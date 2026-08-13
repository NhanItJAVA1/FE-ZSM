export interface ParticleBurstOptions {
    x: number;
    y: number;
    color?: string;
    count?: number;
    size?: number;
}

const FALLBACK_PARTICLE_COLOR = "#c93a2b";

function getThemeParticleColor(): string {
    if (typeof document === "undefined") {
        return FALLBACK_PARTICLE_COLOR;
    }

    return (
        getComputedStyle(document.documentElement)
            .getPropertyValue("--particle-default")
            .trim() || FALLBACK_PARTICLE_COLOR
    );
}

function prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function resolveParticleColor(element: HTMLElement): string {
    const styles = getComputedStyle(element);

    return (
        styles.getPropertyValue("--particle-color").trim() ||
        styles.color ||
        styles.backgroundColor ||
        getThemeParticleColor()
    );
}

export function spawnParticleBurst({
    x,
    y,
    color = getThemeParticleColor(),
    count = 14,
    size = 6,
}: ParticleBurstOptions): void {
    if (prefersReducedMotion()) {
        return;
    }

    const layer = document.createElement("div");
    layer.className = "particle-burst-layer";
    document.body.appendChild(layer);

    for (let index = 0; index < count; index += 1) {
        const particle = document.createElement("span");
        const angle =
            (Math.PI * 2 * index) / count + (Math.random() - 0.5) * 0.45;
        const distance = 28 + Math.random() * 52;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const particleSize = size * (0.65 + Math.random() * 0.7);
        const isSquare = index % 3 === 0;

        particle.className = isSquare
            ? "particle-burst-item particle-burst-item--square"
            : "particle-burst-item";
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${particleSize}px`;
        particle.style.height = `${particleSize}px`;
        particle.style.background = color;
        particle.style.setProperty("--particle-tx", `${tx}px`);
        particle.style.setProperty("--particle-ty", `${ty}px`);
        particle.style.animationDuration = `${480 + Math.random() * 220}ms`;

        layer.appendChild(particle);
    }

    window.setTimeout(() => {
        layer.remove();
    }, 800);
}

export function spawnParticleBurstFromElement(
    element: HTMLElement,
    clientX: number,
    clientY: number
): void {
    const rect = element.getBoundingClientRect();
    const x = clientX || rect.left + rect.width / 2;
    const y = clientY || rect.top + rect.height / 2;
    const isCompact = element.classList.contains("site-nav-icon-btn");

    spawnParticleBurst({
        x,
        y,
        color: resolveParticleColor(element),
        count: isCompact ? 10 : 16,
        size: isCompact ? 4 : 6,
    });
}

export const PARTICLE_CLICK_SELECTOR = [
    "button:not([disabled]):not([data-no-particle])",
    "a.primary-link",
    "a.site-nav-icon-btn",
    ".record-chip",
    ".filter-trigger",
    ".picker-field",
].join(", ");
