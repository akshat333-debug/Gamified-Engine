'use client';

import { useState, useEffect } from 'react';

import { useState, useEffect, useSyncExternalStore } from 'react';

export function useOffline() {
    const isOffline = useSyncExternalStore(
        (callback) => {
            window.addEventListener('online', callback);
            window.addEventListener('offline', callback);
            return () => {
                window.removeEventListener('online', callback);
                window.removeEventListener('offline', callback);
            };
        },
        () => !navigator.onLine,
        () => false
    );

    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        if (isOffline) {
            setWasOffline(true);
            console.log('📴 Gone offline');
        } else if (wasOffline) {
            console.log('🌐 Back online! Syncing...');
            syncOfflineData();
        }
    }, [isOffline, wasOffline]);

    return { isOffline, wasOffline };
}

async function syncOfflineData() {
    // Sync queued actions when back online
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (registration as any).sync.register('sync-programs');
            console.log('✅ Sync registered');
        } catch (error) {
            console.error('Sync registration failed:', error);
        }
    }
}

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const install = async () => {
        if (!installPrompt) return false;

        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
            setInstallPrompt(null);
            return true;
        }
        return false;
    };

    return { canInstall: !!installPrompt, isInstalled, install };
}
