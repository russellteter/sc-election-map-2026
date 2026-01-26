'use client';

import { useState, useCallback } from 'react';

export interface SyncDataButtonProps {
  /** Repository owner/name (e.g., 'russellteter/sc-election-map-2026') */
  repo?: string;
  /** Workflow file name (default: 'ethics-monitor.yml') */
  workflowId?: string;
  /** Branch to trigger workflow on (default: 'main') */
  ref?: string;
  /** Additional className */
  className?: string;
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * SyncDataButton
 *
 * Triggers a GitHub Actions workflow to sync data from Challenge Sheet.
 * Only renders if NEXT_PUBLIC_GITHUB_PAT environment variable is set.
 *
 * Requires a GitHub PAT with `actions:write` and `repo` permissions.
 */
export default function SyncDataButton({
  repo = 'russellteter/sc-election-map-2026',
  workflowId = 'ethics-monitor.yml',
  ref = 'main',
  className = '',
}: SyncDataButtonProps) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check for PAT availability (client-side only)
  const githubPat = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_GITHUB_PAT
    : null;

  // Trigger workflow dispatch
  const handleSync = useCallback(async () => {
    if (!githubPat) {
      setStatus('error');
      setErrorMessage('GitHub PAT not configured');
      return;
    }

    setStatus('syncing');
    setErrorMessage(null);

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows/${workflowId}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${githubPat}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({ ref }),
        }
      );

      if (response.status === 204) {
        // Success - workflow dispatch returns 204 No Content
        setStatus('success');
        // Reset to idle after 3 seconds
        setTimeout(() => setStatus('idle'), 3000);
      } else if (response.status === 401) {
        setStatus('error');
        setErrorMessage('Invalid GitHub PAT');
      } else if (response.status === 404) {
        setStatus('error');
        setErrorMessage('Workflow not found');
      } else {
        const data = await response.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage(data.message || `Error: ${response.status}`);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Network error');
    }
  }, [githubPat, repo, workflowId, ref]);

  // Don't render if no PAT is configured
  if (!githubPat) {
    return null;
  }

  return (
    <div className={`sync-data-button ${className}`}>
      <button
        type="button"
        onClick={handleSync}
        disabled={status === 'syncing'}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          transition-all focus:outline-none focus:ring-2 focus:ring-offset-2
          ${status === 'syncing' ? 'opacity-75 cursor-not-allowed' : ''}
          ${status === 'success'
            ? 'bg-green-100 text-green-800 border border-green-300'
            : status === 'error'
            ? 'bg-red-100 text-red-800 border border-red-300'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }
        `}
        aria-busy={status === 'syncing'}
        aria-describedby={status === 'error' ? 'sync-error' : undefined}
      >
        {/* Icon based on status */}
        {status === 'syncing' ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
        ) : status === 'success' ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : status === 'error' ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}

        {/* Button text based on status */}
        <span>
          {status === 'syncing'
            ? 'Syncing...'
            : status === 'success'
            ? 'Sync Started!'
            : status === 'error'
            ? 'Sync Failed'
            : 'Sync Data'}
        </span>
      </button>

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <p id="sync-error" className="mt-2 text-xs text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export { SyncDataButton };
