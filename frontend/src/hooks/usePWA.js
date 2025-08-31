import { useState, useEffect, useCallback } from 'react';

// Custom hook for PWA functionality
export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  // Check if app is installed
  useEffect(() => {
    const checkInstalled = () => {
      // Check if running in standalone mode
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check if running in PWA mode on iOS
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const iOSStandalone = iOS && window.navigator.standalone;
      
      setIsInstalled(standalone || iOSStandalone);
    };
    
    checkInstalled();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addListener(checkInstalled);
    
    return () => mediaQuery.removeListener(checkInstalled);
  }, []);
  
  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsInstallable(true);
    };
    
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Install app
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error installing app:', error);
      return false;
    }
  }, [deferredPrompt]);
  
  return {
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    installApp
  };
};

// Custom hook for service worker management
export const useServiceWorker = () => {
  const [registration, setRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);
      
      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case 'SYNC_SUCCESS':
            // Handle successful background sync
            console.log('Background sync successful:', payload);
            break;
          case 'CACHE_UPDATED':
            // Handle cache updates
            console.log('Cache updated:', payload);
            break;
          default:
            console.log('SW message:', event.data);
        }
      });
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateServiceWorker = useCallback(async () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);
  
  const unregisterServiceWorker = useCallback(async () => {
    if (registration) {
      const success = await registration.unregister();
      if (success) {
        setRegistration(null);
        setUpdateAvailable(false);
      }
      return success;
    }
    return false;
  }, [registration]);
  
  return {
    registration,
    updateAvailable,
    isLoading,
    updateServiceWorker,
    unregisterServiceWorker
  };
};

// Custom hook for push notifications
export const usePushNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  
  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);
  
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);
  
  const subscribe = useCallback(async (vapidPublicKey) => {
    if (!isSupported || permission !== 'granted') return null;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });
      
      setSubscription(sub);
      return sub;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }, [isSupported, permission]);
  
  const unsubscribe = useCallback(async () => {
    if (subscription) {
      try {
        const success = await subscription.unsubscribe();
        if (success) {
          setSubscription(null);
        }
        return success;
      } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        return false;
      }
    }
    return false;
  }, [subscription]);
  
  return {
    permission,
    subscription,
    isSupported,
    requestPermission,
    subscribe,
    unsubscribe
  };
};

// Custom hook for offline data management
export const useOfflineData = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState([]);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sync pending actions when coming back online
      syncPendingActions();
    };
    
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load pending actions from localStorage
    loadPendingActions();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const addPendingAction = useCallback((action) => {
    const newAction = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...action
    };
    
    setPendingActions(prev => {
      const updated = [...prev, newAction];
      localStorage.setItem('pendingActions', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  const removePendingAction = useCallback((actionId) => {
    setPendingActions(prev => {
      const updated = prev.filter(action => action.id !== actionId);
      localStorage.setItem('pendingActions', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  const loadPendingActions = useCallback(() => {
    try {
      const stored = localStorage.getItem('pendingActions');
      if (stored) {
        setPendingActions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  }, []);
  
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) return;
    
    for (const action of pendingActions) {
      try {
        // Attempt to execute the pending action
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          removePendingAction(action.id);
        }
      } catch (error) {
        console.error('Error syncing pending action:', error);
      }
    }
  }, [isOnline, pendingActions, removePendingAction]);
  
  return {
    isOnline,
    pendingActions,
    addPendingAction,
    removePendingAction,
    syncPendingActions
  };
};

// Utility functions for PWA
export const pwaUtils = {
  // Check if app is running in standalone mode
  isStandalone: () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator.standalone === true);
  },
  
  // Get app install prompt
  getInstallPrompt: () => {
    return new Promise((resolve) => {
      let deferredPrompt = null;
      
      const handler = (event) => {
        event.preventDefault();
        deferredPrompt = event;
        window.removeEventListener('beforeinstallprompt', handler);
        resolve(deferredPrompt);
      };
      
      window.addEventListener('beforeinstallprompt', handler);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('beforeinstallprompt', handler);
        resolve(null);
      }, 5000);
    });
  },
  
  // Show native share dialog
  share: async (data) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Error sharing:', error);
        return false;
      }
    }
    
    // Fallback to copying to clipboard
    try {
      await navigator.clipboard.writeText(data.url || data.text || '');
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  },
  
  // Cache API response manually
  cacheResponse: async (url, response) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_API_RESPONSE',
        payload: { url, response }
      });
    }
  },
  
  // Clear app cache
  clearCache: async (cacheType = 'all') => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE',
        payload: { cacheType }
      });
    }
  }
};
