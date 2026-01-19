'use client';

import { useState, useEffect } from 'react';

export function useOffline() {
    const [isOffline, setIsOffline] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        // Check initial status
        setIsOffline(!navigator.onLine);

        const handleOnline = () => {
            setIsOffline(false);
            if (wasOffline) {
                // Trigger sync when back online
                console.log('🌐 Back online! Syncing...');
                syncOfflineData();
            }
        };

        const handleOffline = () => {
            setIsOffline(true);
            setWasOffline(true);
            console.log('📴 Gone offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline]);

    return { isOffline, wasOffline };
}

async function syncOfflineData() {
    // Sync queued actions when back online
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        try {
            await (registration as any).sync.register('sync-programs');
            console.log('✅ Sync registered');
        } catch (error) {
            console.error('Sync registration failed:', error);
        }
    }
}

export function usePWAInstall() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
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
