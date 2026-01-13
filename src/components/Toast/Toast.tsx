'use client';

import { useEffect, useState, type ReactElement } from 'react';
import type { ToastType } from './ToastContext';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  onDismiss: () => void;
}

const typeStyles: Record<ToastType, {
  borderColor: string;
  iconColor: string;
  bgGradient: string;
  icon: ReactElement;
}> = {
  success: {
    borderColor: 'var(--color-excellent)',
    iconColor: 'var(--color-excellent)',
    bgGradient: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  error: {
    borderColor: 'var(--color-at-risk)',
    iconColor: 'var(--color-at-risk)',
    bgGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    borderColor: 'var(--color-attention)',
    iconColor: 'var(--color-attention)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 186, 0, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    borderColor: 'var(--class-purple)',
    iconColor: 'var(--class-purple)',
    bgGradient: 'linear-gradient(135deg, rgba(71, 57, 231, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export default function Toast({ message, type, duration, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const styles = typeStyles[type];

  // Entrance animation
  useEffect(() => {
    // Trigger entrance animation after mount
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="pointer-events-auto toast-item"
      style={{
        transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(120%)',
        opacity: isVisible && !isExiting ? 1 : 0,
        transition: 'transform 0.3s var(--ease-out-expo), opacity 0.2s ease',
      }}
    >
      <div
        className="flex items-start gap-3 p-4 rounded-lg shadow-lg min-w-[280px] max-w-[380px] relative overflow-hidden"
        style={{
          background: styles.bgGradient,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(71, 57, 231, 0.1)',
          boxShadow: '0 10px 25px -5px rgba(71, 57, 231, 0.15), 0 8px 10px -6px rgba(71, 57, 231, 0.1)',
        }}
      >
        {/* Left accent border */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: styles.borderColor }}
        />

        {/* Icon */}
        <div style={{ color: styles.iconColor }} className="flex-shrink-0 mt-0.5">
          {styles.icon}
        </div>

        {/* Message */}
        <p className="flex-1 text-sm font-medium" style={{ color: 'var(--text-color)' }}>
          {message}
        </p>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded transition-colors focus-ring"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-color)';
            e.currentTarget.style.background = 'rgba(71, 57, 231, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Progress bar (countdown) */}
        {duration > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ background: 'rgba(71, 57, 231, 0.1)' }}
          >
            <div
              className="h-full toast-progress"
              style={{
                background: styles.borderColor,
                animation: `toast-countdown ${duration}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
