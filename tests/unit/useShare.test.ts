/**
 * Unit tests for useShare hook
 *
 * Tests the share functionality including:
 * - URL generation with map state
 * - Clipboard fallback
 * - Web Share API integration
 */

import { renderHook, act } from '@testing-library/react';
import { useShare } from '@/hooks/useShare';

// Mock navigator APIs
const mockClipboard = {
  writeText: jest.fn().mockResolvedValue(undefined),
};

const mockShare = jest.fn().mockResolvedValue(undefined);

describe('useShare hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
    });

    // Mock navigator.share (initially undefined)
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    // Mock navigator.canShare (initially undefined)
    Object.defineProperty(navigator, 'canShare', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it('should return share function and loading state', () => {
    const { result } = renderHook(() => useShare());

    expect(result.current.share).toBeDefined();
    expect(typeof result.current.share).toBe('function');
    expect(result.current.isSharing).toBe(false);
    expect(result.current.canNativeShare).toBe(false);
  });

  it('should generate correct URL with map state', async () => {
    const { result } = renderHook(() => useShare());

    await act(async () => {
      const response = await result.current.share({
        lat: 33.8361,
        lng: -80.945,
        zoom: 10,
        chamber: 'house',
        district: 5,
      });
      expect(response.success).toBe(true);
    });

    // Check clipboard was called with URL containing map params
    // Note: buildMapUrl only includes params that differ from defaults
    // lat/lng are excluded if they match defaults, chamber='house' is default
    expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
    const copiedUrl = mockClipboard.writeText.mock.calls[0][0];
    expect(copiedUrl).toContain('zoom=10'); // zoom differs from default 7
    expect(copiedUrl).toContain('district=5'); // district is always included if present
  });

  it('should use clipboard fallback when Web Share API is not available', async () => {
    const { result } = renderHook(() => useShare());

    await act(async () => {
      const response = await result.current.share();
      expect(response.success).toBe(true);
      expect(response.method).toBe('clipboard');
    });

    expect(mockClipboard.writeText).toHaveBeenCalled();
  });

  it('should use Web Share API when available and supported', async () => {
    // Enable Web Share API
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: () => true,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useShare());

    // canNativeShare should now be true
    expect(result.current.canNativeShare).toBe(true);

    await act(async () => {
      const response = await result.current.share({}, { preferNative: true });
      expect(response.success).toBe(true);
      expect(response.method).toBe('native');
    });

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.any(String),
        title: expect.any(String),
      })
    );
  });

  it('should handle clipboard errors gracefully', async () => {
    mockClipboard.writeText.mockRejectedValueOnce(new Error('Clipboard access denied'));

    const { result } = renderHook(() => useShare());

    await act(async () => {
      const response = await result.current.share();
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  it('should set isSharing during share operation', async () => {
    let resolveClipboard: () => void;
    const clipboardPromise = new Promise<void>((resolve) => {
      resolveClipboard = resolve;
    });
    mockClipboard.writeText.mockReturnValueOnce(clipboardPromise);

    const { result } = renderHook(() => useShare());

    let sharePromise: Promise<unknown>;
    act(() => {
      sharePromise = result.current.share();
    });

    // isSharing should be true while operation is in progress
    expect(result.current.isSharing).toBe(true);

    await act(async () => {
      resolveClipboard!();
      await sharePromise;
    });

    // isSharing should be false after operation completes
    expect(result.current.isSharing).toBe(false);
  });

  it('should include chamber and district in URL when provided', async () => {
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share({ chamber: 'senate', district: 10 });
    });

    const copiedUrl = mockClipboard.writeText.mock.calls[0][0];
    expect(copiedUrl).toContain('chamber=senate');
    expect(copiedUrl).toContain('district=10');
  });

  it('should accept custom share title and text', async () => {
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: () => true,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share(
        {},
        {
          preferNative: true,
          title: 'Custom Title',
          text: 'Custom description',
        }
      );
    });

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Custom Title',
        text: 'Custom description',
      })
    );
  });

  it('should return shareable URL from getShareUrl', () => {
    const { result } = renderHook(() => useShare());

    // chamber='house' is the default, so it won't be included
    // district is always included if present
    const url = result.current.getShareUrl({ district: 5, chamber: 'house' });
    expect(url).toContain('district=5');

    // Test with non-default chamber
    const url2 = result.current.getShareUrl({ district: 5, chamber: 'senate' });
    expect(url2).toContain('district=5');
    expect(url2).toContain('chamber=senate');
  });

  it('should return getShareUrl function', () => {
    const { result } = renderHook(() => useShare());

    expect(result.current.getShareUrl).toBeDefined();
    expect(typeof result.current.getShareUrl).toBe('function');
  });
});
