'use client';

import Link from 'next/link';
import ErrorIcon from '@/components/network/ErrorIcon';
import {
  NETWORK_ERROR_MESSAGE,
  NETWORK_ERROR_TITLE,
  OFFLINE_MESSAGE,
  OFFLINE_TITLE,
  GENERIC_PAGE_ERROR_MESSAGE,
  GENERIC_PAGE_ERROR_TITLE,
  NOT_FOUND_MESSAGE,
  NOT_FOUND_TITLE,
  FORBIDDEN_MESSAGE,
  FORBIDDEN_TITLE,
} from '@/lib/network-messages';

export type ConnectionProblemVariant = 'page' | 'section' | 'fullscreen' | 'overlay';
export type ConnectionProblemKind = 'offline' | 'network' | 'generic' | 'not-found' | 'forbidden';

type ConnectionProblemProps = {
  variant?: ConnectionProblemVariant;
  kind?: ConnectionProblemKind;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  homeHref?: string;
  homeLabel?: string;
  theme?: 'store' | 'admin';
  className?: string;
};

function copyForKind(kind: ConnectionProblemKind) {
  switch (kind) {
    case 'offline':
      return { title: OFFLINE_TITLE, message: OFFLINE_MESSAGE };
    case 'network':
      return { title: NETWORK_ERROR_TITLE, message: NETWORK_ERROR_MESSAGE };
    case 'not-found':
      return { title: NOT_FOUND_TITLE, message: NOT_FOUND_MESSAGE };
    case 'forbidden':
      return { title: FORBIDDEN_TITLE, message: FORBIDDEN_MESSAGE };
    case 'generic':
    default:
      return { title: GENERIC_PAGE_ERROR_TITLE, message: GENERIC_PAGE_ERROR_MESSAGE };
  }
}

export default function ConnectionProblem({
  variant = 'page',
  kind = 'network',
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
  homeHref = '/shop',
  homeLabel = 'Back to shop',
  theme = 'store',
  className = '',
}: ConnectionProblemProps) {
  const defaults = copyForKind(kind);
  const displayTitle = title ?? defaults.title;
  const displayMessage = message ?? defaults.message;
  const iconSize = variant === 'section' ? 96 : 120;

  return (
    <div
      className={`connection-problem connection-problem--${variant} connection-problem--${theme} ${className}`.trim()}
      role="alert"
    >
      <div className="connection-problem__card">
        <div className="connection-problem__icon-wrap">
          <ErrorIcon kind={kind === 'forbidden' ? 'forbidden' : kind} size={iconSize} />
        </div>
        <h2 className="connection-problem__title">{displayTitle}</h2>
        <p className="connection-problem__message">{displayMessage}</p>
        <div className="connection-problem__actions">
          {onRetry ? (
            <button
              type="button"
              className="connection-problem__btn connection-problem__btn--primary"
              onClick={onRetry}
            >
              {retryLabel}
            </button>
          ) : null}
          <Link
            href={homeHref}
            className="connection-problem__btn connection-problem__btn--secondary"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
