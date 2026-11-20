export interface StackSlot {
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
}

const VISIBLE_SLOTS: StackSlot[] = [
    { y: 0, scale: 1, rotation: 0, opacity: 1 },
    { y: -18, scale: 0.955, rotation: -1.6, opacity: 0.9 },
    { y: -34, scale: 0.91, rotation: 1.6, opacity: 0.78 },
];

const HIDDEN_SLOT: StackSlot = { y: -46, scale: 0.87, rotation: 0, opacity: 0 };

export const getStackSlot = (position: number): StackSlot =>
    VISIBLE_SLOTS[position] ?? HIDDEN_SLOT;

export const getStackStyle = (position: number) => {
    const slot = getStackSlot(position);
    return [
        `--stack-y:${slot.y}px`,
        `--stack-scale:${slot.scale}`,
        `--stack-rot:${slot.rotation}deg`,
        `--stack-opacity:${slot.opacity}`,
        `z-index:${Math.max(0, 30 - position * 10)}`,
    ].join(";");
};
