'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminLoading from '@/components/admin/AdminLoading';
import ConnectionProblem from '@/components/network/ConnectionProblem';
import { clientFetch, NetworkError } from '@/lib/client-fetch';
import type { FetchErrorKind } from '@/lib/is-network-error';
import type { SupportTicketStatus } from '@/lib/support-tickets-schema';
import type { AdminSupportTicket } from '@/lib/support-tickets';
import './admin-support.css';

type StatusFilter = 'all' | SupportTicketStatus;

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
  { id: 'all', label: 'All' },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function badgeClass(status: SupportTicketStatus): string {
  return `asp-badge asp-badge--${status}`;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>('open');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<FetchErrorKind | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});

  const loadTickets = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    const q = filter === 'all' ? '?status=all' : `?status=${filter}`;
    clientFetch(`/api/admin/support/tickets${q}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setTickets(data.tickets ?? []);
        setOpenCount(Number(data.openCount ?? 0));
        const drafts: Record<number, string> = {};
        for (const t of data.tickets ?? []) {
          drafts[t.id] = t.adminNotes;
        }
        setNotesDraft(drafts);
      })
      .catch((err) => {
        if (err instanceof NetworkError) setFetchError(err.kind);
        else toast.error('Failed to load support tickets');
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const saveTicket = async (id: number, status: SupportTicketStatus) => {
    setBusyId(id);
    try {
      const res = await clientFetch('/api/admin/support/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          adminNotes: notesDraft[id] ?? '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      toast.success('Ticket updated');
      loadTickets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <AdminLoading message="Loading support tickets…" />;

  if (fetchError) {
    return (
      <ConnectionProblem
        kind={fetchError}
        onRetry={() => loadTickets()}
        retryLabel="Reload tickets"
      />
    );
  }

  return (
    <div className="asp-page">
      <header className="asp-head">
        <h1>Customer support</h1>
        <p>
          Messages from the About page support form.{' '}
          <strong>{openCount}</strong> open ticket{openCount === 1 ? '' : 's'}.
        </p>
      </header>

      <div className="asp-tabs" role="tablist" aria-label="Ticket status">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            className={`asp-tab${filter === tab.id ? ' asp-tab--active' : ''}`}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <p className="asp-empty">No tickets in this category.</p>
      ) : (
        <div className="asp-list">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="asp-card">
              <div className="asp-card__top">
                <div>
                  <p className="asp-card__name">{ticket.name}</p>
                  <p className="asp-card__meta">
                    {formatDate(ticket.createdAt)}
                    {ticket.email ? ` · ${ticket.email}` : ''}
                    {ticket.phone ? ` · ${ticket.phone}` : ''}
                    {ticket.shopUserId ? ` · User #${ticket.shopUserId}` : ''}
                  </p>
                </div>
                <span className={badgeClass(ticket.status)}>{ticket.status.replace('_', ' ')}</span>
              </div>

              <p className="asp-subject">{ticket.subject}</p>
              <p className="asp-message">{ticket.message}</p>

              <label className="sr-only" htmlFor={`notes-${ticket.id}`}>
                Admin notes
              </label>
              <textarea
                id={`notes-${ticket.id}`}
                className="asp-notes"
                value={notesDraft[ticket.id] ?? ''}
                onChange={(e) =>
                  setNotesDraft((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                }
                placeholder="Internal notes (optional)"
                maxLength={2000}
              />

              <div className="asp-actions">
                <select
                  value={ticket.status}
                  onChange={(e) => void saveTicket(ticket.id, e.target.value as SupportTicketStatus)}
                  disabled={busyId === ticket.id}
                  aria-label="Ticket status"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  type="button"
                  className="asp-btn"
                  disabled={busyId === ticket.id}
                  onClick={() => void saveTicket(ticket.id, ticket.status)}
                >
                  {busyId === ticket.id ? 'Saving…' : 'Save notes'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
