type OfflineIconProps = {
  className?: string;
  size?: number;
};

/** Wi‑Fi off style illustration for connection errors */
export default function OfflineIcon({ className = '', size = 120 }: OfflineIconProps) {
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
      <circle cx="60" cy="60" r="56" fill="url(#offline-bg)" />
      <path
        d="M60 72c-6.6 0-12 5.4-12 12h24c0-6.6-5.4-12-12-12z"
        fill="#64748b"
      />
      <path
        d="M44 64c8-8 24-8 32 0"
        stroke="#94a3b8"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M34 54c14-12 38-12 52 0"
        stroke="#94a3b8"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M24 44c20-18 52-18 72 0"
        stroke="#cbd5e1"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="28"
        y1="92"
        x2="92"
        y2="28"
        stroke="#ef4444"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="offline-bg" x1="20" y1="16" x2="100" y2="104" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8fafc" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
