'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { providerLabel } from '@/lib/shop-users-labels';
import AdminLoading from '@/components/admin/AdminLoading';
import ConnectionProblem from '@/components/network/ConnectionProblem';
import { clientFetch, NetworkError } from '@/lib/client-fetch';
import type { FetchErrorKind } from '@/lib/is-network-error';
import './admin-users.css';

type ShopUser = {
  id: number;
  email: string | null;
  name: string | null;
  image: string | null;
  phone: string | null;
  city: string | null;
  provider: string;
  providerLabel: string;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string;
};

type UserStats = {
  total: number;
  active: number;
  blocked: number;
};

type StatusFilter = 'all' | 'active' | 'blocked';

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

function providerBadgeClass(provider: string): string {
  if (provider === 'google') return 'au-badge au-badge--google';
  if (provider === 'apple') return 'au-badge au-badge--apple';
  return 'au-badge au-badge--email';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ShopUser[]>([]);
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, blocked: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState<FetchErrorKind | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadUsers = () => {
    setLoading(true);
    setError('');
    setFetchError(null);
    clientFetch('/api/admin/shop-users', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setUsers(data.users ?? []);
        setStats(data.stats ?? { total: 0, active: 0, blocked: 0 });
      })
      .catch((err) => {
        if (err instanceof NetworkError) {
          setFetchError(err.kind);
        } else {
          setError('Failed to load users');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const byProvider = users.reduce<Record<string, number>>((acc, u) => {
    const key = providerLabel(u.provider);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter === 'active' && u.isBlocked) return false;
      if (statusFilter === 'blocked' && !u.isBlocked) return false;
      if (!q) return true;
      return (
        (u.name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.phone ?? '').toLowerCase().includes(q) ||
        String(u.id).includes(q)
      );
    });
  }, [users, search, statusFilter]);

  const patchUser = async (userId: number, blocked: boolean) => {
    setBusyId(userId);
    try {
      const res = await clientFetch(`/api/admin/shop-users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setUsers((prev) => {
        const next = prev.map((u) => (u.id === userId ? { ...u, isBlocked: blocked } : u));
        const blockedCount = next.filter((x) => x.isBlocked).length;
        setStats({
          total: next.length,
          blocked: blockedCount,
          active: next.length - blockedCount,
        });
        return next;
      });
      toast.success(blocked ? 'User blocked' : 'User unblocked');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update user');
    } finally {
      setBusyId(null);
    }
  };

  const handleBlock = (u: ShopUser) => {
    const label = u.name || u.email || `User #${u.id}`;
    if (
      !window.confirm(
        `Block "${label}"?\n\nThey will not be able to sign in or place new orders.`,
      )
    ) {
      return;
    }
    void patchUser(u.id, true);
  };

  const handleUnblock = (u: ShopUser) => {
    void patchUser(u.id, false);
  };

  const handleDelete = async (u: ShopUser) => {
    const label = u.name || u.email || `User #${u.id}`;
    if (
      !window.confirm(
        `Delete "${label}" permanently?\n\nThis removes their shop account. Past orders are kept.`,
      )
    ) {
      return;
    }

    setBusyId(u.id);
    try {
      const res = await clientFetch(`/api/admin/shop-users/${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setUsers((prev) => {
        const next = prev.filter((x) => x.id !== u.id);
        const blockedCount = next.filter((x) => x.isBlocked).length;
        setStats({
          total: next.length,
          blocked: blockedCount,
          active: next.length - blockedCount,
        });
        return next;
      });
      toast.success('User deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete user');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="au-page">
      <header className="au-header">
        <h1>Users</h1>
        <p>Shop accounts that signed in to browse and place orders (Google, Apple, or email).</p>
      </header>

      {!loading && !error && users.length > 0 ? (
        <div className="au-stats">
          <div className="au-stat">
            <div className="au-stat__label">Total</div>
            <div className="au-stat__value">{stats.total}</div>
          </div>
          <div className="au-stat">
            <div className="au-stat__label">Active</div>
            <div className="au-stat__value">{stats.active}</div>
          </div>
          <div className="au-stat au-stat--blocked">
            <div className="au-stat__label">Blocked</div>
            <div className="au-stat__value">{stats.blocked}</div>
          </div>
        </div>
      ) : null}

      {!loading && !error && Object.keys(byProvider).length > 0 ? (
        <div className="au-provider-chips">
          {Object.entries(byProvider).map(([label, count]) => (
            <span key={label} className="au-provider-chip">
              {label}: {count}
            </span>
          ))}
        </div>
      ) : null}

      {!loading && !error && users.length > 0 ? (
        <div className="au-toolbar">
          <input
            type="search"
            className="au-search"
            placeholder="Search name, email, phone, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users"
          />
          <div className="au-filter" role="group" aria-label="Filter by status">
            {(['all', 'active', 'blocked'] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={statusFilter === key ? 'is-active' : ''}
                onClick={() => setStatusFilter(key)}
              >
                {key === 'all' ? 'All' : key === 'active' ? 'Active' : 'Blocked'}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {loading ? (
        <AdminLoading
          message="Loading users"
          subMessage="Storefront accounts (Google, Apple, email)"
          variant="section"
        />
      ) : null}

      {fetchError ? (
        <ConnectionProblem
          theme="admin"
          kind={fetchError}
          variant="section"
          onRetry={loadUsers}
          homeHref="/khanadmin"
          homeLabel="Dashboard"
        />
      ) : null}
      {error ? <p style={{ color: '#c62828' }}>{error}</p> : null}

      {!loading && !error && users.length === 0 ? (
        <p className="au-empty">No users have signed in to the shop yet.</p>
      ) : null}

      {!loading && !error && users.length > 0 && filtered.length === 0 ? (
        <p className="au-empty">No users match your search or filter.</p>
      ) : null}

      {!loading && !error && filtered.length > 0 ? (
        <div className="au-table-wrap">
          <table className="au-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Login</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className={u.isBlocked ? 'is-blocked' : ''}>
                  <td>
                    <div className="au-user-cell">
                      <div className="au-avatar">
                        {u.image ? (
                          <Image
                            src={u.image}
                            alt=""
                            fill
                            sizes="36px"
                            style={{ objectFit: 'cover' }}
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="au-user-name">{u.name || '—'}</div>
                        {u.phone ? <div className="au-user-phone">{u.phone}</div> : null}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#475569' }}>{u.email || '—'}</td>
                  <td>
                    <span className={providerBadgeClass(u.provider)}>{u.providerLabel}</span>
                  </td>
                  <td>
                    {u.isBlocked ? (
                      <span className="au-badge au-badge--blocked">Blocked</span>
                    ) : (
                      <span className="au-badge au-badge--active">Active</span>
                    )}
                  </td>
                  <td style={{ color: '#475569', whiteSpace: 'nowrap' }}>
                    {formatDate(u.lastLoginAt)}
                  </td>
                  <td>
                    <div className="au-actions">
                      {u.isBlocked ? (
                        <button
                          type="button"
                          className="au-btn au-btn--unblock"
                          disabled={busyId === u.id}
                          onClick={() => handleUnblock(u)}
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="au-btn au-btn--block"
                          disabled={busyId === u.id}
                          onClick={() => handleBlock(u)}
                        >
                          Block
                        </button>
                      )}
                      <button
                        type="button"
                        className="au-btn au-btn--delete"
                        disabled={busyId === u.id}
                        onClick={() => void handleDelete(u)}
                      >
                        Delete
                      </button>
                    </div>
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
