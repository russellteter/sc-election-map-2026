'use client';

import { useState, useCallback, useRef } from 'react';
import { toPng, toJpeg } from 'html-to-image';

interface ScreenshotButtonProps {
  /** Ref to the element to capture (usually the map container) */
  targetRef: React.RefObject<HTMLElement | null>;
  /** Optional filename prefix (default: 'sc-election-map') */
  filename?: string;
  /** Optional className for button styling */
  className?: string;
  /** Whether to show the dropdown menu or just download directly */
  showMenu?: boolean;
  /** Chamber name for filename */
  chamber?: 'house' | 'senate';
  /** State code for filename */
  stateCode?: string;
}

type ExportFormat = 'png' | 'jpg';
type ExportState = 'idle' | 'capturing' | 'success' | 'error';

/**
 * ScreenshotButton - Export map as image
 *
 * Features:
 * - PNG and JPG export formats
 * - Auto-download with timestamped filename
 * - Loading state with spinner
 * - Error handling with retry option
 * - Compact or menu-based UI
 */
export default function ScreenshotButton({
  targetRef,
  filename = 'sc-election-map',
  className = '',
  showMenu = false,
  chamber = 'house',
  stateCode = 'sc',
}: ScreenshotButtonProps) {
  const [state, setState] = useState<ExportState>('idle');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Generate timestamped filename
   */
  const generateFilename = useCallback(
    (format: ExportFormat) => {
      const now = new Date();
      const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const time = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
      return `${filename}-${stateCode}-${chamber}-${date}-${time}.${format}`;
    },
    [filename, stateCode, chamber]
  );

  /**
   * Download the captured image
   */
  const downloadImage = useCallback((dataUrl: string, format: ExportFormat) => {
    const link = document.createElement('a');
    link.download = generateFilename(format);
    link.href = dataUrl;
    link.click();
  }, [generateFilename]);

  /**
   * Capture and download the map
   */
  const captureAndDownload = useCallback(
    async (format: ExportFormat = 'png') => {
      if (!targetRef.current) {
        console.error('[Screenshot] Target element not found');
        setState('error');
        return;
      }

      setState('capturing');
      setShowDropdown(false);

      try {
        // Configure capture options
        const options = {
          quality: 0.95,
          backgroundColor: '#ffffff',
          pixelRatio: 2, // Higher resolution for retina displays
          // Skip external resources that might fail
          skipFonts: false,
          cacheBust: true,
        };

        // Capture the element
        const dataUrl = format === 'png'
          ? await toPng(targetRef.current, options)
          : await toJpeg(targetRef.current, { ...options, quality: 0.92 });

        // Download the image
        downloadImage(dataUrl, format);

        // Brief success state
        setState('success');
        setTimeout(() => setState('idle'), 1500);
      } catch (error) {
        console.error('[Screenshot] Capture failed:', error);
        setState('error');
        setTimeout(() => setState('idle'), 3000);
      }
    },
    [targetRef, downloadImage]
  );

  /**
   * Handle click - either open menu or download directly
   */
  const handleClick = useCallback(() => {
    if (showMenu) {
      setShowDropdown(!showDropdown);
    } else {
      captureAndDownload('png');
    }
  }, [showMenu, showDropdown, captureAndDownload]);

  /**
   * Close dropdown when clicking outside
   */
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Check if focus moved outside the dropdown
    if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node)) {
      setShowDropdown(false);
    }
  }, []);

  const isLoading = state === 'capturing';

  return (
    <div ref={dropdownRef} className={`screenshot-button-container ${className}`} onBlur={handleBlur}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`screenshot-button ${state}`}
        aria-label="Export map as image"
        aria-expanded={showDropdown}
        aria-haspopup={showMenu ? 'menu' : undefined}
      >
        {state === 'capturing' ? (
          <>
            <span className="screenshot-spinner" />
            <span className="screenshot-text">Capturing...</span>
          </>
        ) : state === 'success' ? (
          <>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="screenshot-text">Downloaded!</span>
          </>
        ) : state === 'error' ? (
          <>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="screenshot-text">Failed</span>
          </>
        ) : (
          <>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="screenshot-text">Export</span>
            {showMenu && (
              <svg
                className={`screenshot-chevron ${showDropdown ? 'open' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="14"
                height="14"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {showMenu && showDropdown && (
        <div className="screenshot-dropdown" role="menu">
          <button
            type="button"
            className="screenshot-dropdown-item"
            onClick={() => captureAndDownload('png')}
            role="menuitem"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Download PNG</span>
            <span className="screenshot-format-hint">Best quality</span>
          </button>
          <button
            type="button"
            className="screenshot-dropdown-item"
            onClick={() => captureAndDownload('jpg')}
            role="menuitem"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Download JPG</span>
            <span className="screenshot-format-hint">Smaller file</span>
          </button>
        </div>
      )}
    </div>
  );
}
