const SLOTS = [
    { y: 0, scale: 1, rot: 0, opacity: "1" },
    { y: -18, scale: 0.955, rot: -1.6, opacity: "0.9" },
    { y: -34, scale: 0.91, rot: 1.6, opacity: "0.78" },
];
const HIDDEN = { y: -46, scale: 0.87, rot: 0, opacity: "0" };

const pad = (n: number) => String(n + 1).padStart(2, "0");
const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

export function initPhotoGallery() {
    const root = document.querySelector<HTMLElement>("[data-photo-gallery]");
    const track = root?.querySelector<HTMLElement>("[data-gallery-track]");
    const cards = Array.from(root?.querySelectorAll<HTMLElement>("[data-photo-card]") ?? []);
    if (!root || !track || !cards.length) return;

    const mobileCounter = root.querySelector<HTMLElement>('[data-gallery-current="mobile"]');
    const desktopCounter = root.querySelector<HTMLElement>('[data-gallery-current="desktop"]');

    // Mobile
    let order = cards.map((_, i) => i);
    let busy = false;

    // Show all cards
    const renderStack = () => {
        cards.forEach((card, i) => {
            const pos = order.indexOf(i);
            const { y, scale, rot, opacity } = SLOTS[pos] ?? HIDDEN;
            card.style.transform = isMobile() ? `translateY(${y}px) scale(${scale}) rotate(${rot}deg)` : "";
            card.style.opacity = isMobile() ? opacity : "";
            card.style.zIndex = String(cards.length - pos);
            card.dataset.front = String(pos === 0);
        });
        if (mobileCounter) mobileCounter.textContent = pad(order[0] ?? 0);
    };

    // Adding browser events
    cards.forEach((card) => {
        let startY = 0;
        let dy = 0;

        // When the user starts to drag
        card.addEventListener("pointerdown", (e) => {
            if (!isMobile() || busy || card.dataset.front !== "true") return;
            startY = e.clientY;
            dy = 0;
            card.dataset.dragging = "true";
            card.setPointerCapture(e.pointerId);
        });

        // When the user moves the card
        card.addEventListener("pointermove", (e) => {
            if (card.dataset.dragging !== "true") return;
            dy = Math.max(0, e.clientY - startY);
            card.style.transform = `translateY(${dy}px) rotate(${Math.min(dy * 0.035, 9)}deg)`;
            card.style.opacity = String(Math.max(0.35, 1 - dy / 700));
        });

        // When the user releases the card
        card.addEventListener("pointerup", () => {
            if (card.dataset.dragging !== "true") return;
            card.dataset.dragging = "false";

            // At what height the card will be throw
            if (dy > Math.min(120, card.offsetHeight * 0.26)) {
                busy = true;
                card.style.transform = `translateY(${card.offsetHeight + 140}px) rotate(-9deg)`;
                card.style.opacity = "0";
                setTimeout(() => {
                    order = [...order.slice(1), order[0]];
                    busy = false;
                    renderStack();
                }, 420);
            } else {
                renderStack();
            }
        });
    });

    // Desktop
    root.querySelectorAll<HTMLButtonElement>("[data-gallery-nav]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const dir = Number(btn.dataset.galleryNav);
            track.scrollBy({ left: dir * (cards[0].offsetWidth + 24), behavior: "smooth" });
        });
    });

    const observer = new IntersectionObserver(
        (entries) => {
            const visible = entries.find((e) => e.isIntersecting);
            if (visible && desktopCounter) {
                desktopCounter.textContent = pad(Number((visible.target as HTMLElement).dataset.index));
            }
        },
        { root: track, threshold: 0.6 }
    );

    cards.forEach((card) => observer.observe(card));
    window.addEventListener("resize", renderStack);
    renderStack();
}