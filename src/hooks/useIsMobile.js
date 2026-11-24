import { useState, useEffect } from 'react';

/**
 * Hook to detect whether the user is on a mobile device or screen.
 * Considers both window width (< 768px) and user-agent / touch capabilities.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isSmallScreen = window.innerWidth < breakpoint;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    return isSmallScreen || isMobileUA;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    
    const updateMobile = () => {
      const isSmallScreen = window.innerWidth < breakpoint;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(isSmallScreen || isMobileUA);
    };

    updateMobile();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMobile);
    } else {
      mediaQuery.addListener(updateMobile);
    }

    window.addEventListener('resize', updateMobile);
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMobile);
      } else {
        mediaQuery.removeListener(updateMobile);
      }
      window.removeEventListener('resize', updateMobile);
    };
  }, [breakpoint]);

  return isMobile;
}
