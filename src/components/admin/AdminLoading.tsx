'use client';

import './admin-loading.css';

export type AdminLoadingVariant = 'fullscreen' | 'page' | 'section' | 'compact';

type AdminLoadingProps = {
  /** Main label under the spinner */
  message?: string;
  /** Optional second line */
  subMessage?: string;
  /** Layout size — page is centered in admin content area */
  variant?: AdminLoadingVariant;
  className?: string;
};

export default function AdminLoading({
  message = 'Loading…',
  subMessage,
  variant = 'page',
  className = '',
}: AdminLoadingProps) {
  return (
    <div
      className={`admin-loading admin-loading--${variant}${className ? ` ${className}` : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="admin-loading__card">
        <div className="admin-loading__spinner-wrap" aria-hidden>
          <span className="admin-loading__ring admin-loading__ring--outer" />
          <span className="admin-loading__ring admin-loading__ring--inner" />
          <span className="admin-loading__dot" />
        </div>
        <p className="admin-loading__title">{message}</p>
        {subMessage ? <p className="admin-loading__subtitle">{subMessage}</p> : null}
        <div className="admin-loading__dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
