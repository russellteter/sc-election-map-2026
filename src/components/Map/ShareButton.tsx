'use client';

import { useCallback } from 'react';
import { useShare, type ShareOptions } from '@/hooks/useShare';
import { useToast } from '@/components/Toast/ToastContext';
import type { MapState } from '@/lib/mapStateUtils';

export interface ShareButtonProps {
  /** Current map state to include in URL */
  mapState?: MapState;
  /** Share options (title, text, preferNative) */
  options?: ShareOptions;
  /** Button size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show label text */
  showLabel?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when share succeeds */
  onShare?: (url: string) => void;
  /** Callback when share fails */
  onError?: (error: string) => void;
}

/**
 * ShareButton - Share current map view URL
 *
 * Displays a share button that copies the current map view URL to clipboard
 * or opens the native share sheet on mobile devices.
 *
 * Features:
 * - Web Share API on supported devices (mobile share sheet)
 * - Clipboard fallback on desktop
 * - Visual feedback via toast notifications
 * - Loading state during share operation
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <ShareButton
 *   mapState={{ lat: 33.8, lng: -81, zoom: 10, district: 5 }}
 *   showLabel={true}
 * />
 * ```
 */
export default function ShareButton({
  mapState,
  options = {},
  size = 'sm',
  showLabel = false,
  className = '',
  onShare,
  onError,
}: ShareButtonProps) {
  const { share, isSharing, canNativeShare } = useShare();
  const { showToast } = useToast();

  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const handleShare = useCallback(async () => {
    // Prefer native on mobile if available
    const shareOptions: ShareOptions = {
      preferNative: canNativeShare,
      title: 'SC Election Map 2026',
      text: mapState?.district
        ? `Check out District ${mapState.district} on the SC Election Map`
        : 'Check out this view on the SC Election Map',
      ...options,
    };

    const result = await share(mapState, shareOptions);

    if (result.success) {
      const message =
        result.method === 'native' ? 'Shared successfully!' : 'Link copied to clipboard!';
      showToast(message, 'success', 3000);
      if (result.url) {
        onShare?.(result.url);
      }
    } else if (result.error && result.error !== 'Share cancelled by user') {
      showToast('Failed to share. Please try again.', 'error', 4000);
      onError?.(result.error);
    }
  }, [share, mapState, options, canNativeShare, showToast, onShare, onError]);

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`
        glass-control
        inline-flex items-center gap-1.5
        ${sizeClasses[size]}
        font-medium
        bg-white/90 text-gray-700
        hover:bg-blue-50 hover:text-blue-700
        disabled:opacity-50 disabled:cursor-not-allowed
        rounded-lg transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${className}
      `}
      title={canNativeShare ? 'Share this view' : 'Copy link to clipboard'}
      aria-label={canNativeShare ? 'Share this view' : 'Copy link to clipboard'}
    >
      {isSharing ? (
        // Loading spinner
        <svg
          className={`${iconSizes[size]} animate-spin`}
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : canNativeShare ? (
        // Share icon (for native share)
        <svg
          className={iconSizes[size]}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      ) : (
        // Link/copy icon (for clipboard)
        <svg
          className={iconSizes[size]}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      )}
      {showLabel && <span>{canNativeShare ? 'Share' : 'Copy Link'}</span>}
    </button>
  );
}

export { ShareButton };
