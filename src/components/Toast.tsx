'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import './Toast.css';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = {
      id,
      message,
      type,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div 
      className="toast-container"
      style={{
        position: 'fixed',
        top: '100px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
      }}>
      {toasts.map((toast, index) => (
        <ToastItem key={toast.id} toast={toast} index={index} />
      ))}
    </div>
  );
}

function ToastItem({ toast, index }: { toast: Toast; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);

    // Start fade out before removal
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

    return () => clearTimeout(fadeOutTimer);
  }, []);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        );
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: '#10b981',
          shadow: 'rgba(16, 185, 129, 0.4)',
        };
      case 'info':
        return {
          bg: '#3b82f6',
          shadow: 'rgba(59, 130, 246, 0.4)',
        };
      case 'error':
        return {
          bg: '#ef4444',
          shadow: 'rgba(239, 68, 68, 0.4)',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className="toast-wrapper"
      style={{
        transform: isFadingOut 
          ? 'translateX(400px) scale(0.95)' 
          : isVisible 
            ? 'translateX(0) scale(1)' 
            : 'translateX(400px) scale(0.95)',
        opacity: isFadingOut ? 0 : isVisible ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        pointerEvents: 'auto',
      }}
    >
      <div
        className="toast-item"
        style={{
          background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg} 100%)`,
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '16px',
          boxShadow: `0 12px 48px ${colors.shadow}, 0 8px 16px rgba(0,0,0,0.2)`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: '600',
          minWidth: '300px',
          maxWidth: '380px',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255,255,255,0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer effect */}
        <div 
          className="toast-shimmer"
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          }} 
        />
        
        {getIcon()}
        <span style={{ lineHeight: '1.5', flex: 1, position: 'relative', zIndex: 1 }}>{toast.message}</span>
        
        {/* Progress bar */}
        <div 
          className="toast-progress"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            width: '100%',
            background: 'rgba(255,255,255,0.4)',
          }} 
        />
      </div>
    </div>
  );
}

