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

    if (!video || !title || !counter || !progress || !playButton) return;

    let index = 0;
    let elapsed = 0;
    let lastFrame = performance.now();
    let running = true;

    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    let hideSelectorTimer: number | undefined;

    const pad = (value: number) => String(value).padStart(2, "0");

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
                video.muted = true;
                video.play().catch(() => {});
            });
        }
    };

    // Manage the data and UI for the current video
    const render = (scrollThumb: boolean) => {
        const item = items[index];

        title.textContent = item.title;
        counter.textContent = pad(index + 1);
        video.poster = item.thumbnailSrc;
        video.src = item.videoSrc;

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
            video.muted = false;
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

    render(false);
    play();
    scheduleSelectorHide();
    requestAnimationFrame(tick);
}
