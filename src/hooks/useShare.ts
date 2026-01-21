'use client';

import { useState, useCallback, useMemo } from 'react';
import { buildMapUrl, type MapState } from '@/lib/mapStateUtils';

/**
 * Share options for customizing the share behavior
 */
export interface ShareOptions {
  /** Prefer native Web Share API when available (default: false for clipboard) */
  preferNative?: boolean;
  /** Custom title for share sheet */
  title?: string;
  /** Custom description text for share sheet */
  text?: string;
}

/**
 * Result from a share operation
 */
export interface ShareResult {
  /** Whether the share operation succeeded */
  success: boolean;
  /** The method used for sharing */
  method?: 'native' | 'clipboard';
  /** Error message if operation failed */
  error?: string;
  /** The URL that was shared */
  url?: string;
}

/**
 * Return type for useShare hook
 */
export interface UseShareReturn {
  /** Execute share operation with optional map state */
  share: (mapState?: MapState, options?: ShareOptions) => Promise<ShareResult>;
  /** Whether a share operation is in progress */
  isSharing: boolean;
  /** Whether native Web Share API is available and can share URLs */
  canNativeShare: boolean;
  /** Get the shareable URL without executing share */
  getShareUrl: (mapState?: MapState) => string;
}

/**
 * Default share title
 */
const DEFAULT_TITLE = 'SC Election Map 2026';

/**
 * Default share text
 */
const DEFAULT_TEXT = 'Check out this district view on the SC Election Map';

/**
 * useShare - Hook for sharing the current map view URL
 *
 * Provides share functionality with:
 * - URL generation from map state (lat/lng/zoom/chamber/district)
 * - Web Share API integration for mobile share sheets
 * - Clipboard fallback for desktop browsers
 * - Loading state tracking
 *
 * @returns Share function and state
 *
 * @example
 * ```tsx
 * const { share, isSharing, canNativeShare } = useShare();
 *
 * const handleShare = async () => {
 *   const result = await share(mapState, { preferNative: true });
 *   if (result.success) {
 *     showToast('Link copied!', 'success');
 *   }
 * };
 * ```
 */
export function useShare(): UseShareReturn {
  const [isSharing, setIsSharing] = useState(false);

  // Check if Web Share API is available
  const canNativeShare = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    return (
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ url: 'https://example.com' })
    );
  }, []);

  /**
   * Build shareable URL from current location and map state
   */
  const getShareUrl = useCallback((mapState?: MapState): string => {
    if (typeof window === 'undefined') {
      return '';
    }

    if (!mapState || Object.keys(mapState).length === 0) {
      // Return current URL as-is
      return window.location.href;
    }

    // Build URL with map state params and prefix with origin
    const pathWithParams = buildMapUrl(window.location.pathname, mapState);
    return window.location.origin + pathWithParams;
  }, []);

  /**
   * Copy text to clipboard with fallback
   */
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof navigator === 'undefined') {
      return false;
    }

    // Try modern Clipboard API first
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to legacy method
      }
    }

    // Legacy fallback using textarea
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  };

  /**
   * Execute share operation
   */
  const share = useCallback(
    async (mapState?: MapState, options: ShareOptions = {}): Promise<ShareResult> => {
      const { preferNative = false, title = DEFAULT_TITLE, text = DEFAULT_TEXT } = options;

      setIsSharing(true);

      try {
        const url = getShareUrl(mapState);

        // Try native share if preferred and available
        if (preferNative && canNativeShare && typeof navigator !== 'undefined' && navigator.share) {
          try {
            await navigator.share({
              url,
              title,
              text,
            });
            return { success: true, method: 'native', url };
          } catch (err) {
            // User cancelled or share failed - fall through to clipboard
            if (err instanceof Error && err.name === 'AbortError') {
              // User cancelled - this is not an error
              return { success: false, error: 'Share cancelled by user' };
            }
            // Fall through to clipboard
          }
        }

        // Clipboard fallback
        const copied = await copyToClipboard(url);
        if (copied) {
          return { success: true, method: 'clipboard', url };
        }

        return { success: false, error: 'Failed to copy to clipboard' };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: errorMessage };
      } finally {
        setIsSharing(false);
      }
    },
    [canNativeShare, getShareUrl]
  );

  return {
    share,
    isSharing,
    canNativeShare,
    getShareUrl,
  };
}

export default useShare;
