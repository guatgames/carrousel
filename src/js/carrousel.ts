export function initDragScroll(containerId: string) {
    const viewport = document.getElementById(containerId);
    if (!viewport) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let autoScrollSpeed = 3;
    let animationFrameId: number;
    let isInteracting = false;

    const cards = Array.from(viewport.querySelectorAll('[data-reel-card]')) as HTMLElement[];

    // Calculate the 3D effect
    const update3D = () => {
        const viewportWidth = viewport.clientWidth;
        const scrollCenter = viewport.scrollLeft + viewportWidth / 2;

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            
            // Distance to the screen center
            const distance = cardCenter - scrollCenter;
            
            const normalized = Math.max(-1, Math.min(1, distance / (viewportWidth * 0.6)));
            
            const rotateY = normalized * 35;
            const translateY = Math.abs(normalized) * 35; // Little vertical movement for depth effect
            const translateZ = -Math.abs(normalized) * 60; // Push to the back
            const scale = 1 - Math.abs(normalized) * 0.08; // Do a little scale down to the sides reels

            card.style.transform = `perspective(1000px) translate3d(0, ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
        }
    };

    const play = () => {
        if (!isDown && !isInteracting) {
            viewport.scrollLeft -= autoScrollSpeed;

            // Reset scroll
            if (viewport.scrollLeft <= 0) {
                viewport.scrollLeft = viewport.scrollWidth / 2;
            }
        }
        
        update3D();
        animationFrameId = requestAnimationFrame(play);
    };

    play();

    
    // Drag and Scroll
    viewport.addEventListener('mousedown', (e) => {
        isDown = true;
        viewport.classList.add('cursor-grabbing');
        startX = e.pageX - viewport.offsetLeft;
        scrollLeft = viewport.scrollLeft;
        cancelAnimationFrame(animationFrameId); // Pause the auto-scroll when dragging
    });

    viewport.addEventListener('mouseup', () => {
        isDown = false;
        viewport.classList.remove('cursor-grabbing');
        play(); // Resume scrolling after dragging
    });

    viewport.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        
        const x = e.pageX - viewport.offsetLeft;
        const walk = (x - startX) * 1.5;
        viewport.scrollLeft = scrollLeft - walk;

        // Looping effect for infinite scroll
        if (viewport.scrollLeft >= viewport.scrollWidth / 2) {
            viewport.scrollLeft -= viewport.scrollWidth / 2;
            startX = e.pageX - viewport.offsetLeft;
            scrollLeft = viewport.scrollLeft;
        } else if (viewport.scrollLeft <= 0) {
            viewport.scrollLeft += viewport.scrollWidth / 2;
            startX = e.pageX - viewport.offsetLeft;
            scrollLeft = viewport.scrollLeft;
        }
        
        update3D();
    });
}