import { useEffect, useState, useCallback } from 'react';

// Custom hook for managing focus
export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState(null);
  
  const setFocus = useCallback((element) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
      setFocusedElement(element);
    }
  }, []);
  
  const restoreFocus = useCallback(() => {
    if (focusedElement && typeof focusedElement.focus === 'function') {
      focusedElement.focus();
    }
  }, [focusedElement]);
  
  return { setFocus, restoreFocus, focusedElement };
};

// Custom hook for keyboard navigation
export const useKeyboardNavigation = (items, onSelect, options = {}) => {
  const [currentIndex, setCurrentIndex] = useState(options.initialIndex || -1);
  const { loop = true, disabled = false } = options;
  
  const handleKeyDown = useCallback((event) => {
    if (disabled || !items.length) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setCurrentIndex(prev => {
          const nextIndex = prev + 1;
          return nextIndex >= items.length ? (loop ? 0 : prev) : nextIndex;
        });
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setCurrentIndex(prev => {
          const nextIndex = prev - 1;
          return nextIndex < 0 ? (loop ? items.length - 1 : prev) : nextIndex;
        });
        break;
        
      case 'Home':
        event.preventDefault();
        setCurrentIndex(0);
        break;
        
      case 'End':
        event.preventDefault();
        setCurrentIndex(items.length - 1);
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < items.length && onSelect) {
          onSelect(items[currentIndex], currentIndex);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        setCurrentIndex(-1);
        break;
    }
  }, [items, currentIndex, onSelect, loop, disabled]);
  
  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
    isActive: (index) => index === currentIndex
  };
};

// Custom hook for screen reader announcements
export const useScreenReader = () => {
  const [announcements, setAnnouncements] = useState([]);
  
  const announce = useCallback((message, priority = 'polite') => {
    const id = Date.now();
    const announcement = { id, message, priority };
    
    setAnnouncements(prev => [...prev, announcement]);
    
    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  }, []);
  
  const announceError = useCallback((message) => {
    announce(`Error: ${message}`, 'assertive');
  }, [announce]);
  
  const announceSuccess = useCallback((message) => {
    announce(`Success: ${message}`, 'polite');
  }, [announce]);
  
  const announceLoading = useCallback((message = 'Loading') => {
    announce(message, 'polite');
  }, [announce]);
  
  return {
    announce,
    announceError,
    announceSuccess,
    announceLoading,
    announcements
  };
};

// Custom hook for managing reduced motion preferences
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);
  
  return prefersReducedMotion;
};

// Custom hook for high contrast mode detection
export const useHighContrast = () => {
  const [highContrast, setHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);
    
    const handleChange = (event) => {
      setHighContrast(event.matches);
    };
    
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);
  
  return highContrast;
};

// Custom hook for managing ARIA live regions
export const useAriaLive = () => {
  const [liveRegions, setLiveRegions] = useState({
    polite: '',
    assertive: ''
  });
  
  const updateLiveRegion = useCallback((message, type = 'polite') => {
    setLiveRegions(prev => ({
      ...prev,
      [type]: message
    }));
    
    // Clear after announcement
    setTimeout(() => {
      setLiveRegions(prev => ({
        ...prev,
        [type]: ''
      }));
    }, 1000);
  }, []);
  
  return {
    liveRegions,
    updateLiveRegion
  };
};

// Custom hook for managing focus trap
export const useFocusTrap = (isActive = false) => {
  const [containerRef, setContainerRef] = useState(null);
  
  const setRef = useCallback((element) => {
    setContainerRef(element);
  }, []);
  
  useEffect(() => {
    if (!isActive || !containerRef) return;
    
    const focusableElements = containerRef.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (firstElement) {
      firstElement.focus();
    }
    
    const handleTabKey = (event) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isActive, containerRef]);
  
  return setRef;
};

// Utility functions for accessibility
export const a11yUtils = {
  // Generate unique IDs for form labels and descriptions
  generateId: (prefix = 'a11y') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // Check if an element is focusable
  isFocusable: (element) => {
    if (!element) return false;
    
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex=\"-1\"])'
    ];
    
    return focusableSelectors.some(selector => element.matches(selector));
  },
  
  // Get all focusable elements within a container
  getFocusableElements: (container) => {
    if (!container) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex=\"-1\"])'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors));
  },
  
  // Create accessible description for complex UI elements
  createDescription: (element, description) => {
    const descId = a11yUtils.generateId('desc');
    const descElement = document.createElement('div');
    descElement.id = descId;
    descElement.textContent = description;
    descElement.className = 'sr-only';
    
    document.body.appendChild(descElement);
    element.setAttribute('aria-describedby', descId);
    
    return () => {
      document.body.removeChild(descElement);
      element.removeAttribute('aria-describedby');
    };
  },
  
  // Announce message to screen readers
  announce: (message, priority = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    
    document.body.appendChild(announcer);
    
    // Small delay to ensure screen reader picks up the change
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
    
    // Clean up after announcement
    setTimeout(() => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    }, 1500);
  }
};

// Component for screen reader only content
export const ScreenReaderOnly = ({ children, as: Component = 'div', ...props }) => {
  return (
    <Component className=\"sr-only\" {...props}>
      {children}
    </Component>
  );
};

// Component for skip links
export const SkipLink = ({ href, children }) => {
  return (
    <a
      href={href}
      className=\"sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md font-medium z-50 focus:z-50\"
    >
      {children}
    </a>
  );
};

// Component for live region announcements
export const LiveRegion = ({ announcements }) => {
  return (
    <>
      <div 
        aria-live=\"polite\" 
        aria-atomic=\"true\" 
        className=\"sr-only\"
      >
        {announcements.filter(a => a.priority === 'polite').map(a => (
          <div key={a.id}>{a.message}</div>
        ))}
      </div>
      <div 
        aria-live=\"assertive\" 
        aria-atomic=\"true\" 
        className=\"sr-only\"
      >
        {announcements.filter(a => a.priority === 'assertive').map(a => (
          <div key={a.id}>{a.message}</div>
        ))}
      </div>
    </>
  );
};"