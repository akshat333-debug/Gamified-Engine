'use client';

import { useEffect, useCallback } from 'react';

interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    colors?: string[];
}

export function useConfetti() {
    const fire = useCallback(async (options?: ConfettiOptions) => {
        if (typeof window === 'undefined') return;

        const confetti = (await import('canvas-confetti')).default;

        const defaults = {
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#8b5cf6', '#ec4899', '#6366f1', '#f59e0b', '#10b981'],
            ...options,
        };

        // Fire multiple bursts
        confetti({
            ...defaults,
            angle: 60,
            origin: { x: 0, y: 0.65 },
        });

        confetti({
            ...defaults,
            angle: 120,
            origin: { x: 1, y: 0.65 },
        });

        // Center burst after a delay
        setTimeout(() => {
            confetti({
                ...defaults,
                particleCount: 150,
                spread: 100,
                origin: { x: 0.5, y: 0.5 },
            });
        }, 200);
    }, []);

    return { fire };
}

// Celebration effect for major milestones
export function fireworksConfetti() {
    if (typeof window === 'undefined') return;

    import('canvas-confetti').then(({ default: confetti }) => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }

            confetti({
                particleCount: 50,
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                origin: {
                    x: Math.random(),
                    y: Math.random() - 0.2,
                },
                colors: ['#8b5cf6', '#ec4899', '#6366f1', '#f59e0b', '#10b981'],
            });
        }, 250);
    });
}

// Simple confetti burst for smaller achievements
export function simpleConfetti() {
    if (typeof window === 'undefined') return;

    import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#8b5cf6', '#ec4899', '#6366f1'],
        });
    });
}
