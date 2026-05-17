type ErrorIconKind = 'offline' | 'network' | 'not-found' | 'generic' | 'forbidden';

type ErrorIconProps = {
  kind?: ErrorIconKind;
  className?: string;
  size?: number;
};

export default function ErrorIcon({ kind = 'generic', className = '', size = 120 }: ErrorIconProps) {
  const id = `err-bg-${kind}`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="60" cy="60" r="56" fill={`url(#${id})`} />
      {kind === 'not-found' ? (
        <>
          <circle cx="52" cy="52" r="18" stroke="#94a3b8" strokeWidth="4" fill="none" />
          <line x1="66" y1="66" x2="82" y2="82" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
          <path d="M48 70h16M52 58v8" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : kind === 'forbidden' ? (
        <>
          <rect x="44" y="50" width="32" height="28" rx="6" stroke="#94a3b8" strokeWidth="4" fill="none" />
          <path d="M60 50V42a8 8 0 00-8 8" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="60" cy="64" r="3" fill="#64748b" />
        </>
      ) : (
        <>
          <path d="M60 72c-6.6 0-12 5.4-12 12h24c0-6.6-5.4-12-12-12z" fill="#64748b" />
          <path d="M44 64c8-8 24-8 32 0" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <path d="M34 54c14-12 38-12 52 0" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <path d="M24 44c20-18 52-18 72 0" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          {(kind === 'offline' || kind === 'network') && (
            <line x1="28" y1="92" x2="92" y2="28" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
          )}
        </>
      )}
      <defs>
        <linearGradient id={id} x1="20" y1="16" x2="100" y2="104" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8fafc" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
