'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { providerLabel } from '@/lib/shop-users-labels';

type ShopUser = {
  id: number;
  email: string | null;
  name: string | null;
  image: string | null;
  provider: string;
  providerLabel: string;
  createdAt: string;
  lastLoginAt: string;
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ShopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/shop-users', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setUsers(data.users ?? []);
      })
      .catch(() => setError('Failed to load customers'))
      .finally(() => setLoading(false));
  }, []);

  const byProvider = users.reduce<Record<string, number>>((acc, u) => {
    const key = providerLabel(u.provider);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: '24px 28px 48px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a202c', margin: '0 0 8px' }}>Shop customers</h1>
      <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 15 }}>
        Everyone who signed in to place orders — and which method they used (Google, Apple, or Email).
      </p>

      {!loading && !error && users.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {Object.entries(byProvider).map(([label, count]) => (
            <span
              key={label}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                background: '#f1f5f9',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
              }}
            >
              {label}: {count}
            </span>
          ))}
        </div>
      ) : null}

      {loading ? <p style={{ color: '#64748b' }}>Loading users…</p> : null}
      {error ? <p style={{ color: '#c62828' }}>{error}</p> : null}

      {!loading && !error && users.length === 0 ? (
        <p style={{ color: '#64748b' }}>No customer logins yet.</p>
      ) : null}

      {!loading && !error && users.length > 0 ? (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Customer</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Email</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Login method</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Last login</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          position: 'relative',
                          background: '#e2e8f0',
                          flexShrink: 0,
                        }}
                      >
                        {u.image ? (
                          <Image src={u.image} alt="" fill sizes="36px" style={{ objectFit: 'cover' }} unoptimized />
                        ) : null}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1a202c' }}>{u.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{u.email || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        background:
                          u.provider === 'google'
                            ? '#dbeafe'
                            : u.provider === 'apple'
                              ? '#f1f5f9'
                              : '#fef3c7',
                        color:
                          u.provider === 'google'
                            ? '#1d4ed8'
                            : u.provider === 'apple'
                              ? '#0f172a'
                              : '#92400e',
                      }}
                    >
                      {u.providerLabel}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#475569', whiteSpace: 'nowrap' }}>
                    {formatDate(u.lastLoginAt)}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
