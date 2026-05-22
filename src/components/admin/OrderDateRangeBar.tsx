'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type Props = {
  filterToday: boolean;
  onClearToday: () => void;
};

export default function OrderDateRangeBar({ filterToday, onClearToday }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  const applyRange = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('period');
    params.delete('page');
    if (from) params.set('from', from);
    else params.delete('from');
    if (to) params.set('to', to);
    else params.delete('to');
    const qs = params.toString();
    router.push(qs ? `/khanadmin/orders?${qs}` : '/khanadmin/orders');
  };

  const clearRange = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('from');
    params.delete('to');
    params.delete('page');
    const qs = params.toString();
    router.push(qs ? `/khanadmin/orders?${qs}` : '/khanadmin/orders');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '12px 14px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
      }}
    >
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Date range</span>
      <input
        type="date"
        value={from}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value) params.set('from', e.target.value);
          else params.delete('from');
          params.delete('page');
          router.push(`/khanadmin/orders?${params.toString()}`);
        }}
        style={{
          padding: '8px 10px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          fontSize: '13px',
        }}
      />
      <span style={{ color: '#94a3b8', fontSize: '13px' }}>to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value) params.set('to', e.target.value);
          else params.delete('to');
          params.delete('page');
          router.push(`/khanadmin/orders?${params.toString()}`);
        }}
        style={{
          padding: '8px 10px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          fontSize: '13px',
        }}
      />
      <button
        type="button"
        onClick={applyRange}
        style={{
          padding: '8px 14px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#1E293B',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        Apply
      </button>
      {(from || to) && !filterToday ? (
        <button
          type="button"
          onClick={clearRange}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#fff',
            color: '#64748b',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Clear dates
        </button>
      ) : null}
      {filterToday ? (
        <button
          type="button"
          onClick={onClearToday}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #10B981',
            backgroundColor: '#ecfdf5',
            color: '#059669',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Clear today filter
        </button>
      ) : null}
    </div>
  );
}
