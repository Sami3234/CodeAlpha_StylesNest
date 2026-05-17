import type { ReactNode } from 'react';
import './network-ui.css';

type ErrorPageShellProps = {
  children: ReactNode;
  className?: string;
};

/** Full-page background used by 404, error boundaries, and admin errors. */
export default function ErrorPageShell({ children, className = '' }: ErrorPageShellProps) {
  return (
    <div className={`error-page-shell ${className}`.trim()}>
      {children}
    </div>
  );
}
