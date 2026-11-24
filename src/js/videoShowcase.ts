import { showcaseItems } from "./showcaseData";
import type { ShowcaseItem } from "../types/VideoShowcase";

// 10 seconds
export const SHOWCASE_INTERVAL = 10_000;

export function initVideoShowcase(scope: HTMLElement): void {
    let items = showcaseItems;

    if (scope.dataset.items) {
        try {
            const parsed: unknown = JSON.parse(scope.dataset.items);
            if (Array.isArray(parsed) && parsed.length > 0) items = parsed as ShowcaseItem[];
        } catch {}
    }

    if (items.length === 0) return;

    const video = scope.querySelector<HTMLVideoElement>("[data-showcase-video]");
    const title = scope.querySelector<HTMLElement>("[data-showcase-title]");
    const counter = scope.querySelector<HTMLElement>("[data-showcase-current]");
    const progress = scope.querySelector<HTMLElement>("[data-showcase-progress]");
    const playButton = scope.querySelector<HTMLButtonElement>("[data-showcase-play]");
    const playIcon = scope.querySelector<HTMLElement>("[data-showcase-play-icon]");
    const pauseIcon = scope.querySelector<HTMLElement>("[data-showcase-pause-icon]");
    const selector = scope.querySelector<HTMLElement>("[data-showcase-selector]");
    const selectorZone = scope.querySelector<HTMLElement>("[data-showcase-selector-zone]");
    const thumbs = Array.from(scope.querySelectorAll<HTMLButtonElement>("[data-showcase-thumb]"));
    const volumeControl = scope.querySelector<HTMLElement>("[data-showcase-volume-control]");
    const volumeToggle = scope.querySelector<HTMLButtonElement>("[data-showcase-volume-toggle]");
    const volumePanel = scope.querySelector<HTMLElement>("[data-showcase-volume-panel]");
    const volumeMute = scope.querySelector<HTMLButtonElement>("[data-showcase-volume-mute]");
    const volumeSlider = scope.querySelector<HTMLInputElement>("[data-showcase-volume]");
    const volumeValue = scope.querySelector<HTMLElement>("[data-showcase-volume-value]");
    const volumeOnIcons = Array.from(scope.querySelectorAll<SVGElement>("[data-showcase-volume-on]"));
    const volumeOffIcons = Array.from(scope.querySelectorAll<SVGElement>("[data-showcase-volume-off]"));

    if (!video || !title || !counter || !progress || !playButton) return;

    let index = 0;
    let elapsed = 0;
    let lastFrame = performance.now();
    let running = true;

    let volume = Number(volumeSlider?.value ?? 100) / 100;
    let muted = video.muted;

    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    let hideSelectorTimer: number | undefined;

    const pad = (value: number) => String(value).padStart(2, "0");

    // Keep the video and every volume control in sync
    const updateVolumeUI = () => {
        const audible = !muted && volume > 0;
        video.volume = volume;
        video.muted = !audible;

        const percent = Math.round(volume * 100);
        volumeOnIcons.forEach((icon) => icon.classList.toggle("hidden", !audible));
        volumeOffIcons.forEach((icon) => icon.classList.toggle("hidden", audible));
        volumeMute?.setAttribute("aria-label", audible ? "Silenciar video" : "Activar sonido");
        volumeToggle?.setAttribute(
            "aria-label",
            audible ? `Controlar volumen (${percent} %)` : `Controlar volumen (silenciado)`,
        );
        if (volumeSlider) {
            volumeSlider.value = String(percent);
            volumeSlider.style.setProperty("--volume-level", `${percent}%`);
            volumeSlider.setAttribute("aria-valuetext", `${percent} %`);
        }
        if (volumeValue) volumeValue.textContent = String(percent);
    };

    // Show the video selector
    const showSelector = () => {
        if (!selector) return;
        selector.dataset.hidden = "false";
        window.clearTimeout(hideSelectorTimer);
    };

    // Hide the video selector after a delay
    const scheduleSelectorHide = () => {
        if (!selector || !canHover.matches || selectorZone?.matches(":hover") || selector.contains(document.activeElement)) return;
        window.clearTimeout(hideSelectorTimer);
        hideSelectorTimer = window.setTimeout(() => {
            selector.dataset.hidden = "true";
        }, 3000);
    };

    const play = () => {
        const attempt = video.play();
        if (attempt) {
            attempt.catch(() => {
                // Autoplay with sound was blocked: reflect the muted state in the UI
                muted = true;
                updateVolumeUI();
                video.play().catch(() => {});
            });
        }
    };

    // Manage the data and UI for the current video
    const render = (scrollThumb: boolean) => {
        const item = items[index];

        counter.textContent = pad(index + 1);
        video.poster = item.thumbnailSrc;
        video.src = item.videoSrc;
        updateVolumeUI();

        thumbs.forEach((thumb, i) => {
            const active = i === index;
            thumb.dataset.active = String(active);
            thumb.setAttribute("aria-pressed", String(active));
            if (active && scrollThumb) {
                thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
        });
    };

    // Update the current index and reset the progress
    const setIndex = (next: number, scrollThumb = true) => {
        index = (next + items.length) % items.length;
        elapsed = 0;
        progress.style.transform = "scaleX(0)";
        render(scrollThumb);
        play();
    };

    // Animation loop to update the progress bar and switch videos
    const tick = (now: number) => {
        const delta = Math.min(now - lastFrame, 250);
        lastFrame = now;

        if (running && !document.hidden) {
            elapsed += delta;
            if (elapsed >= SHOWCASE_INTERVAL) {
                setIndex(index + 1);
            } else {
                progress.style.transform = `scaleX(${elapsed / SHOWCASE_INTERVAL})`;
            }
        }

        requestAnimationFrame(tick);
    };

    playButton.addEventListener("click", () => {
        running = !running;

        if (running) {
            updateVolumeUI();
            play();
        } else {
            video.pause();
        }

        playIcon?.classList.toggle("hidden", running);
        pauseIcon?.classList.toggle("hidden", !running);
        playButton.setAttribute("aria-label", running ? "Pausar video" : "Reanudar video");
        lastFrame = performance.now();
    });

    const manualSelect = (next: number) => {
        showSelector();
        scheduleSelectorHide();
        setIndex(next);
    };

    scope.querySelector("[data-showcase-prev]")?.addEventListener("click", () => manualSelect(index - 1));
    scope.querySelector("[data-showcase-next]")?.addEventListener("click", () => manualSelect(index + 1));

    thumbs.forEach((thumb, i) => {
        thumb.addEventListener("click", () => manualSelect(i));
    });

    selectorZone?.addEventListener("mouseenter", showSelector);
    selectorZone?.addEventListener("mouseleave", scheduleSelectorHide);
    selector?.addEventListener("focusin", showSelector);
    selector?.addEventListener("focusout", scheduleSelectorHide);
    canHover.addEventListener("change", () => {
        if (canHover.matches) scheduleSelectorHide();
        else showSelector();
    });

    const setVolumePanel = (open: boolean) => {
        volumePanel?.setAttribute("data-open", String(open));
        volumeToggle?.setAttribute("aria-expanded", String(open));
    };

    volumeToggle?.addEventListener("click", (event) => {
        event.stopPropagation();
        setVolumePanel(volumePanel?.dataset.open !== "true");
    });

    volumeMute?.addEventListener("click", () => {
        muted = !muted;
        if (!muted && volume === 0) volume = 0.5;
        updateVolumeUI();
    });

    volumeSlider?.addEventListener("input", () => {
        volume = Number(volumeSlider.value) / 100;
        muted = volume === 0;
        updateVolumeUI();
    });

    document.addEventListener("click", (event) => {
        if (volumePanel?.dataset.open === "true" && !volumeControl?.contains(event.target as Node)) {
            setVolumePanel(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setVolumePanel(false);
    });

    render(false);
    play();
    scheduleSelectorHide();
    requestAnimationFrame(tick);
}
